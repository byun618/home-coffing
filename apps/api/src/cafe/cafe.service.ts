import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { randomInt } from 'crypto';
import {
  Cafe,
  CafeUser,
  CafeUserRole,
  Invitation,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { CafeResponse, InvitationResponse, UpdateCafeDto } from './dto';

const INVITATION_TTL_DAYS = 7;
// 혼동되는 0/O/1/I 제외, 32자
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const CODE_MAX_RETRIES = 5;

function generateShortCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return code;
}

const SHORT_CODE_REGEX = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

@Injectable()
export class CafeService {
  constructor(private readonly em: EntityManager) {}

  async getCafe(cafeId: number): Promise<CafeResponse> {
    const cafe = await this.em.findOne(
      Cafe,
      { id: cafeId },
      { populate: ['members', 'members.user'] },
    );
    if (!cafe) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    return {
      id: cafe.id,
      name: cafe.name,
      createdAt: cafe.createdAt,
      members: cafe.members.getItems().map((membership) => ({
        userId: membership.user.id,
        email: membership.user.email,
        displayName: membership.user.displayName,
        role: membership.role,
        joinedAt: membership.joinedAt,
      })),
    };
  }

  async updateCafe(cafeId: number, dto: UpdateCafeDto): Promise<CafeResponse> {
    const cafe = await this.em.findOne(Cafe, { id: cafeId });
    if (!cafe) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    if (dto.name !== undefined) {
      cafe.name = dto.name;
    }
    await this.em.flush();

    return this.getCafe(cafeId);
  }

  /**
   * 본인 떠나기. 본인이 마지막 admin이고 다른 멤버 ≥1 시 차단(LAST_ADMIN).
   * 멤버가 본인뿐이면 Cafe도 함께 삭제(cascade).
   * defaultCafe로 지정한 다른 사용자 있으면 nullify.
   */
  async leaveCafe(cafeId: number, userId: number): Promise<void> {
    return this.em.transactional(async (em) => {
      const membership = await em.findOne(CafeUser, {
        user: userId,
        cafe: cafeId,
      });
      if (!membership) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }

      const otherMembers = await em.count(CafeUser, {
        cafe: cafeId,
        user: { $ne: userId },
      });

      if (membership.role === CafeUserRole.ADMIN) {
        const otherAdmins = await em.count(CafeUser, {
          cafe: cafeId,
          role: CafeUserRole.ADMIN,
          user: { $ne: userId },
        });
        if (otherAdmins === 0 && otherMembers > 0) {
          throw new ApiError(HttpStatus.CONFLICT, Errors.LAST_ADMIN);
        }
      }

      em.remove(membership);

      const usersWithDefault = await em.find(User, { defaultCafe: cafeId });
      for (const user of usersWithDefault) {
        user.defaultCafe = null;
      }

      if (otherMembers === 0) {
        const cafe = await em.findOne(Cafe, { id: cafeId });
        if (cafe) em.remove(cafe);
      }

      await em.flush();
    });
  }

  async createInvitation(
    cafeId: number,
    invitedById: number,
  ): Promise<InvitationResponse> {
    const cafe = await this.em.findOne(Cafe, { id: cafeId });
    if (!cafe) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    const invitedBy = await this.em.findOne(User, { id: invitedById });
    if (!invitedBy) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    // 활성 초대(미수락 + 미만료 + 신 형식) 있으면 재사용. 옛 UUID 형식은 무시.
    const active = await this.em.findOne(
      Invitation,
      {
        cafe: cafeId,
        acceptedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { orderBy: { createdAt: 'DESC' } },
    );
    if (active && SHORT_CODE_REGEX.test(active.code)) {
      return {
        id: active.id,
        code: active.code,
        expiresAt: active.expiresAt,
        invitedBy: active.invitedBy.id,
      };
    }

    let code = generateShortCode();
    for (let attempt = 0; attempt < CODE_MAX_RETRIES; attempt++) {
      const collision = await this.em.findOne(Invitation, { code });
      if (!collision) break;
      code = generateShortCode();
    }

    const invitation = this.em.create(Invitation, {
      cafe,
      invitedBy,
      code,
      expiresAt: new Date(
        Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
      ),
    });
    this.em.persist(invitation);
    await this.em.flush();

    return {
      id: invitation.id,
      code: invitation.code,
      expiresAt: invitation.expiresAt,
      invitedBy: invitedById,
    };
  }
}

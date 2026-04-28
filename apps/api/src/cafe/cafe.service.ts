import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { v4 as uuidv4 } from 'uuid';
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

    const invitation = this.em.create(Invitation, {
      cafe,
      invitedBy,
      code: uuidv4(),
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

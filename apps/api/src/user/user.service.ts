import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Cafe, CafeUser, CafeUserRole, User } from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { MeResponse, UpdateMeDto } from './dto';

@Injectable()
export class UserService {
  constructor(private readonly em: EntityManager) {}

  async getMe(userId: number): Promise<MeResponse> {
    const user = await this.em.findOne(
      User,
      { id: userId },
      { populate: ['memberships', 'memberships.cafe'] },
    );
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      defaultCafeId: user.defaultCafe?.id ?? null,
      memberships: user.memberships.getItems().map((membership) => ({
        cafeId: membership.cafe.id,
        cafeName: membership.cafe.name,
        role: membership.role,
        joinedAt: membership.joinedAt,
      })),
    };
  }

  async updateMe(userId: number, dto: UpdateMeDto): Promise<MeResponse> {
    const user = await this.em.findOne(User, { id: userId });
    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName;
    }

    if (dto.defaultCafeId !== undefined) {
      const membership = await this.em.findOne(CafeUser, {
        user: userId,
        cafe: dto.defaultCafeId,
      });
      if (!membership) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }
      const cafe = await this.em.findOne(Cafe, { id: dto.defaultCafeId });
      if (!cafe) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      user.defaultCafe = cafe;
    }

    await this.em.flush();
    return this.getMe(userId);
  }

  /**
   * 회원 탈퇴 — 본인이 마지막 admin이고 다른 멤버가 1명 이상인 Cafe가 있으면 차단.
   * 통과 시 User 삭제 → CafeUser cascade. Cafe 자체는 cascade 대상 아님 (멤버 0 = 자연 소멸).
   */
  async deleteMe(userId: number): Promise<void> {
    return this.em.transactional(async (em) => {
      const memberships = await em.find(
        CafeUser,
        { user: userId },
        { populate: ['cafe'] },
      );

      for (const membership of memberships) {
        if (membership.role !== CafeUserRole.ADMIN) continue;

        const otherAdmins = await em.count(CafeUser, {
          cafe: membership.cafe.id,
          role: CafeUserRole.ADMIN,
          user: { $ne: userId },
        });
        if (otherAdmins > 0) continue;

        const otherMembers = await em.count(CafeUser, {
          cafe: membership.cafe.id,
          user: { $ne: userId },
        });
        if (otherMembers > 0) {
          throw new ApiError(HttpStatus.CONFLICT, Errors.LAST_ADMIN);
        }
      }

      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      em.remove(user);
      await em.flush();
    });
  }
}

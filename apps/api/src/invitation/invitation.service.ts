import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  CafeUser,
  CafeUserRole,
  Invitation,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { AcceptInvitationResponse } from './dto';

@Injectable()
export class InvitationService {
  constructor(private readonly em: EntityManager) {}

  async accept(
    code: string,
    userId: number,
  ): Promise<AcceptInvitationResponse> {
    return this.em.transactional(async (em) => {
      const invitation = await em.findOne(
        Invitation,
        { code },
        { populate: ['cafe', 'invitedBy'] },
      );
      if (!invitation) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.INVITATION_NOT_FOUND);
      }
      if (invitation.expiresAt < new Date()) {
        throw new ApiError(HttpStatus.GONE, Errors.INVITATION_EXPIRED);
      }

      const existing = await em.findOne(CafeUser, {
        user: userId,
        cafe: invitation.cafe.id,
      });
      if (existing) {
        throw new ApiError(HttpStatus.CONFLICT, Errors.ALREADY_MEMBER);
      }

      const user = await em.findOne(User, { id: userId });
      if (!user) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }

      const membership = em.create(CafeUser, {
        user,
        cafe: invitation.cafe,
        role: CafeUserRole.MEMBER,
      });
      em.persist(membership);

      invitation.acceptedBy = user;
      invitation.acceptedAt = new Date();

      user.defaultCafe = invitation.cafe;

      await em.flush();

      return {
        cafeId: invitation.cafe.id,
        cafeName: invitation.cafe.name,
        role: CafeUserRole.MEMBER,
        invitationId: invitation.id,
        invitedBy: invitation.invitedBy.id,
      };
    });
  }
}

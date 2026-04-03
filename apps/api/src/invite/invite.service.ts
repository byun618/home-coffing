import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Invite, CafeMember, User } from '../common/entities';
import type { InviteInfo } from '@home-coffing/shared-types';

@Injectable()
export class InviteService {
  constructor(private readonly em: EntityManager) {}

  async create(
    user: User,
    params: { expiresInHours?: number },
  ): Promise<{ token: string }> {
    const membership = await this.em.findOneOrFail(CafeMember, {
      user,
      role: 'admin',
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (params.expiresInHours ?? 48));

    const invite = this.em.create(Invite, {
      cafe: membership.cafe,
      invitedBy: user,
      expiresAt,
    });

    await this.em.persistAndFlush(invite);

    return { token: invite.token };
  }

  async getInfo(token: string): Promise<InviteInfo> {
    const invite = await this.em.findOne(
      Invite,
      { token },
      { populate: ['cafe', 'invitedBy'] },
    );

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없어요');
    }

    return {
      cafeName: invite.cafe.name,
      invitedByName: invite.invitedBy.name,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }

  async accept(user: User, token: string): Promise<void> {
    const invite = await this.em.findOne(
      Invite,
      { token },
      { populate: ['cafe'] },
    );

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없어요');
    }
    if (invite.usedAt) {
      throw new ConflictException('이미 사용된 초대에요');
    }
    if (invite.expiresAt < new Date()) {
      throw new ForbiddenException('만료된 초대에요');
    }

    const existing = await this.em.findOne(CafeMember, {
      cafe: invite.cafe,
      user,
    });
    if (existing) {
      throw new ConflictException('이미 카페 멤버에요');
    }

    const member = this.em.create(CafeMember, {
      cafe: invite.cafe,
      user,
      role: 'member',
    });

    invite.usedAt = new Date();
    invite.usedBy = user;

    await this.em.persistAndFlush(member);
  }
}

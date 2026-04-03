import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { CafeMember, User } from '../common/entities';
import type { CafeInfo, CafeMember as CafeMemberDto } from '@home-coffing/shared-types';

@Injectable()
export class CafeService {
  constructor(private readonly em: EntityManager) {}

  async getInfo(user: User): Promise<CafeInfo> {
    const membership = await this.em.findOneOrFail(
      CafeMember,
      { user },
      { populate: ['cafe'] },
    );
    const memberCount = await this.em.count(CafeMember, {
      cafe: membership.cafe,
    });

    return {
      id: membership.cafe.id,
      name: membership.cafe.name,
      memberCount,
    };
  }

  async getMembers(user: User): Promise<CafeMemberDto[]> {
    const membership = await this.em.findOneOrFail(CafeMember, { user });
    const members = await this.em.find(
      CafeMember,
      { cafe: membership.cafe },
      { populate: ['user'] },
    );

    return members.map((member) => ({
      id: member.id,
      userId: member.user.id,
      userName: member.user.name,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    }));
  }
}

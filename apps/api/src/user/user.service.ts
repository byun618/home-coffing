import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { User } from '../common/entities';
import type { UserProfile } from '@home-coffing/shared-types';

@Injectable()
export class UserService {
  constructor(private readonly em: EntityManager) {}

  async saveOnboarding(
    user: User,
    params: { defaultCupsPerDay: number; defaultGramsPerCup: number },
  ): Promise<UserProfile> {
    user.defaultCupsPerDay = params.defaultCupsPerDay;
    user.defaultGramsPerCup = params.defaultGramsPerCup;
    await this.em.flush();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      defaultCupsPerDay: user.defaultCupsPerDay,
      defaultGramsPerCup: user.defaultGramsPerCup,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

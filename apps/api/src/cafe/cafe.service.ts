import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Cafe } from '../common/entities';
import type { CafeInfo } from '@home-coffing/shared-types';

@Injectable()
export class CafeService {
  constructor(private readonly em: EntityManager) {}

  async getOrCreate(): Promise<Cafe> {
    const cafes = await this.em.find(Cafe, {}, { limit: 1 });
    let cafe = cafes[0] ?? null;
    if (!cafe) {
      cafe = this.em.create(Cafe, {});
      await this.em.persistAndFlush(cafe);
    }
    return cafe;
  }

  async getInfo(): Promise<CafeInfo> {
    const cafe = await this.getOrCreate();
    return {
      id: cafe.id,
      name: cafe.name,
    };
  }
}

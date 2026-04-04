import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/mysql';
import { Bean, Consumption } from '../common/entities';

@Injectable()
export class ConsumptionService {
  constructor(private readonly em: EntityManager) {}

  async list(params: { beanId?: number; limit: number; offset: number }) {
    const where: FilterQuery<Consumption> = {};
    if (params.beanId) {
      where.bean = { id: params.beanId };
    }

    const [items, total] = await this.em.findAndCount(
      Consumption,
      where,
      {
        orderBy: { createdAt: 'DESC' },
        limit: params.limit,
        offset: params.offset,
        populate: ['bean'],
      },
    );

    return {
      items: items.map((c) => ({
        id: c.id,
        beanId: c.bean.id,
        beanName: c.bean.name,
        amount: Number(c.amount),
        createdAt: c.createdAt.toISOString(),
      })),
      total,
    };
  }

  async create(params: { items: { beanId: number; amount: number }[] }) {
    const results: { beanId: number; remainAmount: number }[] = [];

    for (const item of params.items) {
      const bean = await this.em.findOne(Bean, { id: item.beanId });
      if (!bean) throw new NotFoundException(`원두(${item.beanId})를 찾을 수 없어요`);

      const consumption = this.em.create(Consumption, {
        bean,
        amount: item.amount,
      });
      this.em.persist(consumption);

      bean.remainAmount = Math.max(0, Number(bean.remainAmount) - item.amount);
      results.push({ beanId: bean.id, remainAmount: Number(bean.remainAmount) });
    }

    await this.em.flush();
    return { results };
  }
}

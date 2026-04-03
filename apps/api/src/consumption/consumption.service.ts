import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean, CafeMember, Consumption, User } from '../common/entities';

@Injectable()
export class ConsumptionService {
  constructor(private readonly em: EntityManager) {}

  async create(
    user: User,
    beanId: number,
    params: {
      amount: number;
      water?: number;
      grindSize?: string;
      method?: string;
      note?: string;
    },
  ) {
    const membership = await this.em.findOneOrFail(CafeMember, { user });
    const bean = await this.em.findOne(
      Bean,
      { id: beanId },
      { populate: ['cafe'] },
    );

    if (!bean) {
      throw new NotFoundException('원두를 찾을 수 없어요');
    }
    if (bean.cafe.id !== membership.cafe.id) {
      throw new ForbiddenException('접근 권한이 없어요');
    }

    const consumption = this.em.create(Consumption, {
      bean,
      user,
      amount: params.amount,
      water: params.water ?? null,
      grindSize: params.grindSize ?? null,
      method: params.method ?? null,
      note: params.note ?? null,
    });

    bean.remainAmount = Math.max(0, Number(bean.remainAmount) - params.amount);

    await this.em.persistAndFlush(consumption);

    return { remainAmount: Number(bean.remainAmount) };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean, CafeMember, Consumption, User } from '../common/entities';
import type { BeanWithStats, BeanStatus } from '@home-coffing/shared-types';

@Injectable()
export class BeanService {
  constructor(private readonly em: EntityManager) {}

  async list(user: User): Promise<BeanWithStats[]> {
    const membership = await this.em.findOneOrFail(CafeMember, { user });
    const beans = await this.em.find(Bean, { cafe: membership.cafe });

    return Promise.all(
      beans.map((bean) => this.buildBeanWithStats(bean, user)),
    );
  }

  async create(
    user: User,
    params: {
      name: string;
      totalAmount: number;
      roastDate: string;
      perCup: number;
      deliveryDays: number;
      degassingDays: number;
    },
  ): Promise<BeanWithStats> {
    const membership = await this.em.findOneOrFail(CafeMember, { user });

    const bean = this.em.create(Bean, {
      cafe: membership.cafe,
      name: params.name,
      totalAmount: params.totalAmount,
      remainAmount: params.totalAmount,
      roastDate: new Date(params.roastDate),
      perCup: params.perCup,
      deliveryDays: params.deliveryDays,
      degassingDays: params.degassingDays,
      createdBy: user,
    });

    await this.em.persistAndFlush(bean);
    return this.buildBeanWithStats(bean, user);
  }

  async update(
    user: User,
    beanId: number,
    params: {
      name?: string;
      totalAmount?: number;
      roastDate?: string;
      perCup?: number;
      deliveryDays?: number;
      degassingDays?: number;
    },
  ): Promise<BeanWithStats> {
    const bean = await this.findBeanForUser(user, beanId);

    if (params.name !== undefined) bean.name = params.name;
    if (params.totalAmount !== undefined) {
      const diff = params.totalAmount - bean.totalAmount;
      bean.totalAmount = params.totalAmount;
      bean.remainAmount = Math.max(0, bean.remainAmount + diff);
    }
    if (params.roastDate !== undefined)
      bean.roastDate = new Date(params.roastDate);
    if (params.perCup !== undefined) bean.perCup = params.perCup;
    if (params.deliveryDays !== undefined)
      bean.deliveryDays = params.deliveryDays;
    if (params.degassingDays !== undefined)
      bean.degassingDays = params.degassingDays;

    await this.em.flush();
    return this.buildBeanWithStats(bean, user);
  }

  async remove(user: User, beanId: number): Promise<void> {
    const bean = await this.findBeanForUser(user, beanId);
    await this.em.removeAndFlush(bean);
  }

  async buildBeanWithStats(bean: Bean, user: User): Promise<BeanWithStats> {
    const dailyConsumption = await this.calcDailyConsumption(bean, user);
    const rop = this.calcRop(bean, dailyConsumption);
    const remainCups =
      bean.perCup > 0 ? Math.floor(bean.remainAmount / bean.perCup) : 0;
    const remainDays =
      dailyConsumption > 0
        ? Math.floor(bean.remainAmount / dailyConsumption)
        : 999;
    const progress =
      bean.totalAmount > 0
        ? Math.round(
            ((bean.totalAmount - bean.remainAmount) / bean.totalAmount) * 100,
          )
        : 0;
    const status: BeanStatus =
      bean.remainAmount <= rop ? 'order' : 'safe';

    return {
      id: bean.id,
      cafeId: bean.cafe.id,
      name: bean.name,
      totalAmount: Number(bean.totalAmount),
      remainAmount: Number(bean.remainAmount),
      roastDate: bean.roastDate instanceof Date
        ? bean.roastDate.toISOString().split('T')[0]
        : String(bean.roastDate),
      perCup: Number(bean.perCup),
      deliveryDays: bean.deliveryDays,
      degassingDays: bean.degassingDays,
      createdBy: bean.createdBy.id,
      createdAt: bean.createdAt.toISOString(),
      remainCups,
      remainDays,
      progress,
      rop,
      status,
      dailyConsumption,
    };
  }

  private async calcDailyConsumption(
    bean: Bean,
    user: User,
  ): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const consumptions = await this.em.find(Consumption, {
      bean,
      createdAt: { $gte: sevenDaysAgo },
    });

    if (consumptions.length > 0) {
      const total = consumptions.reduce(
        (sum, consumption) => sum + Number(consumption.amount),
        0,
      );
      return total / 7;
    }

    const cupsPerDay = user.defaultCupsPerDay ?? 2;
    const gramsPerCup = user.defaultGramsPerCup ?? 20;
    return cupsPerDay * gramsPerCup;
  }

  private calcRop(bean: Bean, dailyConsumption: number): number {
    const leadTime = bean.deliveryDays + bean.degassingDays;
    const safetyStock = dailyConsumption * 2;
    return Math.round(dailyConsumption * leadTime + safetyStock);
  }

  private async findBeanForUser(user: User, beanId: number): Promise<Bean> {
    const membership = await this.em.findOneOrFail(CafeMember, { user });
    const bean = await this.em.findOne(
      Bean,
      { id: beanId },
      { populate: ['cafe', 'createdBy'] },
    );

    if (!bean) {
      throw new NotFoundException('원두를 찾을 수 없어요');
    }
    if (bean.cafe.id !== membership.cafe.id) {
      throw new ForbiddenException('접근 권한이 없어요');
    }

    return bean;
  }
}

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Bean, Consumption } from '../common/entities';
import { CafeService } from '../cafe/cafe.service';
import type { BeanWithStats, BeanStatus } from '@home-coffing/shared-types';

@Injectable()
export class BeanService {
  constructor(
    private readonly em: EntityManager,
    private readonly cafeService: CafeService,
  ) {}

  async list(): Promise<BeanWithStats[]> {
    const cafe = await this.cafeService.getOrCreate();
    const beans = await this.em.find(Bean, { cafe });
    return Promise.all(beans.map((bean) => this.buildBeanWithStats(bean)));
  }

  async create(params: {
    name: string;
    totalAmount: number;
    orderedAt: string;
    roastDate: string;
    arrivedAt?: string;
    degassingDays: number;
    cupsPerDay: number;
    gramsPerCup: number;
  }): Promise<BeanWithStats> {
    const cafe = await this.cafeService.getOrCreate();
    const bean = this.em.create(Bean, {
      cafe,
      name: params.name,
      totalAmount: params.totalAmount,
      remainAmount: params.totalAmount,
      orderedAt: new Date(params.orderedAt),
      roastDate: new Date(params.roastDate),
      arrivedAt: params.arrivedAt ? new Date(params.arrivedAt) : null,
      degassingDays: params.degassingDays,
      cupsPerDay: params.cupsPerDay,
      gramsPerCup: params.gramsPerCup,
    });
    await this.em.persistAndFlush(bean);
    return this.buildBeanWithStats(bean);
  }

  async update(
    beanId: number,
    params: {
      name?: string;
      totalAmount?: number;
      orderedAt?: string;
      roastDate?: string;
      arrivedAt?: string | null;
      degassingDays?: number;
      cupsPerDay?: number;
      gramsPerCup?: number;
    },
  ): Promise<BeanWithStats> {
    const bean = await this.findBean(beanId);
    if (params.name !== undefined) bean.name = params.name;
    if (params.totalAmount !== undefined) {
      const diff = params.totalAmount - bean.totalAmount;
      bean.totalAmount = params.totalAmount;
      bean.remainAmount = Math.max(0, bean.remainAmount + diff);
    }
    if (params.orderedAt !== undefined) bean.orderedAt = new Date(params.orderedAt);
    if (params.roastDate !== undefined) bean.roastDate = new Date(params.roastDate);
    if (params.arrivedAt !== undefined) bean.arrivedAt = params.arrivedAt ? new Date(params.arrivedAt) : null;
    if (params.degassingDays !== undefined) bean.degassingDays = params.degassingDays;
    if (params.cupsPerDay !== undefined) bean.cupsPerDay = params.cupsPerDay;
    if (params.gramsPerCup !== undefined) bean.gramsPerCup = params.gramsPerCup;

    await this.em.flush();
    return this.buildBeanWithStats(bean);
  }

  async remove(beanId: number): Promise<void> {
    const bean = await this.findBean(beanId);
    const consumptions = await this.em.find(Consumption, { bean });
    for (const c of consumptions) {
      this.em.remove(c);
    }
    this.em.remove(bean);
    await this.em.flush();
  }

  async buildBeanWithStats(bean: Bean): Promise<BeanWithStats> {
    const dailyConsumption = await this.calcDailyConsumption(bean);
    const deliveryLeadTime = this.calcDeliveryLeadTime(bean);
    const rop = this.calcRop(bean, dailyConsumption, deliveryLeadTime);
    const progress = Number(bean.totalAmount) > 0
      ? Math.round(((Number(bean.totalAmount) - Number(bean.remainAmount)) / Number(bean.totalAmount)) * 100)
      : 0;

    const remain = Number(bean.remainAmount);
    let status: BeanStatus;

    // 디개싱 중 체크
    const roastDate = new Date(bean.roastDate);
    const degassingEnd = new Date(roastDate);
    degassingEnd.setDate(degassingEnd.getDate() + bean.degassingDays);
    const now = new Date();

    if (remain <= 0) {
      status = 'empty';
    } else if (now < degassingEnd) {
      status = 'degassing';
    } else if (remain <= rop) {
      status = 'order';
    } else if (remain <= rop * 1.5) {
      status = 'soon';
    } else {
      status = 'safe';
    }

    const formatDate = (d: Date | string | null): string | null => {
      if (!d) return null;
      if (d instanceof Date) return d.toISOString().split('T')[0];
      return String(d);
    };

    return {
      id: bean.id,
      cafeId: bean.cafe.id,
      name: bean.name,
      totalAmount: Number(bean.totalAmount),
      remainAmount: Number(bean.remainAmount),
      orderedAt: formatDate(bean.orderedAt)!,
      roastDate: formatDate(bean.roastDate)!,
      arrivedAt: formatDate(bean.arrivedAt),
      degassingDays: bean.degassingDays,
      cupsPerDay: Number(bean.cupsPerDay),
      gramsPerCup: Number(bean.gramsPerCup),
      createdAt: bean.createdAt.toISOString(),
      progress,
      rop,
      status,
      dailyConsumption,
      degassingEndDate: formatDate(degassingEnd),
    };
  }

  private calcDeliveryLeadTime(bean: Bean): number {
    if (bean.arrivedAt && bean.orderedAt) {
      const arrived = new Date(bean.arrivedAt);
      const ordered = new Date(bean.orderedAt);
      const diff = arrived.getTime() - ordered.getTime();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }
    return 3;
  }

  private async calcDailyConsumption(bean: Bean): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const consumptions = await this.em.find(Consumption, {
      bean,
      createdAt: { $gte: sevenDaysAgo },
    });
    if (consumptions.length > 0) {
      const total = consumptions.reduce((sum, c) => sum + Number(c.amount), 0);
      return total / 7;
    }
    return Number(bean.cupsPerDay) * Number(bean.gramsPerCup);
  }

  private calcRop(bean: Bean, dailyConsumption: number, deliveryLeadTime: number): number {
    const leadTime = deliveryLeadTime + bean.degassingDays;
    const safetyStock = dailyConsumption * 2;
    return Math.round(dailyConsumption * leadTime + safetyStock);
  }

  private async findBean(beanId: number): Promise<Bean> {
    const bean = await this.em.findOne(Bean, { id: beanId }, { populate: ['cafe'] });
    if (!bean) throw new NotFoundException('원두를 찾을 수 없어요');
    return bean;
  }
}

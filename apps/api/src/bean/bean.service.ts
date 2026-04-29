import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  Bean,
  CafeUser,
  RecordBean,
  Roaster,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import {
  BeanResponse,
  CreateBeanDto,
  RopInfo,
  UpdateBeanDto,
} from './dto';

const ROP_GRACE_DAYS = 7;
const ROP_ACTIVITY_WINDOW_DAYS = 14;
const ROP_URGENT_DAYS = 3;
const ROP_SOON_DAYS = 7;

@Injectable()
export class BeanService {
  constructor(private readonly em: EntityManager) {}

  async listActiveBeans(cafeId: number): Promise<BeanResponse[]> {
    const beans = await this.em.find(
      Bean,
      {
        cafe: cafeId,
        archivedAt: null,
        finishedAt: null,
      },
      { populate: ['roaster'], orderBy: { createdAt: 'DESC' } },
    );

    return Promise.all(beans.map((bean) => this.toResponse(bean)));
  }

  async getBean(beanId: number, userId: number): Promise<BeanResponse> {
    const bean = await this.findBeanWithMembership(beanId, userId);
    return this.toResponse(bean);
  }

  async createBean(
    cafeId: number,
    dto: CreateBeanDto,
  ): Promise<BeanResponse> {
    const roaster = dto.roasterId
      ? await this.em.findOne(Roaster, { id: dto.roasterId })
      : null;
    if (dto.roasterId && !roaster) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }

    const bean = this.em.create(Bean, {
      cafe: cafeId,
      name: dto.name,
      origin: dto.origin ?? null,
      roaster,
      totalGrams: dto.totalGrams,
      remainGrams: dto.totalGrams,
      orderedAt: dto.orderedAt,
      roastedOn: dto.roastedOn,
      arrivedAt: dto.arrivedAt ?? null,
      degassingDays: dto.degassingDays ?? 7,
      cupsPerDay: dto.cupsPerDay ?? 2,
      gramsPerCup: dto.gramsPerCup ?? 20,
      autoRopEnabled: dto.autoRopEnabled ?? true,
    });
    this.em.persist(bean);
    await this.em.flush();

    return this.toResponse(bean);
  }

  async updateBean(
    beanId: number,
    userId: number,
    dto: UpdateBeanDto,
  ): Promise<BeanResponse> {
    const bean = await this.findBeanWithMembership(beanId, userId);

    if (dto.roasterId !== undefined) {
      const roaster = await this.em.findOne(Roaster, { id: dto.roasterId });
      if (!roaster) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      bean.roaster = roaster;
    }

    // totalGrams 변경 시 remainGrams도 같은 delta만큼 조정 (음수 방지)
    if (dto.totalGrams !== undefined && dto.totalGrams !== bean.totalGrams) {
      const delta = dto.totalGrams - bean.totalGrams;
      bean.remainGrams = Math.max(0, bean.remainGrams + delta);
    }

    const updatable: Array<keyof UpdateBeanDto> = [
      'name',
      'origin',
      'totalGrams',
      'orderedAt',
      'roastedOn',
      'arrivedAt',
      'degassingDays',
      'cupsPerDay',
      'gramsPerCup',
      'autoRopEnabled',
      'finishedAt',
      'finishedReason',
      'archivedAt',
    ];
    for (const key of updatable) {
      if (dto[key] === undefined) continue;
      Object.assign(bean, { [key]: dto[key] });
    }

    await this.em.flush();
    return this.toResponse(bean);
  }

  private async findBeanWithMembership(
    beanId: number,
    userId: number,
  ): Promise<Bean> {
    const bean = await this.em.findOne(
      Bean,
      { id: beanId },
      { populate: ['cafe', 'roaster'] },
    );
    if (!bean) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    const membership = await this.em.findOne(CafeUser, {
      cafe: bean.cafe.id,
      user: userId,
    });
    if (!membership) {
      throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
    }
    return bean;
  }

  /**
   * D11. ROP Fallback 제어
   *
   * 1) autoRopEnabled === false → 'paused'
   * 2) Grace period (등록 후 7일 이내) → fallback 사용
   * 3) 등록 7일 경과 + 최근 14일 소비 0 → 'paused'
   * 4) 실측 가능 → 최근 14일 평균 소비량 사용
   * 5) 실측 불가 → fallback (cupsPerDay × gramsPerCup)
   */
  private async computeRop(bean: Bean): Promise<RopInfo> {
    const fallbackDailyGrams = Number(bean.cupsPerDay) * Number(bean.gramsPerCup);

    if (!bean.autoRopEnabled) {
      return {
        status: 'paused',
        cupsRemaining: Number(bean.remainGrams) / Number(bean.gramsPerCup),
        daysRemaining: null,
        dailyGrams: 0,
        source: 'fallback',
      };
    }

    const now = Date.now();
    const ageDays = (now - bean.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const isInGrace = ageDays < ROP_GRACE_DAYS;

    let dailyGrams = fallbackDailyGrams;
    let source: 'measured' | 'fallback' = 'fallback';

    if (!isInGrace) {
      const windowStart = new Date(
        now - ROP_ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      );
      const recentRecordBeans = await this.em.find(
        RecordBean,
        {
          bean: bean.id,
          record: { brewedAt: { $gte: windowStart } },
        },
        { populate: ['record'] },
      );
      const recentTotal = recentRecordBeans.reduce(
        (sum, recordBean) => sum + Number(recordBean.grams),
        0,
      );
      if (recentTotal === 0) {
        return {
          status: 'paused',
          cupsRemaining: Number(bean.remainGrams) / Number(bean.gramsPerCup),
          daysRemaining: null,
          dailyGrams: 0,
          source: 'measured',
        };
      }
      dailyGrams = recentTotal / ROP_ACTIVITY_WINDOW_DAYS;
      source = 'measured';
    }

    const remain = Number(bean.remainGrams);
    const daysRemaining = dailyGrams > 0 ? remain / dailyGrams : null;
    const cupsRemaining = remain / Number(bean.gramsPerCup);

    let status: RopInfo['status'] = 'fresh';
    if (daysRemaining !== null) {
      if (daysRemaining <= ROP_URGENT_DAYS) status = 'urgent';
      else if (daysRemaining <= ROP_SOON_DAYS) status = 'soon';
    }

    return {
      status,
      cupsRemaining,
      daysRemaining,
      dailyGrams,
      source,
    };
  }

  private async toResponse(bean: Bean): Promise<BeanResponse> {
    const rop = await this.computeRop(bean);
    return {
      id: bean.id,
      cafeId: bean.cafe.id,
      name: bean.name,
      origin: bean.origin,
      roaster: bean.roaster
        ? { id: bean.roaster.id, name: bean.roaster.name }
        : null,
      totalGrams: Number(bean.totalGrams),
      remainGrams: Number(bean.remainGrams),
      orderedAt: bean.orderedAt,
      roastedOn: bean.roastedOn,
      arrivedAt: bean.arrivedAt,
      degassingDays: bean.degassingDays,
      cupsPerDay: Number(bean.cupsPerDay),
      gramsPerCup: Number(bean.gramsPerCup),
      autoRopEnabled: bean.autoRopEnabled,
      finishedAt: bean.finishedAt,
      finishedReason: bean.finishedReason,
      archivedAt: bean.archivedAt,
      createdAt: bean.createdAt,
      rop,
    };
  }
}

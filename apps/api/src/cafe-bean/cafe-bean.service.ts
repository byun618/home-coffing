import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  Bean,
  CafeBean,
  CafeUser,
  EntitySource,
  RecordBean,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import {
  CafeBeanResponse,
  CreateCafeBeanDto,
  RopInfo,
  UpdateCafeBeanDto,
} from './dto';

const ROP_GRACE_DAYS = 7;
const ROP_ACTIVITY_WINDOW_DAYS = 14;
const ROP_URGENT_DAYS = 3;
const ROP_SOON_DAYS = 7;

@Injectable()
export class CafeBeanService {
  constructor(private readonly em: EntityManager) {}

  async listActiveCafeBeans(cafeId: number): Promise<CafeBeanResponse[]> {
    const cafeBeans = await this.em.find(
      CafeBean,
      {
        cafe: cafeId,
        archivedAt: null,
        finishedAt: null,
      },
      {
        populate: ['bean'],
        orderBy: { createdAt: 'DESC' },
      },
    );

    return Promise.all(cafeBeans.map((cafeBean) => this.toResponse(cafeBean)));
  }

  async getCafeBean(
    cafeBeanId: number,
    userId: number,
  ): Promise<CafeBeanResponse> {
    const cafeBean = await this.findCafeBeanWithMembership(cafeBeanId, userId);
    return this.toResponse(cafeBean);
  }

  async createCafeBean(
    cafeId: number,
    userId: number,
    dto: CreateCafeBeanDto,
  ): Promise<CafeBeanResponse> {
    return this.em.transactional(async (em) => {
      const bean = await this.findCatalogBean(em, dto.beanId);

      const cafeBean = em.create(CafeBean, {
        cafe: cafeId,
        bean,
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
      em.persist(cafeBean);

      // 사용자 식별을 위해 createdBy를 박는 곳은 cafeBean 자체엔 없음 (cafe membership으로 추적).
      // userId 사용처는 향후 audit log 등 필요해질 때 검토.
      void userId;

      await em.flush();
      return this.toResponse(cafeBean);
    });
  }

  async updateCafeBean(
    cafeBeanId: number,
    userId: number,
    dto: UpdateCafeBeanDto,
  ): Promise<CafeBeanResponse> {
    return this.em.transactional(async (em) => {
      const cafeBean = await this.findCafeBeanWithMembership(
        cafeBeanId,
        userId,
        em,
      );

      // beanId 변경 시 catalog 재배선
      if (dto.beanId !== undefined && dto.beanId !== cafeBean.bean.id) {
        cafeBean.bean = await this.findCatalogBean(em, dto.beanId);
      }

      // totalGrams 변경 시 remainGrams도 같은 delta만큼 조정 (음수 방지)
      if (
        dto.totalGrams !== undefined &&
        Number(dto.totalGrams) !== Number(cafeBean.totalGrams)
      ) {
        const delta = Number(dto.totalGrams) - Number(cafeBean.totalGrams);
        cafeBean.remainGrams = Math.max(
          0,
          Number(cafeBean.remainGrams) + delta,
        );
      }

      const updatable: Array<keyof UpdateCafeBeanDto> = [
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
        Object.assign(cafeBean, { [key]: dto[key] });
      }

      await em.flush();
      return this.toResponse(cafeBean);
    });
  }

  private async findCatalogBean(
    em: EntityManager,
    beanId: number,
  ): Promise<Bean> {
    const bean = await em.findOne(Bean, { id: beanId });
    if (!bean) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    if (bean.source !== EntitySource.GLOBAL) {
      // 005 이후 신규 CafeBean은 운영자 catalog(=GLOBAL)만 참조해야 함.
      throw new ApiError(HttpStatus.BAD_REQUEST, Errors.NOT_FOUND);
    }
    return bean;
  }

  private async findCafeBeanWithMembership(
    cafeBeanId: number,
    userId: number,
    em: EntityManager = this.em,
  ): Promise<CafeBean> {
    const cafeBean = await em.findOne(
      CafeBean,
      { id: cafeBeanId },
      { populate: ['cafe', 'bean'] },
    );
    if (!cafeBean) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    const membership = await em.findOne(CafeUser, {
      cafe: cafeBean.cafe.id,
      user: userId,
    });
    if (!membership) {
      throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
    }
    return cafeBean;
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
  private async computeRop(cafeBean: CafeBean): Promise<RopInfo> {
    const fallbackDailyGrams =
      Number(cafeBean.cupsPerDay) * Number(cafeBean.gramsPerCup);

    if (!cafeBean.autoRopEnabled) {
      return {
        status: 'paused',
        cupsRemaining:
          Number(cafeBean.remainGrams) / Number(cafeBean.gramsPerCup),
        daysRemaining: null,
        dailyGrams: 0,
        source: 'fallback',
      };
    }

    const now = Date.now();
    const ageDays =
      (now - cafeBean.createdAt.getTime()) / (24 * 60 * 60 * 1000);
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
          cafeBean: cafeBean.id,
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
          cupsRemaining:
            Number(cafeBean.remainGrams) / Number(cafeBean.gramsPerCup),
          daysRemaining: null,
          dailyGrams: 0,
          source: 'measured',
        };
      }
      dailyGrams = recentTotal / ROP_ACTIVITY_WINDOW_DAYS;
      source = 'measured';
    }

    const remain = Number(cafeBean.remainGrams);
    const daysRemaining = dailyGrams > 0 ? remain / dailyGrams : null;
    const cupsRemaining = remain / Number(cafeBean.gramsPerCup);

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

  private async toResponse(cafeBean: CafeBean): Promise<CafeBeanResponse> {
    const rop = await this.computeRop(cafeBean);
    const bean = cafeBean.bean;
    return {
      id: cafeBean.id,
      cafeId: cafeBean.cafe.id,
      bean: {
        id: bean.id,
        name: bean.name,
        type: bean.type,
        process: bean.process,
        tastingNote: bean.tastingNote,
      },
      totalGrams: Number(cafeBean.totalGrams),
      remainGrams: Number(cafeBean.remainGrams),
      orderedAt: cafeBean.orderedAt,
      roastedOn: cafeBean.roastedOn,
      arrivedAt: cafeBean.arrivedAt,
      degassingDays: cafeBean.degassingDays,
      cupsPerDay: Number(cafeBean.cupsPerDay),
      gramsPerCup: Number(cafeBean.gramsPerCup),
      autoRopEnabled: cafeBean.autoRopEnabled,
      finishedAt: cafeBean.finishedAt,
      finishedReason: cafeBean.finishedReason,
      archivedAt: cafeBean.archivedAt,
      createdAt: cafeBean.createdAt,
      rop,
    };
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  Bean,
  CafeBean,
  CafeUser,
  EntitySource,
  RecordBean,
  Roaster,
  User,
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
    const cafeBeans = await this.em.find(
      CafeBean,
      {
        cafe: cafeId,
        archivedAt: null,
        finishedAt: null,
      },
      {
        populate: ['bean', 'bean.roaster'],
        orderBy: { createdAt: 'DESC' },
      },
    );

    return Promise.all(cafeBeans.map((cafeBean) => this.toResponse(cafeBean)));
  }

  async getBean(cafeBeanId: number, userId: number): Promise<BeanResponse> {
    const cafeBean = await this.findCafeBeanWithMembership(cafeBeanId, userId);
    return this.toResponse(cafeBean);
  }

  async createBean(
    cafeId: number,
    userId: number,
    dto: CreateBeanDto,
  ): Promise<BeanResponse> {
    return this.em.transactional(async (em) => {
      const roaster = dto.roasterId
        ? await em.findOne(Roaster, { id: dto.roasterId })
        : null;
      if (dto.roasterId && !roaster) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }

      const createdBy = await em.findOne(User, { id: userId });

      const bean = em.create(Bean, {
        name: dto.name,
        origin: dto.origin ?? null,
        roaster,
        source: EntitySource.CAFE,
        createdBy,
      });
      em.persist(bean);

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

      await em.flush();
      return this.toResponse(cafeBean);
    });
  }

  async updateBean(
    cafeBeanId: number,
    userId: number,
    dto: UpdateBeanDto,
  ): Promise<BeanResponse> {
    return this.em.transactional(async (em) => {
      const cafeBean = await this.findCafeBeanWithMembership(
        cafeBeanId,
        userId,
        em,
      );

      // dev-plan 4-1: dto.name 변경 시 새 Bean 글로벌 row 생성 + CafeBean.bean FK 재배선.
      // origin/roaster는 기존 Bean에 in-place 적용 (002 단계에선 글로벌 Bean을 1:1로 사용 — 공유 우려 없음).
      const renamedToNewBean =
        dto.name !== undefined && dto.name !== cafeBean.bean.name;

      if (renamedToNewBean) {
        const createdBy = await em.findOne(User, { id: userId });
        const newBean = em.create(Bean, {
          name: dto.name!,
          origin:
            dto.origin !== undefined ? dto.origin : cafeBean.bean.origin,
          roaster:
            dto.roasterId !== undefined
              ? await this.resolveRoaster(em, dto.roasterId)
              : cafeBean.bean.roaster,
          source: EntitySource.CAFE,
          createdBy,
        });
        em.persist(newBean);
        cafeBean.bean = newBean;
      } else {
        if (dto.origin !== undefined) {
          cafeBean.bean.origin = dto.origin;
        }
        if (dto.roasterId !== undefined) {
          cafeBean.bean.roaster = await this.resolveRoaster(
            em,
            dto.roasterId,
          );
        }
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

      const updatable: Array<keyof UpdateBeanDto> = [
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

  private async resolveRoaster(
    em: EntityManager,
    roasterId: number | null | undefined,
  ): Promise<Roaster | null> {
    if (roasterId === null || roasterId === undefined) return null;
    const roaster = await em.findOne(Roaster, { id: roasterId });
    if (!roaster) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    return roaster;
  }

  private async findCafeBeanWithMembership(
    cafeBeanId: number,
    userId: number,
    em: EntityManager = this.em,
  ): Promise<CafeBean> {
    const cafeBean = await em.findOne(
      CafeBean,
      { id: cafeBeanId },
      { populate: ['cafe', 'bean', 'bean.roaster'] },
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

  private async toResponse(cafeBean: CafeBean): Promise<BeanResponse> {
    const rop = await this.computeRop(cafeBean);
    const bean = cafeBean.bean;
    return {
      id: cafeBean.id,
      cafeId: cafeBean.cafe.id,
      name: bean.name,
      origin: bean.origin,
      roaster: bean.roaster
        ? { id: bean.roaster.id, name: bean.roaster.name }
        : null,
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

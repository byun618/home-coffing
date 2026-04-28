import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  Bean,
  BeanFinishedReason,
  CafeUser,
  Record as RecordEntity,
  RecordBean,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import {
  CreateRecordDto,
  RecordBeanDto,
  RecordResponse,
  UpdateRecordDto,
} from './dto';

interface ListRecordsOptions {
  beanId?: number;
  limit?: number;
  before?: Date;
}

@Injectable()
export class RecordService {
  constructor(private readonly em: EntityManager) {}

  async listByCafe(
    cafeId: number,
    options: ListRecordsOptions = {},
  ): Promise<RecordResponse[]> {
    const limit = Math.min(options.limit ?? 50, 200);

    const beanScope: Partial<{
      recordBeans: { bean: { id: number } };
    }> = options.beanId
      ? { recordBeans: { bean: { id: options.beanId } } }
      : {};
    const timeScope = options.before
      ? { brewedAt: { $lt: options.before } }
      : {};

    const records = await this.em.find(
      RecordEntity,
      {
        cafe: cafeId,
        ...beanScope,
        ...timeScope,
      },
      {
        populate: [
          'user',
          'recordBeans',
          'recordBeans.bean',
        ],
        orderBy: { brewedAt: 'DESC' },
        limit,
      },
    );

    return records.map((record) => this.toResponse(record));
  }

  async getRecord(recordId: number, userId: number): Promise<RecordResponse> {
    const record = await this.findRecordWithMembership(recordId, userId);
    return this.toResponse(record);
  }

  async createRecord(
    cafeId: number,
    userId: number,
    dto: CreateRecordDto,
  ): Promise<RecordResponse> {
    return this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: userId });
      if (!user) throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);

      const beans = await this.loadBeansInCafe(em, cafeId, dto.beans);

      const totalGrams = dto.beans.reduce((sum, b) => sum + b.grams, 0);

      const record = em.create(RecordEntity, {
        cafe: cafeId,
        user,
        totalGrams,
        cups: dto.cups ?? null,
        brewedAt: dto.brewedAt,
        memo: dto.memo ?? null,
        recipe: dto.recipe ?? null,
        tasteNote: dto.tasteNote ?? null,
      });
      em.persist(record);

      for (const beanDto of dto.beans) {
        const bean = beans.get(beanDto.beanId)!;
        const recordBean = em.create(RecordBean, {
          record,
          bean,
          grams: beanDto.grams,
        });
        em.persist(recordBean);

        this.deductBean(bean, beanDto.grams);
      }

      await em.flush();
      return this.toResponse(record);
    });
  }

  async updateRecord(
    recordId: number,
    userId: number,
    dto: UpdateRecordDto,
  ): Promise<RecordResponse> {
    return this.em.transactional(async (em) => {
      const record = await em.findOne(
        RecordEntity,
        { id: recordId },
        {
          populate: [
            'user',
            'cafe',
            'recordBeans',
            'recordBeans.bean',
          ],
        },
      );
      if (!record) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (record.user.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      if (dto.beans) {
        for (const recordBean of record.recordBeans.getItems()) {
          this.restoreBean(recordBean.bean, Number(recordBean.grams));
        }
        record.recordBeans.removeAll();

        const beans = await this.loadBeansInCafe(
          em,
          record.cafe.id,
          dto.beans,
        );
        for (const beanDto of dto.beans) {
          const bean = beans.get(beanDto.beanId)!;
          const recordBean = em.create(RecordBean, {
            record,
            bean,
            grams: beanDto.grams,
          });
          em.persist(recordBean);
          this.deductBean(bean, beanDto.grams);
        }
        record.totalGrams = dto.beans.reduce((sum, b) => sum + b.grams, 0);
      }

      if (dto.cups !== undefined) record.cups = dto.cups;
      if (dto.brewedAt !== undefined) record.brewedAt = dto.brewedAt;
      if (dto.memo !== undefined) record.memo = dto.memo;
      if (dto.recipe !== undefined) record.recipe = dto.recipe;
      if (dto.tasteNote !== undefined) record.tasteNote = dto.tasteNote;

      await em.flush();
      return this.toResponse(record);
    });
  }

  async deleteRecord(recordId: number, userId: number): Promise<void> {
    return this.em.transactional(async (em) => {
      const record = await em.findOne(
        RecordEntity,
        { id: recordId },
        { populate: ['user', 'recordBeans', 'recordBeans.bean'] },
      );
      if (!record) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (record.user.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      for (const recordBean of record.recordBeans.getItems()) {
        this.restoreBean(recordBean.bean, Number(recordBean.grams));
      }
      em.remove(record);
      await em.flush();
    });
  }

  private async findRecordWithMembership(
    recordId: number,
    userId: number,
  ): Promise<RecordEntity> {
    const record = await this.em.findOne(
      RecordEntity,
      { id: recordId },
      {
        populate: [
          'cafe',
          'user',
          'recordBeans',
          'recordBeans.bean',
        ],
      },
    );
    if (!record) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    const membership = await this.em.findOne(CafeUser, {
      cafe: record.cafe.id,
      user: userId,
    });
    if (!membership) {
      throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
    }
    return record;
  }

  private async loadBeansInCafe(
    em: EntityManager,
    cafeId: number,
    items: RecordBeanDto[],
  ): Promise<Map<number, Bean>> {
    const ids = items.map((item) => item.beanId);
    const beans = await em.find(Bean, { id: { $in: ids }, cafe: cafeId });
    if (beans.length !== new Set(ids).size) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    return new Map(beans.map((bean) => [bean.id, bean]));
  }

  /**
   * 잔량 차감 — 음수 차단(INSUFFICIENT_BEAN). 0 도달 시 자동 finishedAt + finishedReason=consumed.
   */
  private deductBean(bean: Bean, grams: number): void {
    const next = Number(bean.remainGrams) - grams;
    if (next < 0) {
      throw new ApiError(HttpStatus.BAD_REQUEST, {
        ...Errors.INSUFFICIENT_BEAN,
        meta: {
          beanId: bean.id,
          remainGrams: Number(bean.remainGrams),
          requested: grams,
        },
      });
    }
    bean.remainGrams = next;
    if (next === 0 && !bean.finishedAt) {
      bean.finishedAt = new Date();
      bean.finishedReason = BeanFinishedReason.CONSUMED;
    }
  }

  /**
   * 기록 수정/삭제 시 잔량 복원. 자동 finished 상태였으면 해제.
   */
  private restoreBean(bean: Bean, grams: number): void {
    const next = Number(bean.remainGrams) + grams;
    bean.remainGrams = next;
    if (
      bean.finishedAt &&
      bean.finishedReason === BeanFinishedReason.CONSUMED &&
      next > 0
    ) {
      bean.finishedAt = null;
      bean.finishedReason = null;
    }
  }

  private toResponse(record: RecordEntity): RecordResponse {
    return {
      id: record.id,
      cafeId: record.cafe.id,
      user: {
        id: record.user.id,
        email: record.user.email,
        displayName: record.user.displayName,
      },
      totalGrams: Number(record.totalGrams),
      cups: record.cups !== null ? Number(record.cups) : null,
      brewedAt: record.brewedAt,
      loggedAt: record.loggedAt,
      memo: record.memo,
      recipe: record.recipe,
      tasteNote: record.tasteNote,
      beans: record.recordBeans.getItems().map((recordBean) => ({
        beanId: recordBean.bean.id,
        beanName: recordBean.bean.name,
        grams: Number(recordBean.grams),
      })),
      createdAt: record.createdAt,
    };
  }
}

import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { wrap } from '@mikro-orm/core';
import {
  BeanFinishedReason,
  CafeBean,
  CafeUser,
  Recipe,
  Record as RecordEntity,
  RecordBean,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { mapTasteNote } from '../taste-note/mapper';
import { toRecipeResponse } from '../recipe/recipe.service';
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

const RECORD_POPULATE = [
  'user',
  'recordBeans',
  'recordBeans.cafeBean',
  'recordBeans.cafeBean.bean',
  'tasteNotes',
  'tasteNotes.author',
  'recipe',
  'recipe.recipeEquipments',
  'recipe.recipeEquipments.equipment',
  'recipe.createdBy',
] as const;

@Injectable()
export class RecordService {
  constructor(private readonly em: EntityManager) {}

  async listByCafe(
    cafeId: number,
    options: ListRecordsOptions = {},
  ): Promise<RecordResponse[]> {
    const limit = Math.min(options.limit ?? 50, 200);

    const beanScope = options.beanId
      ? { recordBeans: { cafeBean: { id: options.beanId } } }
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
        populate: [...RECORD_POPULATE],
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

      const cafeBeans = await this.loadCafeBeansInCafe(em, cafeId, dto.beans);

      const recipe = await this.resolveRecipe(em, cafeId, dto.recipeId);

      const record = em.create(RecordEntity, {
        cafe: cafeId,
        user,
        brewedAt: dto.brewedAt,
        memo: dto.memo ?? null,
        recipe,
      });
      em.persist(record);

      for (const beanDto of dto.beans) {
        const cafeBean = cafeBeans.get(beanDto.beanId)!;
        const recordBean = em.create(RecordBean, {
          record,
          cafeBean,
          grams: beanDto.grams,
        });
        em.persist(recordBean);

        this.deductCafeBean(cafeBean, beanDto.grams);
      }

      await em.flush();

      const populated = await em.findOneOrFail(
        RecordEntity,
        { id: record.id },
        { populate: [...RECORD_POPULATE] },
      );
      return this.toResponse(populated);
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
        { populate: ['cafe', ...RECORD_POPULATE] },
      );
      if (!record) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (record.user.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      if (dto.beans) {
        for (const recordBean of record.recordBeans.getItems()) {
          this.restoreCafeBean(recordBean.cafeBean, Number(recordBean.grams));
        }
        record.recordBeans.removeAll();

        const cafeBeans = await this.loadCafeBeansInCafe(
          em,
          record.cafe.id,
          dto.beans,
        );
        for (const beanDto of dto.beans) {
          const cafeBean = cafeBeans.get(beanDto.beanId)!;
          const recordBean = em.create(RecordBean, {
            record,
            cafeBean,
            grams: beanDto.grams,
          });
          em.persist(recordBean);
          this.deductCafeBean(cafeBean, beanDto.grams);
        }
      }

      if (dto.brewedAt !== undefined) record.brewedAt = dto.brewedAt;
      if (dto.memo !== undefined) record.memo = dto.memo;
      if (dto.recipeId !== undefined) {
        const recipe =
          dto.recipeId === null
            ? null
            : await this.resolveRecipe(em, record.cafe.id, dto.recipeId);
        wrap(record).assign({ recipe });
      }

      // dto.cups는 entity 컬럼이 없으므로 silently ignored.

      await em.flush();
      const populated = await em.findOneOrFail(
        RecordEntity,
        { id: record.id },
        { populate: [...RECORD_POPULATE] },
      );
      return this.toResponse(populated);
    });
  }

  async deleteRecord(recordId: number, userId: number): Promise<void> {
    return this.em.transactional(async (em) => {
      const record = await em.findOne(
        RecordEntity,
        { id: recordId },
        {
          populate: [
            'user',
            'recordBeans',
            'recordBeans.cafeBean',
            'recordBeans.cafeBean.bean',
          ],
        },
      );
      if (!record) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (record.user.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      for (const recordBean of record.recordBeans.getItems()) {
        this.restoreCafeBean(recordBean.cafeBean, Number(recordBean.grams));
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
      { populate: ['cafe', ...RECORD_POPULATE] },
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

  private async loadCafeBeansInCafe(
    em: EntityManager,
    cafeId: number,
    items: RecordBeanDto[],
  ): Promise<Map<number, CafeBean>> {
    const ids = items.map((item) => item.beanId);
    const cafeBeans = await em.find(
      CafeBean,
      { id: { $in: ids }, cafe: cafeId },
      { populate: ['bean'] },
    );
    if (cafeBeans.length !== new Set(ids).size) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    return new Map(cafeBeans.map((cafeBean) => [cafeBean.id, cafeBean]));
  }

  private async resolveRecipe(
    em: EntityManager,
    cafeId: number,
    recipeId: number | null | undefined,
  ): Promise<Recipe | null> {
    if (recipeId === undefined || recipeId === null) return null;
    const recipe = await em.findOne(
      Recipe,
      { id: recipeId, cafe: cafeId },
      {
        populate: [
          'recipeEquipments',
          'recipeEquipments.equipment',
          'createdBy',
        ],
      },
    );
    if (!recipe) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    return recipe;
  }

  /**
   * 잔량 차감 — 음수 차단(INSUFFICIENT_BEAN). 0 도달 시 자동 finishedAt + finishedReason=consumed.
   */
  private deductCafeBean(cafeBean: CafeBean, grams: number): void {
    const next = Number(cafeBean.remainGrams) - grams;
    if (next < 0) {
      throw new ApiError(HttpStatus.BAD_REQUEST, {
        ...Errors.INSUFFICIENT_BEAN,
        meta: {
          beanId: cafeBean.id,
          remainGrams: Number(cafeBean.remainGrams),
          requested: grams,
        },
      });
    }
    cafeBean.remainGrams = next;
    if (next === 0 && !cafeBean.finishedAt) {
      cafeBean.finishedAt = new Date();
      cafeBean.finishedReason = BeanFinishedReason.CONSUMED;
    }
  }

  /**
   * 기록 수정/삭제 시 잔량 복원. 자동 finished 상태였으면 해제.
   */
  private restoreCafeBean(cafeBean: CafeBean, grams: number): void {
    const next = Number(cafeBean.remainGrams) + grams;
    cafeBean.remainGrams = next;
    if (
      cafeBean.finishedAt &&
      cafeBean.finishedReason === BeanFinishedReason.CONSUMED &&
      next > 0
    ) {
      cafeBean.finishedAt = null;
      cafeBean.finishedReason = null;
    }
  }

  private toResponse(record: RecordEntity): RecordResponse {
    const recordBeans = record.recordBeans.getItems();
    const totalGrams = recordBeans.reduce(
      (sum, recordBean) => sum + Number(recordBean.grams),
      0,
    );

    const tasteNotes = record.tasteNotes
      .getItems()
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((tasteNote) => mapTasteNote(tasteNote));

    // record 응답 내 recipe.usageCount는 0으로 고정(상세 조회 시점에 의미 없음).
    const recipeResponse = record.recipe
      ? toRecipeResponse(record.recipe, 0)
      : null;

    return {
      id: record.id,
      cafeId: record.cafe.id,
      user: {
        id: record.user.id,
        email: record.user.email,
        displayName: record.user.displayName,
      },
      totalGrams,
      cups: null,
      brewedAt: record.brewedAt,
      loggedAt: record.loggedAt,
      memo: record.memo,
      recipe: recipeResponse,
      tasteNotes,
      beans: recordBeans.map((recordBean) => ({
        beanId: recordBean.cafeBean.id,
        beanName: recordBean.cafeBean.bean.name,
        grams: Number(recordBean.grams),
      })),
      createdAt: record.createdAt,
    };
  }
}

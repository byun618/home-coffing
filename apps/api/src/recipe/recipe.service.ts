import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  CafeUser,
  EntitySource,
  Equipment,
  Recipe,
  RecipeEquipment,
  RecipeMethod,
  Record as RecordEntity,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import type { BrewingParams } from '../common/types/recipe-params';
import {
  CreateRecipeDto,
  RecipeResponse,
  UpdateRecipeDto,
} from './dto';

const RECIPE_POPULATE = [
  'createdBy',
  'recipeEquipments',
  'recipeEquipments.equipment',
] as const;

@Injectable()
export class RecipeService {
  constructor(private readonly em: EntityManager) {}

  async listByCafe(cafeId: number, userId: number): Promise<RecipeResponse[]> {
    await this.assertMembership(cafeId, userId);

    const recipes = await this.em.find(
      Recipe,
      { cafe: cafeId },
      {
        populate: [...RECIPE_POPULATE],
        orderBy: { createdAt: 'DESC' },
      },
    );

    if (recipes.length === 0) return [];

    const usageMap = await this.computeUsageCounts(recipes.map((r) => r.id));
    return recipes.map((recipe) =>
      toRecipeResponse(recipe, usageMap.get(recipe.id) ?? 0),
    );
  }

  async getRecipe(
    cafeId: number,
    recipeId: number,
    userId: number,
  ): Promise<RecipeResponse> {
    await this.assertMembership(cafeId, userId);
    const recipe = await this.findRecipeInCafe(cafeId, recipeId);
    const usage = await this.em.count(RecordEntity, { recipe: recipe.id });
    return toRecipeResponse(recipe, usage);
  }

  async createRecipe(
    cafeId: number,
    userId: number,
    dto: CreateRecipeDto,
  ): Promise<RecipeResponse> {
    await this.assertMembership(cafeId, userId);
    this.validateBrewingParams(dto.method, dto.params);

    return this.em.transactional(async (em) => {
      const user = await em.findOne(User, { id: userId });
      if (!user) throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);

      const equipments = await this.resolveEquipments(em, dto.equipmentIds);

      const recipe = em.create(Recipe, {
        cafe: cafeId,
        name: dto.name ?? null,
        method: dto.method,
        params: dto.params,
        source: EntitySource.CAFE,
        createdBy: user,
      });
      em.persist(recipe);

      for (const equipment of equipments) {
        const recipeEquipment = em.create(RecipeEquipment, {
          recipe,
          equipment,
        });
        em.persist(recipeEquipment);
      }

      await em.flush();

      const populated = await em.findOneOrFail(
        Recipe,
        { id: recipe.id },
        { populate: [...RECIPE_POPULATE] },
      );
      return toRecipeResponse(populated, 0);
    });
  }

  async updateRecipe(
    cafeId: number,
    recipeId: number,
    userId: number,
    dto: UpdateRecipeDto,
  ): Promise<RecipeResponse> {
    await this.assertMembership(cafeId, userId);

    return this.em.transactional(async (em) => {
      const recipe = await em.findOne(
        Recipe,
        { id: recipeId, cafe: cafeId },
        { populate: [...RECIPE_POPULATE] },
      );
      if (!recipe) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (!recipe.createdBy || recipe.createdBy.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      if (dto.name !== undefined) {
        recipe.name = dto.name;
      }
      if (dto.params !== undefined) {
        this.validateBrewingParams(recipe.method, dto.params);
        recipe.params = dto.params;
      }

      if (dto.equipmentIds !== undefined) {
        const equipments = await this.resolveEquipments(em, dto.equipmentIds);
        recipe.recipeEquipments.removeAll();
        for (const equipment of equipments) {
          const recipeEquipment = em.create(RecipeEquipment, {
            recipe,
            equipment,
          });
          em.persist(recipeEquipment);
        }
      }

      await em.flush();

      const populated = await em.findOneOrFail(
        Recipe,
        { id: recipe.id },
        { populate: [...RECIPE_POPULATE] },
      );
      const usage = await em.count(RecordEntity, { recipe: populated.id });
      return toRecipeResponse(populated, usage);
    });
  }

  async deleteRecipe(
    cafeId: number,
    recipeId: number,
    userId: number,
  ): Promise<void> {
    await this.assertMembership(cafeId, userId);

    return this.em.transactional(async (em) => {
      const recipe = await em.findOne(Recipe, { id: recipeId, cafe: cafeId }, {
        populate: ['createdBy'],
      });
      if (!recipe) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (!recipe.createdBy || recipe.createdBy.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }
      em.remove(recipe);
      await em.flush();
    });
  }

  // === helpers ===

  private async assertMembership(
    cafeId: number,
    userId: number,
  ): Promise<void> {
    const membership = await this.em.findOne(CafeUser, {
      cafe: cafeId,
      user: userId,
    });
    if (!membership) {
      throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
    }
  }

  private async findRecipeInCafe(
    cafeId: number,
    recipeId: number,
  ): Promise<Recipe> {
    const recipe = await this.em.findOne(
      Recipe,
      { id: recipeId, cafe: cafeId },
      { populate: [...RECIPE_POPULATE] },
    );
    if (!recipe) {
      throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
    }
    return recipe;
  }

  private async resolveEquipments(
    em: EntityManager,
    equipmentIds: number[] | undefined,
  ): Promise<Equipment[]> {
    if (!equipmentIds || equipmentIds.length === 0) return [];
    const uniqueIds = Array.from(new Set(equipmentIds));
    const equipments = await em.find(Equipment, {
      id: { $in: uniqueIds },
    });
    if (equipments.length !== uniqueIds.length) {
      throw new ApiError(HttpStatus.BAD_REQUEST, Errors.NOT_FOUND);
    }
    return equipments;
  }

  private async computeUsageCounts(
    recipeIds: number[],
  ): Promise<Map<number, number>> {
    if (recipeIds.length === 0) return new Map();
    // raw query — alias 금지(테이블 풀네임 사용)
    const rows = await this.em
      .getConnection()
      .execute<{ recipe_id: number; cnt: number | string }[]>(
        `SELECT record.recipe_id AS recipe_id, COUNT(*) AS cnt
         FROM record
         WHERE record.recipe_id IN (?)
         GROUP BY record.recipe_id`,
        [recipeIds],
      );
    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(Number(row.recipe_id), Number(row.cnt));
    }
    return map;
  }

  /**
   * params.method ↔ Recipe.method 일치 + method별 required 필드 검증.
   * `as` 단언 없이 switch narrowing으로 처리.
   */
  private validateBrewingParams(
    method: RecipeMethod,
    params: BrewingParams,
  ): void {
    if (params.method !== method) {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        Errors.INVALID_RECIPE_PARAMS,
      );
    }
    switch (params.method) {
      case 'pour-over': {
        if (
          !Number.isFinite(params.doseGrams) ||
          params.doseGrams <= 0 ||
          !Number.isFinite(params.grindSize) ||
          params.grindSize <= 0 ||
          !Number.isFinite(params.waterTempC) ||
          params.waterTempC <= 0 ||
          (params.serveMode !== 'hot' && params.serveMode !== 'iced') ||
          !Number.isFinite(params.totalYieldGrams) ||
          params.totalYieldGrams <= 0 ||
          !Number.isFinite(params.totalTimeSec) ||
          params.totalTimeSec <= 0 ||
          !Array.isArray(params.stages) ||
          params.stages.length < 1
        ) {
          throw new ApiError(
            HttpStatus.BAD_REQUEST,
            Errors.INVALID_RECIPE_PARAMS,
          );
        }
        for (const stage of params.stages) {
          if (
            typeof stage.label !== 'string' ||
            stage.label.length < 1 ||
            !Number.isFinite(stage.startSec) ||
            stage.startSec < 0 ||
            !Number.isFinite(stage.pourGrams) ||
            stage.pourGrams <= 0
          ) {
            throw new ApiError(
              HttpStatus.BAD_REQUEST,
              Errors.INVALID_RECIPE_PARAMS,
            );
          }
        }
        // startSec asc 정렬을 service에서 강제 (저장 직전 in-place sort).
        params.stages.sort((a, b) => a.startSec - b.startSec);
        return;
      }
      case 'espresso': {
        if (
          !Number.isFinite(params.doseGrams) ||
          !Number.isFinite(params.grindSize) ||
          !Number.isFinite(params.waterTempC) ||
          !Number.isFinite(params.yieldGrams) ||
          !Number.isFinite(params.pressureBar)
        ) {
          throw new ApiError(
            HttpStatus.BAD_REQUEST,
            Errors.INVALID_RECIPE_PARAMS,
          );
        }
        return;
      }
      case 'french-press': {
        if (
          !Number.isFinite(params.doseGrams) ||
          !Number.isFinite(params.grindSize) ||
          !Number.isFinite(params.waterTempC) ||
          !Number.isFinite(params.totalYieldGrams) ||
          !Number.isFinite(params.steepTimeSec)
        ) {
          throw new ApiError(
            HttpStatus.BAD_REQUEST,
            Errors.INVALID_RECIPE_PARAMS,
          );
        }
        return;
      }
      case 'aeropress': {
        if (
          !Number.isFinite(params.doseGrams) ||
          !Number.isFinite(params.grindSize) ||
          !Number.isFinite(params.waterTempC) ||
          !Number.isFinite(params.yieldGrams) ||
          !Number.isFinite(params.steepTimeSec) ||
          (params.orientation !== 'standard' &&
            params.orientation !== 'inverted')
        ) {
          throw new ApiError(
            HttpStatus.BAD_REQUEST,
            Errors.INVALID_RECIPE_PARAMS,
          );
        }
        return;
      }
    }
  }
}

/**
 * Recipe → RecipeResponse 매퍼 (record 모듈에서도 재사용).
 * Recipe는 populate 완료 상태 가정: createdBy, recipeEquipments, recipeEquipments.equipment.
 */
export function toRecipeResponse(
  recipe: Recipe,
  usageCount: number,
): RecipeResponse {
  return {
    id: recipe.id,
    cafeId: recipe.cafe.id,
    name: recipe.name,
    method: recipe.method,
    params: recipe.params,
    equipments: recipe.recipeEquipments.getItems().map((recipeEquipment) => ({
      id: recipeEquipment.equipment.id,
      type: recipeEquipment.equipment.type,
      name: recipeEquipment.equipment.name,
      brand: recipeEquipment.equipment.brand,
      model: recipeEquipment.equipment.model,
    })),
    createdBy: recipe.createdBy
      ? {
          id: recipe.createdBy.id,
          displayName: recipe.createdBy.displayName,
        }
      : null,
    createdAt: recipe.createdAt,
    usageCount,
  };
}

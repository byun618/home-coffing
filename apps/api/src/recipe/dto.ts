import {
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { RecipeMethod } from '../common/entities';
import type {
  AeropressParams,
  BrewingParams,
  EquipmentType,
  EspressoParams,
  FrenchPressParams,
  PourOverParams,
} from '@home-coffing/shared-types';

/**
 * Recipe DTO — params는 BrewingParams discriminated union.
 * class-validator로는 union 분기 검증이 까다로워, dto에서는 shape 검증만 하고
 * service `validateBrewingParams`에서 method별 required 필드를 검증한다.
 */

export class CreateRecipeDto {
  @IsEnum(RecipeMethod)
  method!: RecipeMethod;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @IsObject()
  params!: BrewingParams;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  equipmentIds?: number[];
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string | null;

  @IsOptional()
  @IsObject()
  params?: BrewingParams;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  equipmentIds?: number[];
}

// === Response shape (shared-types와 일치) ===

export interface RecipeEquipmentInfo {
  id: number;
  type: EquipmentType;
  name: string;
  brand: string | null;
  model: string | null;
}

export interface RecipeResponse {
  id: number;
  cafeId: number;
  name: string | null;
  method: RecipeMethod;
  params: BrewingParams | null;
  equipments: RecipeEquipmentInfo[];
  createdBy: { id: number; displayName: string | null } | null;
  createdAt: Date;
  usageCount: number;
}

// re-export for service use
export type {
  BrewingParams,
  PourOverParams,
  EspressoParams,
  FrenchPressParams,
  AeropressParams,
};

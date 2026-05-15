import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { BeanFinishedReason, BeanProcess, BeanType } from '../common/entities';

export class CreateCafeBeanDto {
  @IsInt()
  @Min(1)
  beanId!: number;

  @IsNumber()
  @Min(0.1)
  @Max(99999)
  totalGrams!: number;

  @IsDate()
  @Type(() => Date)
  orderedAt!: Date;

  @IsDate()
  @Type(() => Date)
  roastedOn!: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  arrivedAt?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  degassingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  cupsPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  gramsPerCup?: number;

  @IsOptional()
  @IsBoolean()
  autoRopEnabled?: boolean;
}

export class UpdateCafeBeanDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  beanId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  totalGrams?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  orderedAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  roastedOn?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  arrivedAt?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  degassingDays?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  cupsPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  gramsPerCup?: number;

  @IsOptional()
  @IsBoolean()
  autoRopEnabled?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  finishedAt?: Date;

  @IsOptional()
  @IsEnum(BeanFinishedReason)
  finishedReason?: BeanFinishedReason;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  archivedAt?: Date;
}

export type RopStatus = 'fresh' | 'soon' | 'urgent' | 'paused';

export interface RopInfo {
  status: RopStatus;
  cupsRemaining: number;
  daysRemaining: number | null;
  dailyGrams: number;
  source: 'measured' | 'fallback';
}

export interface CafeBeanCatalogInfo {
  id: number;
  name: string;
  type: BeanType;
  process: BeanProcess | null;
  tastingNote: string[] | null;
}

export interface CafeBeanResponse {
  id: number;
  cafeId: number;
  bean: CafeBeanCatalogInfo;
  totalGrams: number;
  remainGrams: number;
  orderedAt: Date;
  roastedOn: Date;
  arrivedAt: Date | null;
  degassingDays: number;
  cupsPerDay: number;
  gramsPerCup: number;
  autoRopEnabled: boolean;
  finishedAt: Date | null;
  finishedReason: BeanFinishedReason | null;
  archivedAt: Date | null;
  createdAt: Date;
  rop: RopInfo;
}

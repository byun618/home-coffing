import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { BeanFinishedReason } from '../common/entities';

export class CreateBeanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origin?: string;

  @IsOptional()
  @IsInt()
  roasterId?: number;

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

export class UpdateBeanDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  origin?: string;

  @IsOptional()
  @IsInt()
  roasterId?: number;

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

export interface BeanResponse {
  id: number;
  cafeId: number;
  name: string;
  origin: string | null;
  roaster: { id: number; name: string } | null;
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

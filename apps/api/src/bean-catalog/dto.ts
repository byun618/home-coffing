import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BeanProcess, BeanType } from '../common/entities';

export class ListBeanCatalogDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activeOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cafeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class RecentBeanCatalogDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cafeId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export interface BeanCatalogResponse {
  id: number;
  name: string;
  type: BeanType;
  process: BeanProcess | null;
  tastingNote: string[] | null;
}

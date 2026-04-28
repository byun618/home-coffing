import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { RecipeJson, TasteNoteJson } from '../common/entities';

export class RecordBeanDto {
  @IsInt()
  beanId!: number;

  @IsNumber()
  @Min(0.1)
  grams!: number;
}

export class CreateRecordDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecordBeanDto)
  beans!: RecordBeanDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  cups?: number;

  @IsDate()
  @Type(() => Date)
  brewedAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;

  @IsOptional()
  recipe?: RecipeJson;

  @IsOptional()
  tasteNote?: TasteNoteJson;
}

export class UpdateRecordDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecordBeanDto)
  beans?: RecordBeanDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  cups?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  brewedAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  memo?: string;

  @IsOptional()
  recipe?: RecipeJson;

  @IsOptional()
  tasteNote?: TasteNoteJson;
}

export interface RecordResponse {
  id: number;
  cafeId: number;
  user: {
    id: number;
    email: string;
    displayName: string | null;
  };
  totalGrams: number;
  cups: number | null;
  brewedAt: Date;
  loggedAt: Date;
  memo: string | null;
  recipe: RecipeJson | null;
  tasteNote: TasteNoteJson | null;
  beans: Array<{
    beanId: number;
    beanName: string;
    grams: number;
  }>;
  createdAt: Date;
}

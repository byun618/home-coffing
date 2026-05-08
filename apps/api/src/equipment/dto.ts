import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EquipmentType } from '../common/entities';

export class CreateEquipmentDto {
  @IsEnum(EquipmentType)
  type!: EquipmentType;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  model?: string;
}

export interface EquipmentResponse {
  id: number;
  type: EquipmentType;
  name: string;
  brand: string | null;
  model: string | null;
}

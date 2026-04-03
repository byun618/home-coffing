import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConsumptionCreateDto {
  @IsNumber()
  @Min(0.1)
  amount!: number;

  @IsNumber()
  @IsOptional()
  water?: number;

  @IsString()
  @IsOptional()
  grindSize?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  note?: string;
}

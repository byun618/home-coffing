import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class BeanUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  totalAmount?: number;

  @IsDateString()
  @IsOptional()
  orderedAt?: string;

  @IsDateString()
  @IsOptional()
  roastDate?: string;

  @IsDateString()
  @IsOptional()
  arrivedAt?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  degassingDays?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  cupsPerDay?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  gramsPerCup?: number;
}

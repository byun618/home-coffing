import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class BeanCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @IsDateString()
  orderedAt!: string;

  @IsDateString()
  roastDate!: string;

  @IsDateString()
  @IsOptional()
  arrivedAt?: string;

  @IsNumber()
  @Min(0)
  degassingDays!: number;

  @IsNumber()
  @Min(0.01)
  cupsPerDay!: number;

  @IsNumber()
  @Min(0.01)
  gramsPerCup!: number;
}

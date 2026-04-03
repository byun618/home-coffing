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
  roastDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  perCup?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryDays?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  degassingDays?: number;
}

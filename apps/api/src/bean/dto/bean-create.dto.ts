import { IsString, IsNotEmpty, IsNumber, IsDateString, Min } from 'class-validator';

export class BeanCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @IsDateString()
  roastDate!: string;

  @IsNumber()
  @Min(1)
  perCup!: number;

  @IsNumber()
  @Min(0)
  deliveryDays!: number;

  @IsNumber()
  @Min(0)
  degassingDays!: number;
}

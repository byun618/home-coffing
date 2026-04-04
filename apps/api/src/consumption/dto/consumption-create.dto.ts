import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConsumptionItem {
  @IsNumber()
  beanId!: number;

  @IsNumber()
  @Min(0.1)
  amount!: number;
}

export class ConsumptionCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionItem)
  items!: ConsumptionItem[];
}

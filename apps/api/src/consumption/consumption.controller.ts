import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ConsumptionService } from './consumption.service';
import { ConsumptionCreateDto } from './dto/consumption-create.dto';

@Controller('consumptions')
export class ConsumptionController {
  constructor(private readonly consumptionService: ConsumptionService) {}

  @Get()
  list(
    @Query('beanId') beanId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.consumptionService.list({
      beanId: beanId ? Number(beanId) : undefined,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Post()
  create(@Body() dto: ConsumptionCreateDto) {
    return this.consumptionService.create(dto);
  }
}

import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ConsumptionService } from './consumption.service';
import { ConsumptionCreateDto } from './dto/consumption-create.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities';

@Controller('beans/:beanId/consumptions')
@UseGuards(JwtAuthGuard)
export class ConsumptionController {
  constructor(private readonly consumptionService: ConsumptionService) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Param('beanId', ParseIntPipe) beanId: number,
    @Body() dto: ConsumptionCreateDto,
  ) {
    return this.consumptionService.create(user, beanId, dto);
  }
}

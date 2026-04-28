import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { CafeMemberGuard } from '../common/guards/cafe-member.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BeanService } from './bean.service';
import {
  BeanResponse,
  CreateBeanDto,
  UpdateBeanDto,
} from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class BeanController {
  constructor(private readonly beanService: BeanService) {}

  @Get('cafes/:cafeId/beans')
  @UseGuards(CafeMemberGuard)
  async listActive(
    @Param('cafeId', ParseIntPipe) cafeId: number,
  ): Promise<BeanResponse[]> {
    return this.beanService.listActiveBeans(cafeId);
  }

  @Post('cafes/:cafeId/beans')
  @UseGuards(CafeMemberGuard)
  async create(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Body() dto: CreateBeanDto,
  ): Promise<BeanResponse> {
    return this.beanService.createBean(cafeId, dto);
  }

  @Get('beans/:beanId')
  async getBean(
    @Param('beanId', ParseIntPipe) beanId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BeanResponse> {
    return this.beanService.getBean(beanId, user.sub);
  }

  @Patch('beans/:beanId')
  async update(
    @Param('beanId', ParseIntPipe) beanId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBeanDto,
  ): Promise<BeanResponse> {
    return this.beanService.updateBean(beanId, user.sub, dto);
  }
}

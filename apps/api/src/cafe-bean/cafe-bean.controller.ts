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
import { CafeBeanService } from './cafe-bean.service';
import {
  CafeBeanResponse,
  CreateCafeBeanDto,
  UpdateCafeBeanDto,
} from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CafeBeanController {
  constructor(private readonly cafeBeanService: CafeBeanService) {}

  @Get('cafes/:cafeId/cafe-beans')
  @UseGuards(CafeMemberGuard)
  async listActive(
    @Param('cafeId', ParseIntPipe) cafeId: number,
  ): Promise<CafeBeanResponse[]> {
    return this.cafeBeanService.listActiveCafeBeans(cafeId);
  }

  @Post('cafes/:cafeId/cafe-beans')
  @UseGuards(CafeMemberGuard)
  async create(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCafeBeanDto,
  ): Promise<CafeBeanResponse> {
    return this.cafeBeanService.createCafeBean(cafeId, user.sub, dto);
  }

  @Get('cafe-beans/:id')
  async getCafeBean(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<CafeBeanResponse> {
    return this.cafeBeanService.getCafeBean(id, user.sub);
  }

  @Patch('cafe-beans/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCafeBeanDto,
  ): Promise<CafeBeanResponse> {
    return this.cafeBeanService.updateCafeBean(id, user.sub, dto);
  }
}

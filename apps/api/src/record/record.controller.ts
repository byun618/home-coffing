import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { CafeMemberGuard } from '../common/guards/cafe-member.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CreateRecordDto,
  RecordResponse,
  UpdateRecordDto,
} from './dto';
import { RecordService } from './record.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Get('cafes/:cafeId/records')
  @UseGuards(CafeMemberGuard)
  async list(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Query('beanId') beanIdRaw?: string,
    @Query('limit') limitRaw?: string,
    @Query('before') beforeRaw?: string,
  ): Promise<RecordResponse[]> {
    return this.recordService.listByCafe(cafeId, {
      beanId: beanIdRaw ? Number(beanIdRaw) : undefined,
      limit: limitRaw ? Number(limitRaw) : undefined,
      before: beforeRaw ? new Date(beforeRaw) : undefined,
    });
  }

  @Post('cafes/:cafeId/records')
  @UseGuards(CafeMemberGuard)
  async create(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRecordDto,
  ): Promise<RecordResponse> {
    return this.recordService.createRecord(cafeId, user.sub, dto);
  }

  @Get('records/:recordId')
  async getRecord(
    @Param('recordId', ParseIntPipe) recordId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<RecordResponse> {
    return this.recordService.getRecord(recordId, user.sub);
  }

  @Patch('records/:recordId')
  async update(
    @Param('recordId', ParseIntPipe) recordId: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateRecordDto,
  ): Promise<RecordResponse> {
    return this.recordService.updateRecord(recordId, user.sub, dto);
  }

  @Delete('records/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('recordId', ParseIntPipe) recordId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.recordService.deleteRecord(recordId, user.sub);
  }
}

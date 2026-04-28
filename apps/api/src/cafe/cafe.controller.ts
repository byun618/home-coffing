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
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { AdminGuard } from '../common/guards/admin.guard';
import { CafeMemberGuard } from '../common/guards/cafe-member.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CafeService } from './cafe.service';
import { CafeResponse, InvitationResponse, UpdateCafeDto } from './dto';

@Controller('cafes/:cafeId')
@UseGuards(JwtAuthGuard, CafeMemberGuard)
export class CafeController {
  constructor(private readonly cafeService: CafeService) {}

  @Get()
  async getCafe(
    @Param('cafeId', ParseIntPipe) cafeId: number,
  ): Promise<CafeResponse> {
    return this.cafeService.getCafe(cafeId);
  }

  @Patch()
  @UseGuards(AdminGuard)
  async updateCafe(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @Body() dto: UpdateCafeDto,
  ): Promise<CafeResponse> {
    return this.cafeService.updateCafe(cafeId, dto);
  }

  @Delete('members/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leaveCafe(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.cafeService.leaveCafe(cafeId, user.sub);
  }

  @Post('invitations')
  @UseGuards(AdminGuard)
  async createInvitation(
    @Param('cafeId', ParseIntPipe) cafeId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<InvitationResponse> {
    return this.cafeService.createInvitation(cafeId, user.sub);
  }
}

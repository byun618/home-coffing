import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MeResponse, UpdateMeDto } from './dto';
import { UserService } from './user.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getMe(@CurrentUser() user: JwtPayload): Promise<MeResponse> {
    return this.userService.getMe(user.sub);
  }

  @Patch()
  async updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<MeResponse> {
    return this.userService.updateMe(user.sub, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.userService.deleteMe(user.sub);
  }
}

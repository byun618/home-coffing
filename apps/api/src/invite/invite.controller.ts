import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteCreateDto } from './dto/invite-create.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities';

@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: InviteCreateDto) {
    return this.inviteService.create(user, dto);
  }

  @Get(':token')
  getInfo(@Param('token') token: string) {
    return this.inviteService.getInfo(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  accept(@CurrentUser() user: User, @Param('token') token: string) {
    return this.inviteService.accept(user, token);
  }
}

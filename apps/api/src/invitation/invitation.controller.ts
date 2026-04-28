import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AcceptInvitationResponse } from './dto';
import { InvitationService } from './invitation.service';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post(':code/accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Param('code') code: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AcceptInvitationResponse> {
    return this.invitationService.accept(code, user.sub);
  }
}

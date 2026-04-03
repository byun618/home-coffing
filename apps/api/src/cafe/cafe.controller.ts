import { Controller, Get, UseGuards } from '@nestjs/common';
import { CafeService } from './cafe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities';

@Controller('cafe')
@UseGuards(JwtAuthGuard)
export class CafeController {
  constructor(private readonly cafeService: CafeService) {}

  @Get()
  getInfo(@CurrentUser() user: User) {
    return this.cafeService.getInfo(user);
  }

  @Get('members')
  getMembers(@CurrentUser() user: User) {
    return this.cafeService.getMembers(user);
  }
}

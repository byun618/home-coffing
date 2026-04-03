import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me/onboarding')
  @UseGuards(JwtAuthGuard)
  onboarding(@CurrentUser() user: User, @Body() dto: OnboardingDto) {
    return this.userService.saveOnboarding(user, dto);
  }
}

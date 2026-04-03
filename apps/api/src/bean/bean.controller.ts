import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BeanService } from './bean.service';
import { BeanCreateDto } from './dto/bean-create.dto';
import { BeanUpdateDto } from './dto/bean-update.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities';

@Controller('beans')
@UseGuards(JwtAuthGuard)
export class BeanController {
  constructor(private readonly beanService: BeanService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.beanService.list(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: BeanCreateDto) {
    return this.beanService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BeanUpdateDto,
  ) {
    return this.beanService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.beanService.remove(user, id);
  }
}

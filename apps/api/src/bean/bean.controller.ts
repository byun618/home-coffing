import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BeanService } from './bean.service';
import { BeanCreateDto } from './dto/bean-create.dto';
import { BeanUpdateDto } from './dto/bean-update.dto';

@Controller('beans')
export class BeanController {
  constructor(private readonly beanService: BeanService) {}

  @Get()
  list() {
    return this.beanService.list();
  }

  @Post()
  create(@Body() dto: BeanCreateDto) {
    return this.beanService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: BeanUpdateDto) {
    return this.beanService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.beanService.remove(id);
  }
}

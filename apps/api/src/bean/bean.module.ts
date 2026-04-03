import { Module } from '@nestjs/common';
import { BeanController } from './bean.controller';
import { BeanService } from './bean.service';

@Module({
  controllers: [BeanController],
  providers: [BeanService],
  exports: [BeanService],
})
export class BeanModule {}

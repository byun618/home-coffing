import { Module } from '@nestjs/common';
import { CafeModule } from '../cafe/cafe.module';
import { BeanController } from './bean.controller';
import { BeanService } from './bean.service';

@Module({
  imports: [CafeModule],
  controllers: [BeanController],
  providers: [BeanService],
  exports: [BeanService],
})
export class BeanModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Bean,
  CafeUser,
  RecordBean,
  Roaster,
} from '../common/entities';
import { BeanController } from './bean.controller';
import { BeanService } from './bean.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([Bean, CafeUser, Roaster, RecordBean]),
  ],
  controllers: [BeanController],
  providers: [BeanService],
  exports: [BeanService],
})
export class BeanModule {}

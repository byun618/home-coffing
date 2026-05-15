import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Bean,
  CafeBean,
  CafeUser,
  RecordBean,
  User,
} from '../common/entities';
import { CafeBeanController } from './cafe-bean.controller';
import { CafeBeanService } from './cafe-bean.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Bean,
      CafeBean,
      CafeUser,
      RecordBean,
      User,
    ]),
  ],
  controllers: [CafeBeanController],
  providers: [CafeBeanService],
  exports: [CafeBeanService],
})
export class CafeBeanModule {}

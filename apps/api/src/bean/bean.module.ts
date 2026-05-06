import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Bean,
  CafeBean,
  CafeUser,
  RecordBean,
  Roaster,
  User,
} from '../common/entities';
import { BeanController } from './bean.controller';
import { BeanService } from './bean.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Bean,
      CafeBean,
      CafeUser,
      Roaster,
      RecordBean,
      User,
    ]),
  ],
  controllers: [BeanController],
  providers: [BeanService],
  exports: [BeanService],
})
export class BeanModule {}

import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  Bean,
  CafeUser,
  Record as RecordEntity,
  RecordBean,
  User,
} from '../common/entities';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([RecordEntity, RecordBean, Bean, CafeUser, User]),
  ],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}

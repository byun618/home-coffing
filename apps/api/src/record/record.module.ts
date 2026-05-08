import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CafeBean,
  CafeUser,
  Recipe,
  RecipeEquipment,
  Record as RecordEntity,
  RecordBean,
  TasteNote,
  User,
} from '../common/entities';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      RecordEntity,
      RecordBean,
      CafeBean,
      CafeUser,
      Recipe,
      RecipeEquipment,
      TasteNote,
      User,
    ]),
  ],
  controllers: [RecordController],
  providers: [RecordService],
  exports: [RecordService],
})
export class RecordModule {}

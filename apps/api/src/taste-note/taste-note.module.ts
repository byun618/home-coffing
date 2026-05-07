import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import {
  CafeUser,
  Record as RecordEntity,
  TasteNote,
  User,
} from '../common/entities';
import { TasteNoteController } from './taste-note.controller';
import { TasteNoteService } from './taste-note.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([TasteNote, RecordEntity, CafeUser, User]),
  ],
  controllers: [TasteNoteController],
  providers: [TasteNoteService],
})
export class TasteNoteModule {}

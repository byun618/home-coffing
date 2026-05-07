import { HttpStatus, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import {
  CafeUser,
  Record as RecordEntity,
  TasteNote,
  User,
} from '../common/entities';
import { ApiError, Errors } from '../common/exceptions/api-error.exception';
import { CreateTasteNoteDto, TasteNoteResponse, UpdateTasteNoteDto } from './dto';
import { mapTasteNote } from './mapper';

@Injectable()
export class TasteNoteService {
  constructor(private readonly em: EntityManager) {}

  async create(
    recordId: number,
    userId: number,
    dto: CreateTasteNoteDto,
  ): Promise<TasteNoteResponse> {
    return this.em.transactional(async (em) => {
      const record = await em.findOne(
        RecordEntity,
        { id: recordId },
        { populate: ['cafe'] },
      );
      if (!record) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }

      const membership = await em.findOne(CafeUser, {
        cafe: record.cafe.id,
        user: userId,
      });
      if (!membership) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      const author = await em.findOne(User, { id: userId });
      if (!author) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }

      const tasteNote = em.create(TasteNote, {
        record,
        author,
        rating: dto.rating ?? null,
        memo: dto.memo ?? null,
        createdAt: new Date(),
      });
      em.persist(tasteNote);
      await em.flush();

      return mapTasteNote(tasteNote);
    });
  }

  async update(
    tasteNoteId: number,
    userId: number,
    dto: UpdateTasteNoteDto,
  ): Promise<TasteNoteResponse> {
    return this.em.transactional(async (em) => {
      const tasteNote = await em.findOne(
        TasteNote,
        { id: tasteNoteId },
        { populate: ['author', 'record'] },
      );
      if (!tasteNote) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (tasteNote.author.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }

      if (dto.rating !== undefined) {
        tasteNote.rating = dto.rating;
      }
      if (dto.memo !== undefined) {
        tasteNote.memo = dto.memo;
      }

      await em.flush();
      return mapTasteNote(tasteNote);
    });
  }

  async delete(tasteNoteId: number, userId: number): Promise<void> {
    return this.em.transactional(async (em) => {
      const tasteNote = await em.findOne(
        TasteNote,
        { id: tasteNoteId },
        { populate: ['author'] },
      );
      if (!tasteNote) {
        throw new ApiError(HttpStatus.NOT_FOUND, Errors.NOT_FOUND);
      }
      if (tasteNote.author.id !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, Errors.FORBIDDEN);
      }
      em.remove(tasteNote);
      await em.flush();
    });
  }
}

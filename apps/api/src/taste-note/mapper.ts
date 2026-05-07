import { TasteNote } from '../common/entities';
import type { TasteNoteResponse } from './dto';

export function mapTasteNote(tasteNote: TasteNote): TasteNoteResponse {
  return {
    id: tasteNote.id,
    recordId: tasteNote.record.id,
    author: {
      id: tasteNote.author.id,
      email: tasteNote.author.email,
      displayName: tasteNote.author.displayName,
    },
    rating: tasteNote.rating !== null ? Number(tasteNote.rating) : null,
    memo: tasteNote.memo,
    createdAt: tasteNote.createdAt,
  };
}

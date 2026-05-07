import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { TasteNoteResponse } from "../types";
import { recordKeys } from "./records";

export const tasteNoteKeys = {
  all: ["taste-notes"] as const,
};

export interface TasteNoteCreateInput {
  rating?: number;
  memo?: string;
}

export interface TasteNoteUpdateInput {
  rating?: number | null;
  memo?: string | null;
}

export function useTasteNoteCreate(recordId: number, cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TasteNoteCreateInput) =>
      api.post<TasteNoteResponse>(
        `/records/${recordId}/taste-notes`,
        input,
      ),
    onSuccess: (note) => {
      // TODO(analytics): track('taste_note_created', {
      //   record_id: recordId, cafe_id: cafeId, taste_note_id: note.id,
      //   has_rating: note.rating !== null, has_memo: note.memo !== null,
      //   memo_length: note.memo?.length ?? 0,
      //   delay_hours_from_record: (record.brewedAt → now) — record context 필요
      // }) — analytics SDK 도입 ticket에서 wire-up
      void note;
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(recordId) });
      if (cafeId !== null) {
        queryClient.invalidateQueries({
          queryKey: recordKeys.cafeList(cafeId),
        });
      }
    },
  });
}

export function useTasteNoteUpdate(
  tasteNoteId: number,
  recordId: number,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TasteNoteUpdateInput) =>
      api.patch<TasteNoteResponse>(`/taste-notes/${tasteNoteId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(recordId) });
    },
  });
}

export function useTasteNoteDelete(recordId: number, cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tasteNoteId: number) =>
      api.delete<void>(`/taste-notes/${tasteNoteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(recordId) });
      if (cafeId !== null) {
        queryClient.invalidateQueries({
          queryKey: recordKeys.cafeList(cafeId),
        });
      }
    },
  });
}

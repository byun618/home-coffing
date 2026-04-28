import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { Record, RecipeJson, TasteNoteJson } from "../types";
import { beanKeys } from "./beans";

export const recordKeys = {
  all: ["records"] as const,
  cafeList: (cafeId: number, beanId?: number) =>
    ["records", "cafe", cafeId, beanId ?? "all"] as const,
  detail: (id: number) => ["records", "detail", id] as const,
};

export interface UseRecordsOptions {
  beanId?: number;
  limit?: number;
}

export function useRecordsList(
  cafeId: number | null,
  options: UseRecordsOptions = {},
) {
  const params = new URLSearchParams();
  if (options.beanId) params.append("beanId", String(options.beanId));
  if (options.limit) params.append("limit", String(options.limit));
  const qs = params.toString();

  return useQuery({
    queryKey: cafeId
      ? recordKeys.cafeList(cafeId, options.beanId)
      : ["records", "cafe", "none"],
    enabled: cafeId !== null,
    queryFn: () =>
      api.get<Record[]>(`/cafes/${cafeId}/records${qs ? `?${qs}` : ""}`),
  });
}

export function useRecordDetail(recordId: number | null) {
  return useQuery({
    queryKey: recordId ? recordKeys.detail(recordId) : ["records", "detail", "none"],
    enabled: recordId !== null,
    queryFn: () => api.get<Record>(`/records/${recordId}`),
  });
}

export interface CreateRecordInput {
  beans: Array<{ beanId: number; grams: number }>;
  brewedAt: string;
  cups?: number;
  memo?: string;
  recipe?: RecipeJson;
  tasteNote?: TasteNoteJson;
}

export function useCreateRecord(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecordInput) =>
      api.post<Record>(`/cafes/${cafeId}/records`, input),
    onSuccess: (record) => {
      queryClient.invalidateQueries({
        queryKey: recordKeys.cafeList(record.cafeId),
      });
      queryClient.invalidateQueries({ queryKey: beanKeys.list(record.cafeId) });
      record.beans.forEach((bean) => {
        queryClient.invalidateQueries({
          queryKey: beanKeys.detail(bean.beanId),
        });
      });
    },
  });
}

export interface UpdateRecordInput {
  beans?: Array<{ beanId: number; grams: number }>;
  brewedAt?: string;
  cups?: number;
  memo?: string;
  recipe?: RecipeJson;
  tasteNote?: TasteNoteJson;
}

export function useUpdateRecord(recordId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRecordInput) =>
      api.patch<Record>(`/records/${recordId}`, input),
    onSuccess: (record) => {
      queryClient.invalidateQueries({
        queryKey: recordKeys.cafeList(record.cafeId),
      });
      queryClient.invalidateQueries({ queryKey: recordKeys.detail(record.id) });
      queryClient.invalidateQueries({ queryKey: beanKeys.list(record.cafeId) });
    },
  });
}

export function useDeleteRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) =>
      api.delete<void>(`/records/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recordKeys.all });
      queryClient.invalidateQueries({ queryKey: beanKeys.all });
    },
  });
}

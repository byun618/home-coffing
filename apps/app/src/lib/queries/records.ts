import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { Record } from "../types";
import { beanKeys } from "./beans";

export const recordKeys = {
  all: ["records"] as const,
  /**
   * cafeId + beanId 조합이 cache 단위.
   * limit는 queryKey에 포함하지 않는다 — 같은 (cafe, bean) 조합 list는
   * 하나의 캐시에 가장 큰 limit 응답을 박고, 더 작은 limit 호출은 그 캐시를
   * 그대로 본다(slice는 사용처 책임). limit별 별도 캐시는 데이터 fan-out만
   * 늘리고 invalidate 일관성을 깬다.
   */
  cafeList: (cafeId: number, beanId?: number) =>
    ["records", "cafe", cafeId, beanId ?? "all"] as const,
  detail: (id: number) => ["records", "detail", id] as const,
};

/**
 * 모든 cafe records list 호출이 공유하는 server-side limit.
 * 가장 큰 사용처(피드 50)에 맞춰 통일 — 캐시 충돌 회피.
 */
const CAFE_RECORDS_LIMIT = 50;

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
  // server-side는 항상 통일된 큰 limit으로. 호출처는 결과 array를 slice해서 표시.
  params.append("limit", String(CAFE_RECORDS_LIMIT));
  const qs = params.toString();

  const requestedLimit = options.limit;
  const query = useQuery({
    queryKey: cafeId
      ? recordKeys.cafeList(cafeId, options.beanId)
      : ["records", "cafe", "none"],
    enabled: cafeId !== null,
    queryFn: () =>
      api.get<Record[]>(`/cafes/${cafeId}/records${qs ? `?${qs}` : ""}`),
  });

  if (requestedLimit !== undefined && query.data) {
    return {
      ...query,
      data: query.data.slice(0, requestedLimit),
    };
  }
  return query;
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
  recipeId?: number | null;
  memo?: string | null;
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
  recipeId?: number | null;
  memo?: string | null;
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type {
  CafeBeanCreateRequest,
  CafeBeanResponse,
  CafeBeanUpdateRequest,
} from "../types";

// T005 — path rename: /cafes/:cafeId/beans → /cafes/:cafeId/cafe-beans,
//                     /beans/:id → /cafe-beans/:id.
// catalog 검색은 별 모듈 (queries/bean-catalog.ts). 여기는 "한 봉지(CafeBean)" 단위 CRUD만.

export const beanKeys = {
  all: ["cafe-beans"] as const,
  list: (cafeId: number) => ["cafe-beans", "list", cafeId] as const,
  detail: (id: number) => ["cafe-beans", "detail", id] as const,
};

export function useBeansList(cafeId: number | null) {
  return useQuery({
    queryKey: cafeId ? beanKeys.list(cafeId) : ["cafe-beans", "list", "none"],
    enabled: cafeId !== null,
    queryFn: () => api.get<CafeBeanResponse[]>(`/cafes/${cafeId}/cafe-beans`),
  });
}

export function useBeanDetail(id: number | null) {
  return useQuery({
    queryKey: id ? beanKeys.detail(id) : ["cafe-beans", "detail", "none"],
    enabled: id !== null,
    queryFn: () => api.get<CafeBeanResponse>(`/cafe-beans/${id}`),
  });
}

// shared-types의 CafeBeanCreateRequest와 동일 — 클라이언트 컨벤션상 별 alias 유지.
export type CreateBeanInput = CafeBeanCreateRequest;
export type UpdateBeanInput = CafeBeanUpdateRequest;

export function useCreateBean(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBeanInput) =>
      api.post<CafeBeanResponse>(`/cafes/${cafeId}/cafe-beans`, input),
    onSuccess: () => {
      if (cafeId !== null) {
        queryClient.invalidateQueries({ queryKey: beanKeys.list(cafeId) });
      }
    },
  });
}

export function useUpdateBean(id: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBeanInput) =>
      api.patch<CafeBeanResponse>(`/cafe-beans/${id}`, input),
    onSuccess: (cafeBean) => {
      queryClient.invalidateQueries({ queryKey: beanKeys.list(cafeBean.cafeId) });
      queryClient.invalidateQueries({ queryKey: beanKeys.detail(cafeBean.id) });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { Bean } from "../types";

export const beanKeys = {
  all: ["beans"] as const,
  list: (cafeId: number) => ["beans", "list", cafeId] as const,
  detail: (beanId: number) => ["beans", "detail", beanId] as const,
};

export function useBeansList(cafeId: number | null) {
  return useQuery({
    queryKey: cafeId ? beanKeys.list(cafeId) : ["beans", "list", "none"],
    enabled: cafeId !== null,
    queryFn: () => api.get<Bean[]>(`/cafes/${cafeId}/beans`),
  });
}

export function useBeanDetail(beanId: number | null) {
  return useQuery({
    queryKey: beanId ? beanKeys.detail(beanId) : ["beans", "detail", "none"],
    enabled: beanId !== null,
    queryFn: () => api.get<Bean>(`/beans/${beanId}`),
  });
}

export interface CreateBeanInput {
  name: string;
  origin?: string;
  totalGrams: number;
  orderedAt: string;
  roastedOn: string;
  arrivedAt?: string;
  degassingDays?: number;
  cupsPerDay?: number;
  gramsPerCup?: number;
}

export function useCreateBean(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBeanInput) =>
      api.post<Bean>(`/cafes/${cafeId}/beans`, input),
    onSuccess: () => {
      if (cafeId !== null) {
        queryClient.invalidateQueries({ queryKey: beanKeys.list(cafeId) });
      }
    },
  });
}

export interface UpdateBeanInput {
  name?: string;
  origin?: string;
  totalGrams?: number;
  orderedAt?: string;
  roastedOn?: string;
  arrivedAt?: string;
  degassingDays?: number;
  cupsPerDay?: number;
  gramsPerCup?: number;
  autoRopEnabled?: boolean;
  finishedAt?: string;
  finishedReason?: "consumed" | "discarded";
  archivedAt?: string;
}

export function useUpdateBean(beanId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBeanInput) =>
      api.patch<Bean>(`/beans/${beanId}`, input),
    onSuccess: (bean) => {
      queryClient.invalidateQueries({ queryKey: beanKeys.list(bean.cafeId) });
      queryClient.invalidateQueries({ queryKey: beanKeys.detail(bean.id) });
    },
  });
}

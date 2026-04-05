import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BeanCreateRequest,
  BeanUpdateRequest,
  BeanWithStats,
} from "@home-coffing/shared-types";
import { api } from "../api";

export const beansKey = ["beans"] as const;
export const beanKey = (id: number) => ["beans", id] as const;

export function useBeans() {
  return useQuery({
    queryKey: beansKey,
    queryFn: () => api<BeanWithStats[]>("/beans"),
  });
}

export function useCreateBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BeanCreateRequest) =>
      api<BeanWithStats>("/beans", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: beansKey }),
  });
}

export function useUpdateBean(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BeanUpdateRequest) =>
      api<BeanWithStats>(`/beans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: beansKey });
      qc.invalidateQueries({ queryKey: beanKey(id) });
    },
  });
}

export function useDeleteBean() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<void>(`/beans/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: beansKey }),
  });
}

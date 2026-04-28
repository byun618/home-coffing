import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { Cafe, Invitation } from "../types";

export const cafeKeys = {
  detail: (cafeId: number) => ["cafe", cafeId] as const,
};

export function useCafeDetail(cafeId: number | null) {
  return useQuery({
    queryKey: cafeId ? cafeKeys.detail(cafeId) : ["cafe", "none"],
    enabled: cafeId !== null,
    queryFn: () => api.get<Cafe>(`/cafes/${cafeId}`),
  });
}

export function useUpdateCafeName(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.patch<Cafe>(`/cafes/${cafeId}`, { name }),
    onSuccess: (cafe) => {
      queryClient.invalidateQueries({ queryKey: cafeKeys.detail(cafe.id) });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLeaveCafe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cafeId: number) =>
      api.delete<void>(`/cafes/${cafeId}/members/me`),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useCreateInvitation(cafeId: number | null) {
  return useMutation({
    mutationFn: () => api.post<Invitation>(`/cafes/${cafeId}/invitations`),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      api.post<{
        cafeId: number;
        cafeName: string;
        role: "admin" | "member";
        invitationId: number;
        invitedBy: number;
      }>(`/invitations/${code}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

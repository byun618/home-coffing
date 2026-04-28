import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import { useAuthStore } from "../stores/auth-store";
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
    onSuccess: async (cafe) => {
      queryClient.invalidateQueries({ queryKey: cafeKeys.detail(cafe.id) });
      // user.memberships에 cafeName이 들어있어 auth-store도 갱신해야 Home/더보기에 반영됨
      await useAuthStore.getState().refreshMe();
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

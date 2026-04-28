import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type { UserMe } from "../types";
import { useAuthStore } from "../stores/auth-store";

export interface UpdateMeInput {
  displayName?: string;
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  return useMutation({
    mutationFn: (input: UpdateMeInput) => api.patch<UserMe>("/me", input),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      await refreshMe();
    },
  });
}

export function useDeleteMe() {
  return useMutation({
    mutationFn: () => api.delete<void>("/me"),
  });
}

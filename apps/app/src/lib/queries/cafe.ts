import { useQuery } from "@tanstack/react-query";
import type { CafeInfo } from "@home-coffing/shared-types";
import { api } from "../api";

export const cafeKey = ["cafe"] as const;

export function useCafe() {
  return useQuery({
    queryKey: cafeKey,
    queryFn: () => api<CafeInfo>("/cafe"),
  });
}

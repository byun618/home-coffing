import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import type { BeanCatalogItem } from "../types";

// T005 — Bean catalog (글로벌 seed) 검색·최근 사용.
// GET /beans : 전체 catalog or 활성 봉지가 있는 catalog만 (activeOnly=true)
// GET /beans/recent?cafeId= : 해당 카페의 최근 사용 catalog

const FIVE_MIN_MS = 5 * 60 * 1000;

export const beanCatalogKeys = {
  all: ["bean-catalog"] as const,
  list: (params: BeanCatalogListParams) =>
    ["bean-catalog", "list", params] as const,
  recent: (cafeId: number, limit: number) =>
    ["bean-catalog", "recent", cafeId, limit] as const,
};

export interface BeanCatalogListParams {
  search?: string;
  activeOnly?: boolean;
  cafeId?: number;
  limit?: number;
}

function buildQuery(params: BeanCatalogListParams): string {
  const parts: string[] = [];
  if (params.search && params.search.length > 0) {
    parts.push(`search=${encodeURIComponent(params.search)}`);
  }
  if (params.activeOnly) {
    parts.push(`activeOnly=true`);
  }
  if (params.cafeId !== undefined) {
    parts.push(`cafeId=${params.cafeId}`);
  }
  if (params.limit !== undefined) {
    parts.push(`limit=${params.limit}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export function useBeanCatalog(params: BeanCatalogListParams) {
  return useQuery({
    queryKey: beanCatalogKeys.list(params),
    queryFn: () =>
      api.get<BeanCatalogItem[]>(`/beans${buildQuery(params)}`),
    // 검색어 입력 도중 빈번한 refetch 방지 + catalog는 변동 적음
    staleTime: FIVE_MIN_MS,
  });
}

export function useRecentBeanCatalog(cafeId: number | null, limit = 10) {
  return useQuery({
    queryKey:
      cafeId !== null
        ? beanCatalogKeys.recent(cafeId, limit)
        : ["bean-catalog", "recent", "none"],
    enabled: cafeId !== null,
    queryFn: () =>
      api.get<BeanCatalogItem[]>(
        `/beans/recent?cafeId=${cafeId}&limit=${limit}`,
      ),
    staleTime: FIVE_MIN_MS,
  });
}

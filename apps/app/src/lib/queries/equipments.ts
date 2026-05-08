import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type {
  EquipmentCreateRequest,
  EquipmentResponse,
  EquipmentType,
} from "../types";

export const equipmentKeys = {
  all: ["equipments"] as const,
  byType: (type: EquipmentType | "all") => ["equipments", type] as const,
};

const ONE_HOUR_MS = 60 * 60 * 1000;

export function useEquipments(type?: EquipmentType) {
  const qs = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: equipmentKeys.byType(type ?? "all"),
    queryFn: () => api.get<EquipmentResponse[]>(`/equipments${qs}`),
    staleTime: ONE_HOUR_MS,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EquipmentCreateRequest) =>
      api.post<EquipmentResponse>(`/equipments`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "equipments",
      });
    },
  });
}

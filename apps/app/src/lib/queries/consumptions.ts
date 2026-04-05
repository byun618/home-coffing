import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConsumptionCreateRequest,
  ConsumptionResult,
} from "@home-coffing/shared-types";
import { api } from "../api";
import { beansKey } from "./beans";

interface Consumption {
  id: number;
  beanId: number;
  amount: number;
  createdAt: string;
  bean?: { name: string };
}

export const consumptionsKey = ["consumptions"] as const;
export const consumptionsByBeanKey = (beanId: number) =>
  ["consumptions", { beanId }] as const;

export function useConsumptions() {
  return useQuery({
    queryKey: consumptionsKey,
    queryFn: () => api<Consumption[]>("/consumptions"),
  });
}

export function useConsumptionsByBean(beanId: number) {
  return useQuery({
    queryKey: consumptionsByBeanKey(beanId),
    queryFn: () => api<Consumption[]>(`/consumptions?beanId=${beanId}`),
    enabled: Number.isFinite(beanId),
  });
}

export function useCreateConsumption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConsumptionCreateRequest) =>
      api<ConsumptionResult>("/consumptions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: beansKey });
      qc.invalidateQueries({ queryKey: consumptionsKey });
      for (const item of vars.items) {
        qc.invalidateQueries({ queryKey: consumptionsByBeanKey(item.beanId) });
      }
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../api";
import type {
  RecipeCreateRequest,
  RecipeResponse,
  RecipeUpdateRequest,
} from "../types";
import { recordKeys } from "./records";
import { useRecordsList } from "./records";

export const recipeKeys = {
  all: ["recipes"] as const,
  cafeList: (cafeId: number) => ["recipes", cafeId] as const,
  detail: (cafeId: number, recipeId: number) =>
    ["recipes", cafeId, recipeId] as const,
};

export function useRecipes(cafeId: number | null) {
  return useQuery({
    queryKey: cafeId ? recipeKeys.cafeList(cafeId) : ["recipes", "none"],
    enabled: cafeId !== null && cafeId > 0,
    queryFn: () =>
      api.get<RecipeResponse[]>(`/cafes/${cafeId}/recipes`),
  });
}

export function useRecipe(cafeId: number | null, recipeId: number | null) {
  return useQuery({
    queryKey:
      cafeId && recipeId
        ? recipeKeys.detail(cafeId, recipeId)
        : ["recipes", "detail", "none"],
    enabled: cafeId !== null && cafeId > 0 && recipeId !== null,
    queryFn: () =>
      api.get<RecipeResponse>(`/cafes/${cafeId}/recipes/${recipeId}`),
  });
}

function assertCafeId(cafeId: number | null): asserts cafeId is number {
  if (cafeId === null || cafeId <= 0) {
    throw new Error("cafeId is required for this mutation");
  }
}

export function useCreateRecipe(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecipeCreateRequest) => {
      assertCafeId(cafeId);
      return api.post<RecipeResponse>(`/cafes/${cafeId}/recipes`, input);
    },
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.cafeList(recipe.cafeId),
      });
    },
  });
}

export interface UpdateRecipeInput {
  recipeId: number;
  body: RecipeUpdateRequest;
}

export function useUpdateRecipe(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, body }: UpdateRecipeInput) => {
      assertCafeId(cafeId);
      return api.patch<RecipeResponse>(
        `/cafes/${cafeId}/recipes/${recipeId}`,
        body,
      );
    },
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({
        queryKey: recipeKeys.cafeList(recipe.cafeId),
      });
      queryClient.invalidateQueries({
        queryKey: recordKeys.cafeList(recipe.cafeId),
      });
    },
  });
}

export function useDeleteRecipe(cafeId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: number) => {
      assertCafeId(cafeId);
      return api.delete<void>(`/cafes/${cafeId}/recipes/${recipeId}`);
    },
    onSuccess: () => {
      if (cafeId !== null) {
        queryClient.invalidateQueries({
          queryKey: recipeKeys.cafeList(cafeId),
        });
        queryClient.invalidateQueries({
          queryKey: recordKeys.cafeList(cafeId),
        });
      }
    },
  });
}

/**
 * 직전 사용한 레시피 id 추론.
 * - records 첫 항목의 record.recipe?.id 우선
 * - 없으면 등록 recipes의 첫 항목 id로 fallback
 * - 둘 다 없으면 null
 *
 * useRecords/useRecipes를 그대로 재사용하므로 별도 API 호출 없음.
 */
export function useLastUsedRecipeId(cafeId: number | null): number | null {
  const records = useRecordsList(cafeId, { limit: 1 });
  const recipes = useRecipes(cafeId);

  const fromRecord = records.data?.[0]?.recipe?.id;
  if (fromRecord) return fromRecord;

  const firstRecipe = recipes.data?.[0]?.id;
  return firstRecipe ?? null;
}

import { ChevronDown } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import {
  formatRecipePlaceholder,
  formatRecipeSummary,
} from "../lib/recipe-format";
import type { RecipeResponse } from "../lib/types";

interface Props {
  recipe: RecipeResponse | null;
  onTap: () => void;
}

/**
 * Quick Record / Record Detail에서 쓰는 레시피 칩.
 * - 채워짐: bg-accent + 이름(없으면 placeholder) + summary 1줄
 * - 빈 상태: 점선 border + "+ 레시피 추가"
 */
export function RecipeChip({ recipe, onTap }: Props) {
  if (!recipe) {
    return (
      <Pressable
        onPress={onTap}
        className="bg-bg-secondary items-center justify-center active:opacity-80"
        style={{
          height: 56,
          borderRadius: 14,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#A89A8C",
        }}
      >
        <Text className="text-[14px] font-pretendard-medium text-text-tertiary">
          + 레시피 추가
        </Text>
      </Pressable>
    );
  }

  const title = recipe.name?.trim() || formatRecipePlaceholder(recipe);
  const summary = formatRecipeSummary(recipe);

  return (
    <Pressable
      onPress={onTap}
      className="bg-accent flex-row items-center active:opacity-80"
      style={{
        minHeight: 60,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <View className="flex-1" style={{ gap: 2 }}>
        <Text
          className="text-[15px] font-pretendard-bold text-text-on-dark"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="text-[11px] font-pretendard"
          style={{ color: "#D9C5B0" }}
          numberOfLines={1}
        >
          {summary}
        </Text>
      </View>
      <ChevronDown size={18} color="#FBF9F6" />
    </Pressable>
  );
}

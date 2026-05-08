import { useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RecipeWizardSheet } from "../src/components/sheets/RecipeWizardSheet";
import { useRecipes } from "../src/lib/queries/recipes";
import {
  formatMethodLabel,
  formatRecipePlaceholder,
  formatRecipeSummary,
} from "../src/lib/recipe-format";
import { useAuthStore } from "../src/lib/stores/auth-store";

export default function RecipesScreen() {
  const router = useRouter();
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const recipesQuery = useRecipes(activeCafeId);

  const [createOpen, setCreateOpen] = useState(false);

  const recipes = recipesQuery.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View
        className="flex-row items-center justify-between"
        style={{ height: 52, paddingHorizontal: 16 }}
      >
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ArrowLeft size={22} color="#2A1F18" />
          </Pressable>
          <Text className="text-[17px] font-pretendard-semibold text-text-primary">
            내 레시피
          </Text>
        </View>
        <Pressable
          onPress={() => setCreateOpen(true)}
          className="w-10 h-10 items-center justify-center -mr-2"
        >
          <Plus size={22} color="#3A2419" />
        </Pressable>
      </View>

      {recipesQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3A2419" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 40,
            gap: 10,
          }}
          refreshControl={
            <RefreshControl
              refreshing={recipesQuery.isFetching && !recipesQuery.isLoading}
              onRefresh={() => recipesQuery.refetch()}
            />
          }
        >
          {recipes.length === 0 ? (
            <View className="items-center" style={{ paddingTop: 80, gap: 8 }}>
              <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                아직 등록된 레시피가 없어요
              </Text>
              <Text className="text-[13px] font-pretendard text-text-tertiary text-center">
                즐겨 쓰는 레시피를 등록해두면{"\n"}매 기록마다 빠르게 적용할 수 있어요
              </Text>
              <View style={{ height: 8 }} />
              <Pressable
                onPress={() => setCreateOpen(true)}
                className="bg-accent items-center justify-center active:opacity-80"
                style={{
                  paddingHorizontal: 18,
                  height: 44,
                  borderRadius: 22,
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Plus size={16} color="#FBF9F6" />
                <Text className="text-[14px] font-pretendard-bold text-text-on-dark">
                  새 레시피
                </Text>
              </Pressable>
            </View>
          ) : null}
          {recipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
              className="bg-bg-secondary active:opacity-80"
              style={{
                borderRadius: 16,
                padding: 16,
                gap: 8,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View
                  className="bg-bg-tertiary"
                  style={{
                    paddingHorizontal: 8,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[11px] font-pretendard-medium text-text-secondary">
                    {formatMethodLabel(recipe.method)}
                  </Text>
                </View>
                <Text
                  className="text-[15px] font-pretendard-bold text-text-primary flex-1"
                  numberOfLines={1}
                >
                  {recipe.name?.trim() || formatRecipePlaceholder(recipe)}
                </Text>
              </View>
              <Text
                className="text-[13px] font-pretendard text-text-secondary"
                numberOfLines={1}
              >
                {formatRecipeSummary(recipe)}
              </Text>
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                {recipe.usageCount}회 사용
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {createOpen && activeCafeId !== null ? (
        <RecipeWizardSheet
          visible
          onClose={() => setCreateOpen(false)}
          cafeId={activeCafeId}
          onSaved={() => setCreateOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

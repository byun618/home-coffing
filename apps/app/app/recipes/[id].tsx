import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Coffee,
  Droplet,
  Flame,
  Hourglass,
  MoreHorizontal,
  Snowflake,
  Sun,
  Waves,
  Weight,
  Wrench,
} from "lucide-react-native";
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

import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { RecipeWizardSheet } from "../../src/components/sheets/RecipeWizardSheet";
import {
  useDeleteRecipe,
  useRecipe,
} from "../../src/lib/queries/recipes";
import {
  cumulativePourGrams,
  formatBrewingTime,
  formatMethodLabel,
  formatTimeMmSs,
  pourStyleShort,
} from "../../src/lib/recipe-format";
import { showSuccess } from "../../src/lib/stores/alert-store";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import type {
  EquipmentType,
  PourOverParams,
  RecipeEquipmentInfo,
  RecipeResponse,
} from "../../src/lib/types";

function equipmentTypeLabel(type: EquipmentType): string {
  switch (type) {
    case "grinder":
      return "그라인더";
    case "brewer":
      return "드리퍼";
    case "kettle":
      return "케틀";
    case "scale":
      return "저울";
  }
}

function ratioFromYieldDose(dose: number, yieldG: number): string {
  if (!dose || !yieldG) return "—";
  const ratio = yieldG / dose;
  if (!Number.isFinite(ratio)) return "—";
  const rounded = Math.round(ratio * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
}

type WizardState =
  | { kind: "closed" }
  | { kind: "edit" }
  | { kind: "clone" };

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recipeId = id ? Number(id) : null;
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const meId = useAuthStore((state) => state.user?.id ?? null);

  const recipeQuery = useRecipe(activeCafeId, recipeId);
  const deleteMutation = useDeleteRecipe(activeCafeId);

  const [wizard, setWizard] = useState<WizardState>({ kind: "closed" });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const recipe = recipeQuery.data ?? null;

  if (recipeQuery.isLoading || !recipe) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#3A2419" />
      </SafeAreaView>
    );
  }

  const isAuthor =
    recipe.createdBy !== null && meId !== null && recipe.createdBy.id === meId;
  const recipeIdResolved = recipe.id;
  const recipeUsageCount = recipe.usageCount;

  async function onConfirmDelete() {
    setConfirmDelete(false);
    try {
      await deleteMutation.mutateAsync(recipeIdResolved);
      showSuccess("삭제 완료", "레시피가 삭제됐어요");
      router.back();
    } catch {
      showToast("삭제에 실패했어요", "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{ height: 52, paddingHorizontal: 16 }}
      >
        <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ArrowLeft size={22} color="#2A1F18" />
          </Pressable>
          <Text
            className="text-[17px] font-pretendard-semibold text-text-primary flex-1"
            numberOfLines={1}
          >
            {recipe.name?.trim() || "레시피"}
          </Text>
        </View>
        <View
          className="w-10 h-10 items-center justify-center -mr-2"
          style={{ opacity: 0.4 }}
        >
          <MoreHorizontal size={20} color="#7B6A5C" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 4,
          paddingBottom: isAuthor ? 24 : 40,
          gap: 24,
        }}
        refreshControl={
          <RefreshControl
            refreshing={recipeQuery.isFetching && !recipeQuery.isLoading}
            onRefresh={() => recipeQuery.refetch()}
          />
        }
      >
        <RecipeMetaRow recipe={recipe} />
        <SetupSection recipe={recipe} />
        <PoursSection recipe={recipe} />
        <EquipmentsSection equipments={recipe.equipments} />
      </ScrollView>

      {/* Footer 3-button — 작성자에게만 노출 */}
      {isAuthor ? (
        <View
          className="flex-row"
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 16,
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: "#E8DFD2",
          }}
        >
          <Pressable
            onPress={() => setWizard({ kind: "edit" })}
            className="flex-1 bg-accent items-center justify-center active:opacity-80"
            style={{ height: 50, borderRadius: 14 }}
          >
            <Text className="text-[15px] font-pretendard-bold text-text-on-dark">
              수정
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setWizard({ kind: "clone" })}
            className="flex-1 items-center justify-center active:opacity-80"
            style={{
              height: 50,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#3A2419",
            }}
          >
            <Text className="text-[15px] font-pretendard-bold text-accent">
              복제
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmDelete(true)}
            className="flex-1 items-center justify-center active:opacity-80"
            style={{
              height: 50,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#B55C3E",
            }}
          >
            <Text className="text-[15px] font-pretendard-bold text-danger">
              삭제
            </Text>
          </Pressable>
        </View>
      ) : null}

      {wizard.kind !== "closed" && activeCafeId !== null ? (
        <RecipeWizardSheet
          visible
          onClose={() => setWizard({ kind: "closed" })}
          cafeId={activeCafeId}
          initial={recipe}
          mode={wizard.kind}
          onSaved={(saved) => {
            setWizard({ kind: "closed" });
            if (wizard.kind === "clone" && saved.id !== recipe.id) {
              router.replace(`/recipes/${saved.id}`);
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="이 레시피를 삭제할까요?"
        message={
          recipe.usageCount > 0
            ? `${recipe.usageCount}개 record가 이 레시피를 사용 중이에요. 기록은 그대로 남고 레시피만 사라져요.`
            : "되돌릴 수 없어요."
        }
        confirmLabel="삭제"
        danger
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}

function RecipeMetaRow({ recipe }: { recipe: RecipeResponse }) {
  const params = recipe.params;
  let ratio = "—";
  if (params) {
    switch (params.method) {
      case "pour-over":
        ratio = ratioFromYieldDose(params.doseGrams, params.totalYieldGrams);
        break;
      case "espresso":
        ratio = ratioFromYieldDose(params.doseGrams, params.yieldGrams);
        break;
      case "french-press":
        ratio = ratioFromYieldDose(params.doseGrams, params.totalYieldGrams);
        break;
      case "aeropress":
        ratio = ratioFromYieldDose(params.doseGrams, params.yieldGrams);
        break;
    }
  }

  return (
    <View className="flex-row items-center" style={{ gap: 8, paddingTop: 8 }}>
      <View
        className="bg-bg-tertiary"
        style={{
          paddingHorizontal: 10,
          height: 24,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text className="text-[12px] font-pretendard-medium text-text-secondary">
          {formatMethodLabel(recipe.method)}
        </Text>
      </View>
      <Text className="text-[13px] font-pretendard text-text-secondary">
        {recipe.usageCount}회 사용 · 1:{ratio}
      </Text>
    </View>
  );
}

function SetupSection({ recipe }: { recipe: RecipeResponse }) {
  const params = recipe.params;
  return (
    <View className="gap-3">
      <Text className="text-[14px] font-pretendard-bold text-text-primary">
        셋업
      </Text>
      {params ? (
        <SetupGrid params={params} method={recipe.method} />
      ) : (
        <Text className="text-[13px] font-pretendard text-text-tertiary">
          저장된 셋업 정보가 없어요
        </Text>
      )}
    </View>
  );
}

function SetupGrid({
  params,
  method,
}: {
  params: NonNullable<RecipeResponse["params"]>;
  method: RecipeResponse["method"];
}) {
  // 6 cells (+ iced 시 얼음 1셀 추가) — 행당 3 cell
  const cells: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
  }> = [];

  cells.push({
    icon: <Weight size={14} color="#7B6A5C" />,
    label: "원두 양",
    value: `${params.doseGrams}g`,
  });
  cells.push({
    icon: <Hourglass size={14} color="#7B6A5C" />,
    label: "분쇄도",
    value: `${params.grindSize}`,
  });
  cells.push({
    icon: <Flame size={14} color="#7B6A5C" />,
    label: "물 온도",
    value: `${params.waterTempC}°C`,
  });

  // 모드 / 추출량 / 시간 — method별 분기
  switch (params.method) {
    case "pour-over": {
      cells.push({
        icon:
          params.serveMode === "iced" ? (
            <Snowflake size={14} color="#7B6A5C" />
          ) : (
            <Sun size={14} color="#7B6A5C" />
          ),
        label: "모드",
        value: params.serveMode === "iced" ? "Iced" : "Hot",
      });
      cells.push({
        icon: <Droplet size={14} color="#7B6A5C" />,
        label: "총 추출량",
        value: `${params.totalYieldGrams}g`,
      });
      cells.push({
        icon: <Hourglass size={14} color="#7B6A5C" />,
        label: "총 시간",
        value: formatBrewingTime(params.totalTimeSec),
      });
      if (params.serveMode === "iced" && params.iceGrams !== undefined) {
        cells.push({
          icon: <Snowflake size={14} color="#7B6A5C" />,
          label: "얼음",
          value: `${params.iceGrams}g`,
        });
      }
      break;
    }
    case "espresso": {
      cells.push({
        icon: <Sun size={14} color="#7B6A5C" />,
        label: "모드",
        value: formatMethodLabel(method),
      });
      cells.push({
        icon: <Droplet size={14} color="#7B6A5C" />,
        label: "추출량",
        value: `${params.yieldGrams}g`,
      });
      cells.push({
        icon: <Hourglass size={14} color="#7B6A5C" />,
        label: "압력",
        value: `${params.pressureBar}bar`,
      });
      break;
    }
    case "french-press": {
      cells.push({
        icon: <Sun size={14} color="#7B6A5C" />,
        label: "모드",
        value: formatMethodLabel(method),
      });
      cells.push({
        icon: <Droplet size={14} color="#7B6A5C" />,
        label: "총 추출량",
        value: `${params.totalYieldGrams}g`,
      });
      cells.push({
        icon: <Hourglass size={14} color="#7B6A5C" />,
        label: "추출 시간",
        value: formatBrewingTime(params.steepTimeSec),
      });
      break;
    }
    case "aeropress": {
      cells.push({
        icon: <Sun size={14} color="#7B6A5C" />,
        label: "모드",
        value: formatMethodLabel(method),
      });
      cells.push({
        icon: <Droplet size={14} color="#7B6A5C" />,
        label: "추출량",
        value: `${params.yieldGrams}g`,
      });
      cells.push({
        icon: <Hourglass size={14} color="#7B6A5C" />,
        label: "추출 시간",
        value: formatBrewingTime(params.steepTimeSec),
      });
      break;
    }
  }

  // 3-column grid
  const rows: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 3) {
    rows.push(cells.slice(i, i + 3));
  }

  return (
    <View className="gap-2">
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} className="flex-row" style={{ gap: 8 }}>
          {row.map((cell, idx) => (
            <View
              key={idx}
              className="bg-bg-secondary flex-1"
              style={{ borderRadius: 14, padding: 12, gap: 4 }}
            >
              <View className="flex-row items-center" style={{ gap: 4 }}>
                {cell.icon}
                <Text className="text-[10px] font-pretendard text-text-tertiary">
                  {cell.label}
                </Text>
              </View>
              <Text className="text-[15px] font-pretendard-bold text-text-primary">
                {cell.value}
              </Text>
            </View>
          ))}
          {/* 마지막 행이 부족할 때 빈 셀 채워서 grid 정렬 */}
          {row.length < 3
            ? Array.from({ length: 3 - row.length }).map((_, idx) => (
                <View key={`pad-${idx}`} className="flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

function PoursSection({ recipe }: { recipe: RecipeResponse }) {
  const params = recipe.params;
  if (!params || params.method !== "pour-over") {
    return null;
  }
  const stages: PourOverParams["stages"] = params.stages;
  if (stages.length === 0) {
    return (
      <View className="gap-3">
        <Text className="text-[14px] font-pretendard-bold text-text-primary">
          푸어 단계
        </Text>
        <Text className="text-[13px] font-pretendard text-text-tertiary">
          저장된 푸어 단계가 없어요
        </Text>
      </View>
    );
  }
  return (
    <View className="gap-3">
      <Text className="text-[14px] font-pretendard-bold text-text-primary">
        푸어 단계
      </Text>
      <View className="gap-2">
        {stages.map((stage, idx) => {
          const cumulative = cumulativePourGrams(stages, idx);
          const subLabel = pourStyleShort(stage.pourStyle);
          return (
            <View
              key={`${stage.label}-${idx}`}
              className="bg-bg-secondary flex-row items-center"
              style={{
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              <View style={{ width: 54 }}>
                <Text className="text-[14px] font-pretendard-bold text-text-primary">
                  {stage.label || `단계 ${idx + 1}`}
                </Text>
                {subLabel ? (
                  <Text className="text-[9px] font-pretendard text-text-tertiary">
                    {subLabel}
                  </Text>
                ) : null}
              </View>
              <View className="flex-1" style={{ gap: 1 }}>
                <Text className="text-[13px] font-pretendard-bold text-text-primary">
                  {cumulative}g
                </Text>
                <Text className="text-[11px] font-pretendard text-text-secondary">
                  {formatTimeMmSs(stage.startSec)}
                </Text>
              </View>
              <View
                className="bg-accent-cream items-center justify-center"
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text className="text-[13px] font-pretendard-bold text-accent">
                  +{stage.pourGrams}g
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EquipmentsSection({
  equipments,
}: {
  equipments: RecipeEquipmentInfo[];
}) {
  return (
    <View className="gap-3">
      <Text className="text-[14px] font-pretendard-bold text-text-primary">
        장비
      </Text>
      {equipments.length === 0 ? (
        <Text className="text-[13px] font-pretendard text-text-tertiary">
          등록된 장비가 없어요
        </Text>
      ) : (
        <View className="gap-2">
          {equipments.map((eq) => (
            <View
              key={eq.id}
              className="bg-bg-secondary flex-row items-center"
              style={{
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                gap: 10,
              }}
            >
              <EquipmentIcon type={eq.type} />
              <Text
                className="text-[13px] font-pretendard-medium text-text-primary flex-1"
                numberOfLines={1}
              >
                {equipmentTypeLabel(eq.type)} · {eq.name}
                {eq.model ? ` · ${eq.model}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function EquipmentIcon({ type }: { type: EquipmentType }) {
  switch (type) {
    case "grinder":
      return <Wrench size={18} color="#7B6A5C" />;
    case "brewer":
      return <Coffee size={18} color="#7B6A5C" />;
    case "kettle":
      return <Waves size={18} color="#7B6A5C" />;
    case "scale":
      return <Weight size={18} color="#7B6A5C" />;
  }
}

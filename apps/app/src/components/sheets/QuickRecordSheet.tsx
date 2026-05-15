import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Coffee,
  Plus,
  Settings,
  X as XIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import { useCreateRecord } from "../../lib/queries/records";
import {
  useLastUsedRecipeId,
  useRecipes,
} from "../../lib/queries/recipes";
import {
  formatMethodLabel,
  formatRecipePlaceholder,
  formatRecipeSummary,
} from "../../lib/recipe-format";
import { showSuccess } from "../../lib/stores/alert-store";
import type {
  Bean,
  BeanCatalogItem,
  BeanType,
  RecipeResponse,
} from "../../lib/types";
import { formatDays, formatGrams } from "../../lib/format";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { RecipeChip } from "../RecipeChip";
import { PrimaryButton } from "../form/PrimaryButton";
import { BeanCatalogPickerSheet } from "./BeanCatalogPickerSheet";
import { RecipeWizardSheet } from "./RecipeWizardSheet";

// T005 — C1/C2/C3 in-place dropdown (mockup.md).
//   - chip filled (C1) / empty (C2) / dropdown 열림 (C3)
//   - chip tap → dropdown 열림. "전체 검색" → BeanCatalogPickerSheet (mode='active-only').
//   - 블렌딩 pill은 C1(필드) 또는 C3(dropdown) 아래에 항상 동일 위치.

function beanTypeLabel(type: BeanType): string {
  switch (type) {
    case "single":
      return "싱글";
    case "blend":
      return "블렌드";
    case "decaf":
      return "디카페인";
  }
}

function chipSubtext(bean: Bean): string {
  // C1 filled — 남은 양 + 일수 (mockup C1: subtext)
  const remain = formatGrams(bean.remainGrams);
  if (bean.rop.daysRemaining !== null) {
    return `${remain} · ~${formatDays(bean.rop.daysRemaining)}`;
  }
  return `${remain} 남음`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  cafeId: number;
  beans: Bean[];
}

interface BeanEntry {
  beanId: number;
  grams: string;
}

export function QuickRecordSheet({ visible, onClose, cafeId, beans }: Props) {
  const [entries, setEntries] = useState<BeanEntry[]>([]);
  const [brewedAt, setBrewedAt] = useState<Date>(new Date());
  const [timeMode, setTimeMode] = useState<"now" | "custom">("now");
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // C3 dropdown — 어떤 entry index의 dropdown이 열려있는지. null이면 모두 닫힘.
  const [dropdownFor, setDropdownFor] = useState<number | null>(null);
  // "전체 검색" → BeanCatalogPickerSheet. 어떤 entry로 결과를 박을지 기억.
  const [catalogPickerFor, setCatalogPickerFor] = useState<number | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeDropdownOpen, setRecipeDropdownOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [recipeTouched, setRecipeTouched] = useState(false);

  const router = useRouter();
  const createMutation = useCreateRecord(cafeId);
  const recipesQuery = useRecipes(cafeId);
  const lastUsedRecipeId = useLastUsedRecipeId(cafeId);

  useEffect(() => {
    if (visible) {
      const initialEntry: BeanEntry =
        beans.length === 1
          ? { beanId: beans[0].id, grams: "" }
          : { beanId: 0, grams: "" };
      setEntries([initialEntry]);
      setBrewedAt(new Date());
      setTimeMode("now");
      setShowPicker(false);
      setError(null);
      setDropdownFor(null);
      setCatalogPickerFor(null);
      setRecipeDropdownOpen(false);
      setRecipeTouched(false);
      setSelectedRecipeId(null);
    }
  }, [visible, beans]);

  // 레시피 prefill — 사용자가 직접 만지기 전에만 last-used로 채움
  useEffect(() => {
    if (!visible) return;
    if (recipeTouched) return;
    setSelectedRecipeId(lastUsedRecipeId);
  }, [visible, lastUsedRecipeId, recipeTouched]);

  function updateEntry(index: number, patch: Partial<BeanEntry>) {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addEntry() {
    const usedIds = new Set(entries.map((entry) => entry.beanId));
    const next = beans.find((bean) => !usedIds.has(bean.id));
    setEntries((prev) => [
      ...prev,
      { beanId: next?.id ?? 0, grams: "" },
    ]);
  }

  function pickCatalog(item: BeanCatalogItem) {
    // C3 "전체 검색" 결과 처리 — catalog id로 활성 CafeBean lookup.
    // mode='active-only'이므로 picker가 활성 봉지 있는 catalog만 보여주지만,
    // 방어적으로 prop `beans`에서 못 찾으면 무시.
    if (catalogPickerFor === null) return;
    const matched = beans.find((b) => b.bean.id === item.id);
    if (!matched) return;
    updateEntry(catalogPickerFor, { beanId: matched.id });
    setCatalogPickerFor(null);
  }

  function openBrewedAtPicker() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: brewedAt,
        mode: "date",
        onChange: (dateEvent, dateSelected) => {
          if (dateEvent.type !== "set" || !dateSelected) return;
          DateTimePickerAndroid.open({
            value: dateSelected,
            mode: "time",
            is24Hour: true,
            onChange: (timeEvent, timeSelected) => {
              if (timeEvent.type !== "set" || !timeSelected) return;
              const merged = new Date(dateSelected);
              merged.setHours(
                timeSelected.getHours(),
                timeSelected.getMinutes(),
                0,
                0,
              );
              setBrewedAt(merged);
            },
          });
        },
      });
    } else {
      setShowPicker(true);
    }
  }

  const isDirty =
    entries.some((entry) => entry.beanId > 0 || entry.grams.length > 0) ||
    timeMode === "custom" ||
    recipeTouched;
  const close = useDirtyClose(isDirty, onClose);

  const isLoading = createMutation.isPending;
  const canSubmit =
    entries.length > 0 &&
    entries.every((entry) => entry.beanId > 0 && Number(entry.grams) > 0) &&
    !isLoading;

  async function onSubmit() {
    setError(null);
    try {
      await createMutation.mutateAsync({
        beans: entries.map((entry) => ({
          beanId: entry.beanId,
          grams: Number(entry.grams),
        })),
        brewedAt: (timeMode === "now" ? new Date() : brewedAt).toISOString(),
        recipeId: selectedRecipeId,
      });
      showSuccess("저장 완료", "오늘의 한 잔이 기록됐어요");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "저장에 실패했어요");
    }
  }

  const isBlend = entries.length > 1;

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title="빠른 기록"
    >
      <View className="gap-4 pt-2">
        <View className="gap-2">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            원두 {isBlend ? `(${entries.length}개 블렌딩)` : ""}
          </Text>
          {entries.map((entry, index) => {
            const bean = beans.find((b) => b.id === entry.beanId);
            const hasBean = bean !== undefined;
            const dropdownOpen = dropdownFor === index;
            const usedByOthers = new Set(
              entries
                .filter((_, i) => i !== index)
                .map((e) => e.beanId),
            );
            const candidates = beans.filter(
              (b) => !usedByOthers.has(b.id),
            );
            return (
              <View key={index} className="gap-2">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      setDropdownFor(dropdownOpen ? null : index)
                    }
                    className={`flex-1 flex-row items-center active:opacity-80 ${
                      hasBean ? "bg-accent" : "bg-bg-secondary"
                    }`}
                    style={{
                      height: 60,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      gap: 12,
                    }}
                  >
                    {hasBean ? (
                      <View
                        className="bg-accent-cream items-center justify-center"
                        style={{ width: 36, height: 36, borderRadius: 10 }}
                      >
                        <Coffee size={18} color="#3A2419" strokeWidth={2} />
                      </View>
                    ) : null}
                    <View className="flex-1" style={{ gap: 2 }}>
                      <Text
                        className={`text-[15px] font-pretendard-bold ${
                          hasBean ? "text-text-on-dark" : "text-text-tertiary"
                        }`}
                        numberOfLines={1}
                      >
                        {hasBean ? bean.bean.name : "+ 원두 선택"}
                      </Text>
                      {hasBean ? (
                        <Text
                          className="text-[11px] font-pretendard"
                          style={{ color: "#D9C5B0" }}
                          numberOfLines={1}
                        >
                          {chipSubtext(bean)}
                        </Text>
                      ) : null}
                    </View>
                    {dropdownOpen ? (
                      <ChevronUp
                        size={18}
                        color={hasBean ? "#FBF9F6" : "#7B6A5C"}
                      />
                    ) : (
                      <ChevronDown
                        size={18}
                        color={hasBean ? "#FBF9F6" : "#7B6A5C"}
                      />
                    )}
                  </Pressable>
                  {entries.length > 1 ? (
                    <Pressable
                      onPress={() => {
                        if (dropdownFor === index) setDropdownFor(null);
                        removeEntry(index);
                      }}
                      className="bg-bg-secondary items-center justify-center"
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 14,
                      }}
                    >
                      <XIcon size={18} color="#7B6A5C" />
                    </Pressable>
                  ) : null}
                </View>

                {dropdownOpen ? (
                  <BeanDropdown
                    candidates={candidates}
                    currentBeanId={entry.beanId}
                    onPick={(beanId) => {
                      updateEntry(index, { beanId });
                      setDropdownFor(null);
                    }}
                    onOpenFullSearch={() => {
                      setDropdownFor(null);
                      setCatalogPickerFor(index);
                    }}
                  />
                ) : null}

                <View className="gap-2">
                  <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
                    사용량
                  </Text>
                  <View
                    className="bg-bg-secondary flex-row items-center"
                    style={{
                      height: 80,
                      borderRadius: 14,
                      paddingHorizontal: 20,
                      gap: 12,
                    }}
                  >
                    <TextInput
                      value={entry.grams}
                      onChangeText={(v) =>
                        updateEntry(index, {
                          grams: v.replace(/[^0-9.]/g, ""),
                        })
                      }
                      placeholder="0"
                      placeholderTextColor="#A89A8C"
                      keyboardType="decimal-pad"
                      style={{
                        flex: 1,
                        fontFamily: "Pretendard-Bold",
                        fontSize: 28,
                        color: "#2A1F18",
                        padding: 0,
                      }}
                    />
                    <Text className="text-[20px] font-pretendard-medium text-text-secondary">
                      g
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {entries.length < beans.length ? (
            <Pressable
              onPress={addEntry}
              className="bg-bg-secondary items-center justify-center"
              style={{
                borderRadius: 14,
                paddingVertical: 12,
              }}
            >
              <Text className="text-[13px] font-pretendard-semibold text-accent">
                + 원두 추가 (블렌딩)
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            기록 시각
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setTimeMode("now")}
              className={`flex-1 h-11 items-center justify-center rounded-lg border ${
                timeMode === "now"
                  ? "bg-accent border-accent"
                  : "bg-bg-secondary border-divider"
              }`}
            >
              <Text
                className={`text-[13px] font-pretendard-medium ${
                  timeMode === "now" ? "text-text-on-dark" : "text-text-secondary"
                }`}
              >
                지금
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTimeMode("custom");
                openBrewedAtPicker();
              }}
              className={`flex-1 h-11 items-center justify-center rounded-lg border ${
                timeMode === "custom"
                  ? "bg-accent border-accent"
                  : "bg-bg-secondary border-divider"
              }`}
            >
              <Text
                className={`text-[13px] font-pretendard-medium ${
                  timeMode === "custom"
                    ? "text-text-on-dark"
                    : "text-text-secondary"
                }`}
              >
                {timeMode === "custom"
                  ? `${brewedAt.getMonth() + 1}/${brewedAt.getDate()} ${String(brewedAt.getHours()).padStart(2, "0")}:${String(brewedAt.getMinutes()).padStart(2, "0")}`
                  : "시간 지정"}
              </Text>
            </Pressable>
          </View>
          {showPicker && Platform.OS === "ios" ? (
            <DateTimePicker
              value={brewedAt}
              mode="datetime"
              display="inline"
              onChange={(event, selected) => {
                if (event.type === "set" && selected) setBrewedAt(selected);
                else setShowPicker(false);
              }}
            />
          ) : null}
        </View>

        <View className="gap-1.5">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            레시피
          </Text>
          <RecipeChip
            recipe={
              recipesQuery.data?.find((r) => r.id === selectedRecipeId) ?? null
            }
            onTap={() => {
              const hasSelection = selectedRecipeId !== null;
              if (!hasSelection) {
                setWizardOpen(true);
              } else {
                setRecipeDropdownOpen((v) => !v);
              }
            }}
          />
          {recipeDropdownOpen ? (
            <View
              className="bg-bg-secondary"
              style={{
                borderRadius: 14,
                marginTop: 6,
                paddingVertical: 6,
              }}
            >
              {(recipesQuery.data ?? []).map((recipe) => {
                const isCurrent = recipe.id === selectedRecipeId;
                return (
                  <Pressable
                    key={recipe.id}
                    onPress={() => {
                      setSelectedRecipeId(recipe.id);
                      setRecipeTouched(true);
                      setRecipeDropdownOpen(false);
                    }}
                    className="active:opacity-80"
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      gap: 2,
                      backgroundColor: isCurrent ? "#EFE3D5" : "transparent",
                    }}
                  >
                    <Text
                      className="text-[14px] font-pretendard-semibold text-text-primary"
                      numberOfLines={1}
                    >
                      {recipe.name?.trim() || formatRecipePlaceholder(recipe)}
                    </Text>
                    <Text
                      className="text-[12px] font-pretendard text-text-secondary"
                      numberOfLines={1}
                    >
                      {formatMethodLabel(recipe.method)} ·{" "}
                      {formatRecipeSummary(recipe)}
                    </Text>
                  </Pressable>
                );
              })}

              {selectedRecipeId !== null ? (
                <Pressable
                  onPress={() => {
                    setSelectedRecipeId(null);
                    setRecipeTouched(true);
                    setRecipeDropdownOpen(false);
                  }}
                  className="active:opacity-80"
                  style={{ paddingHorizontal: 14, paddingVertical: 10 }}
                >
                  <Text className="text-[13px] font-pretendard-medium text-text-tertiary">
                    선택 해제
                  </Text>
                </Pressable>
              ) : null}

              <View
                className="bg-divider"
                style={{ height: 1, marginVertical: 4 }}
              />

              <Pressable
                onPress={() => {
                  setRecipeDropdownOpen(false);
                  setWizardOpen(true);
                }}
                className="flex-row items-center active:opacity-80"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  gap: 6,
                }}
              >
                <Plus size={14} color="#3A2419" />
                <Text className="text-[13px] font-pretendard-semibold text-accent">
                  새 레시피
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setRecipeDropdownOpen(false);
                  onClose();
                  router.push("/recipes");
                }}
                className="flex-row items-center active:opacity-80"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  gap: 6,
                }}
              >
                <Settings size={14} color="#7B6A5C" />
                <Text className="text-[13px] font-pretendard-medium text-text-secondary">
                  내 레시피 관리
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="mt-2">
          <PrimaryButton
            label={isLoading ? "저장 중..." : "기록 저장"}
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>
      </View>

      <BeanCatalogPickerSheet
        visible={catalogPickerFor !== null}
        onClose={() => setCatalogPickerFor(null)}
        onPick={pickCatalog}
        mode="active-only"
        cafeId={cafeId}
      />

      <RecipeWizardSheet
        visible={wizardOpen}
        onClose={() => setWizardOpen(false)}
        cafeId={cafeId}
        onSaved={(recipe: RecipeResponse) => {
          setSelectedRecipeId(recipe.id);
          setRecipeTouched(true);
          setWizardOpen(false);
        }}
      />

      <ConfirmDialog
        visible={close.confirming}
        title="변경사항이 사라져요"
        message="작성 중인 내용을 닫을까요?"
        confirmLabel="닫기"
        danger
        onConfirm={close.accept}
        onCancel={close.cancel}
      />
    </BottomSheet>
  );
}

// C3 — chip 바로 아래 in-place dropdown (mockup.md C3).
// 최근 활성 CafeBean 3개 (beans prop은 createdAt DESC 정렬이라 그대로 사용) +
// "전체 검색" CTA → BeanCatalogPickerSheet(mode='active-only').
function BeanDropdown({
  candidates,
  currentBeanId,
  onPick,
  onOpenFullSearch,
}: {
  candidates: Bean[];
  currentBeanId: number;
  onPick: (beanId: number) => void;
  onOpenFullSearch: () => void;
}) {
  const recent = candidates.slice(0, 3);

  return (
    <View
      className="bg-bg-secondary"
      style={{ borderRadius: 14, paddingVertical: 6 }}
    >
      <Text
        className="text-[11px] font-pretendard-medium text-text-tertiary"
        style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 4 }}
      >
        최근 사용한 원두
      </Text>

      {recent.length === 0 ? (
        <Text
          className="text-[12px] font-pretendard text-text-tertiary"
          style={{ paddingHorizontal: 14, paddingVertical: 10 }}
        >
          활성 원두가 없어요
        </Text>
      ) : (
        recent.map((bean) => {
          const isCurrent = bean.id === currentBeanId;
          return (
            <Pressable
              key={bean.id}
              onPress={() => onPick(bean.id)}
              className="flex-row items-center active:opacity-80"
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 12,
                backgroundColor: isCurrent ? "#EFE3D5" : "transparent",
              }}
            >
              <View
                className="bg-bg-primary items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: 10 }}
              >
                <Coffee size={16} color="#3A2419" strokeWidth={2} />
              </View>
              <View className="flex-1" style={{ gap: 2 }}>
                <Text
                  className="text-[14px] font-pretendard-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {bean.bean.name}
                </Text>
                <Text
                  className="text-[11px] font-pretendard text-text-secondary"
                  numberOfLines={1}
                >
                  {beanTypeLabel(bean.bean.type)} ·{" "}
                  {formatGrams(bean.remainGrams)} 남음
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      <View className="bg-divider" style={{ height: 1, marginVertical: 4 }} />

      <Pressable
        onPress={onOpenFullSearch}
        className="flex-row items-center justify-between active:opacity-80"
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text className="text-[13px] font-pretendard-semibold text-accent">
          전체 검색
        </Text>
        <ChevronRight size={14} color="#3A2419" />
      </Pressable>
    </View>
  );
}

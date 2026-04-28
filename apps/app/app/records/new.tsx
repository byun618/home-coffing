import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, X as XIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "../../src/components/BottomSheet";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { PrimaryButton } from "../../src/components/form/PrimaryButton";
import { RatingField } from "../../src/components/form/RatingField";
import { TextField } from "../../src/components/form/TextField";
import { ApiError } from "../../src/lib/api";
import { useScrollToFocused } from "../../src/lib/hooks/useScrollToFocused";
import { useBeansList } from "../../src/lib/queries/beans";
import { useCreateRecord } from "../../src/lib/queries/records";
import { showSuccess } from "../../src/lib/stores/alert-store";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import { formatGrams } from "../../src/lib/format";
import type { Bean } from "../../src/lib/types";

interface BeanEntry {
  beanId: number;
  grams: string;
}

export default function NewRecordScreen() {
  const router = useRouter();
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const beansQuery = useBeansList(activeCafeId);
  const beans = beansQuery.data ?? [];

  const [entries, setEntries] = useState<BeanEntry[]>([]);
  const [memo, setMemo] = useState("");
  const [tasteText, setTasteText] = useState("");
  const [rating, setRating] = useState(0);
  const [brewedAt, setBrewedAt] = useState<Date>(new Date());
  const [timeMode, setTimeMode] = useState<"now" | "custom">("now");
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [confirmBack, setConfirmBack] = useState(false);

  const createMutation = useCreateRecord(activeCafeId);
  const { scrollRef, onScroll, onInputFocus } = useScrollToFocused({
    margin: 16,
  });

  // 활성 원두 로딩 후 1개면 자동 선택
  useEffect(() => {
    if (beans.length > 0 && entries.length === 0) {
      setEntries([
        beans.length === 1
          ? { beanId: beans[0].id, grams: "" }
          : { beanId: 0, grams: "" },
      ]);
    } else if (beans.length === 0 && !beansQuery.isLoading) {
      // 활성 원두 없으면 안내 후 뒤로
      showToast("원두를 먼저 등록해주세요", "error");
      router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beans.length, beansQuery.isLoading]);

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
    setEntries((prev) => [...prev, { beanId: next?.id ?? 0, grams: "" }]);
  }

  const isDirty =
    entries.some((entry) => entry.beanId > 0 || entry.grams.length > 0) ||
    memo.trim().length > 0 ||
    tasteText.trim().length > 0 ||
    rating > 0 ||
    timeMode === "custom";

  function tryBack() {
    if (isDirty) setConfirmBack(true);
    else router.back();
  }

  const isLoading = createMutation.isPending;
  const canSubmit =
    activeCafeId !== null &&
    entries.length > 0 &&
    entries.every((entry) => entry.beanId > 0 && Number(entry.grams) > 0) &&
    !isLoading;

  async function onSubmit() {
    if (activeCafeId === null) return;
    setError(null);
    try {
      await createMutation.mutateAsync({
        beans: entries.map((entry) => ({
          beanId: entry.beanId,
          grams: Number(entry.grams),
        })),
        brewedAt: (timeMode === "now" ? new Date() : brewedAt).toISOString(),
        memo: memo.trim() || undefined,
        tasteNote:
          tasteText.trim() || rating > 0
            ? {
                text: tasteText.trim(),
                ...(rating > 0 ? { rating } : {}),
              }
            : undefined,
      });
      showSuccess("저장 완료", "오늘의 한 잔이 기록됐어요");
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "저장에 실패했어요");
    }
  }

  if (beansQuery.isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-bg-primary items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator color="#3A2419" />
      </SafeAreaView>
    );
  }

  const isBlend = entries.length > 1;

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{ height: 52, paddingHorizontal: 16 }}
      >
        <Pressable
          onPress={tryBack}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={22} color="#2A1F18" />
        </Pressable>
        <Text className="text-[17px] font-pretendard-semibold text-text-primary">
          빠른 기록
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5">
          {/* 원두 + 사용량 */}
          <View className="gap-2">
            <Text className="text-[13px] font-pretendard-medium text-text-secondary">
              원두 {isBlend ? `(${entries.length}개 블렌딩)` : ""}
            </Text>
            {entries.map((entry, index) => {
              const bean = beans.find((b) => b.id === entry.beanId);
              const hasBean = bean !== undefined;
              return (
                <View key={index} className="gap-2">
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => setPickerFor(index)}
                      className={`flex-1 flex-row items-center justify-between active:opacity-80 ${
                        hasBean ? "bg-accent" : "bg-bg-secondary"
                      }`}
                      style={{
                        height: 60,
                        borderRadius: 14,
                        paddingHorizontal: 16,
                      }}
                    >
                      <View className="flex-1" style={{ gap: 2 }}>
                        <Text
                          className={`text-[15px] font-pretendard-bold ${
                            hasBean
                              ? "text-text-on-dark"
                              : "text-text-tertiary"
                          }`}
                          numberOfLines={1}
                        >
                          {hasBean ? bean!.name : "원두 선택"}
                        </Text>
                        {hasBean ? (
                          <Text
                            className="text-[11px] font-pretendard"
                            style={{ color: "#D9C5B0" }}
                          >
                            {formatGrams(bean!.remainGrams)} 남음
                          </Text>
                        ) : null}
                      </View>
                      <ChevronDown
                        size={18}
                        color={hasBean ? "#FBF9F6" : "#7B6A5C"}
                      />
                    </Pressable>
                    {entries.length > 1 ? (
                      <Pressable
                        onPress={() => removeEntry(index)}
                        className="bg-bg-secondary items-center justify-center"
                        style={{ width: 60, height: 60, borderRadius: 14 }}
                      >
                        <XIcon size={18} color="#7B6A5C" />
                      </Pressable>
                    ) : null}
                  </View>
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
                        onFocus={onInputFocus}
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
                style={{ borderRadius: 14, paddingVertical: 12 }}
              >
                <Text className="text-[13px] font-pretendard-semibold text-accent">
                  + 원두 추가 (블렌딩)
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* 시간 */}
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
                    timeMode === "now"
                      ? "text-text-on-dark"
                      : "text-text-secondary"
                  }`}
                >
                  지금
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setTimeMode("custom");
                  setShowPicker(true);
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
            {showPicker ? (
              <DateTimePicker
                value={brewedAt}
                mode="datetime"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selected) => {
                  setShowPicker(Platform.OS === "ios");
                  if (event.type === "set" && selected) setBrewedAt(selected);
                }}
              />
            ) : null}
          </View>

          {/* 메모 */}
          <TextField
            label="한 줄 메모 (선택)"
            value={memo}
            onChangeText={setMemo}
            onFocus={onInputFocus}
            placeholder="오늘 향이 정말 좋았어"
            maxLength={200}
          />

          {/* 별점 */}
          <RatingField label="별점" value={rating} onChange={setRating} />

          {/* 맛 노트 */}
          <TextField
            label="맛 노트 (선택)"
            value={tasteText}
            onChangeText={setTasteText}
            onFocus={onInputFocus}
            placeholder="예) 베리, 다크초콜릿, 깊은 단맛"
            multiline
          />

          {error ? (
            <Text className="text-[13px] font-pretendard text-danger">
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* CTA */}
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 24,
          paddingBottom: 24,
          borderTopWidth: 1,
          borderTopColor: "#E8DFD2",
        }}
      >
        <PrimaryButton
          label={isLoading ? "저장 중..." : "기록 저장"}
          onPress={onSubmit}
          disabled={!canSubmit}
        />
      </View>

      {/* Bean picker (no input — sheet OK) */}
      {pickerFor !== null ? (
        <BottomSheet
          visible
          onClose={() => setPickerFor(null)}
          title="원두 선택"
        >
          <View className="gap-2 pt-2 pb-4">
            {beans
              .filter(
                (bean) =>
                  !entries.some(
                    (entry, i) =>
                      i !== pickerFor && entry.beanId === bean.id,
                  ),
              )
              .map((bean) => (
                <Pressable
                  key={bean.id}
                  onPress={() => {
                    updateEntry(pickerFor, { beanId: bean.id });
                    setPickerFor(null);
                  }}
                  className="bg-bg-secondary rounded-xl p-4 border border-divider active:opacity-80"
                >
                  <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                    {bean.name}
                  </Text>
                  <Text className="text-[12px] font-pretendard text-text-secondary mt-1">
                    {formatGrams(bean.remainGrams)} 남음 · 약{" "}
                    {bean.rop.cupsRemaining.toFixed(1)}잔
                  </Text>
                </Pressable>
              ))}
          </View>
        </BottomSheet>
      ) : null}

      <ConfirmDialog
        visible={confirmBack}
        title="변경사항이 사라져요"
        message="작성 중인 내용을 닫을까요?"
        confirmLabel="닫기"
        danger
        onConfirm={() => {
          setConfirmBack(false);
          router.back();
        }}
        onCancel={() => setConfirmBack(false)}
      />
    </SafeAreaView>
  );
}

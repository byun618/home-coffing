import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, X as XIcon } from "lucide-react-native";

import { ApiError } from "../../lib/api";
import { useCreateRecord } from "../../lib/queries/records";
import { showToast } from "../../lib/stores/toast-store";
import type { Bean } from "../../lib/types";
import { formatGrams } from "../../lib/format";
import { BottomSheet } from "../BottomSheet";
import { NumberField } from "../form/NumberField";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

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
  const [memo, setMemo] = useState("");
  const [tasteNote, setTasteNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const createMutation = useCreateRecord(cafeId);

  useEffect(() => {
    if (visible) {
      const initialEntry: BeanEntry =
        beans.length === 1
          ? { beanId: beans[0].id, grams: "" }
          : { beanId: 0, grams: "" };
      setEntries([initialEntry]);
      setMemo("");
      setTasteNote("");
      setError(null);
      setPickerFor(null);
    }
  }, [visible, beans]);

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
        brewedAt: new Date().toISOString(),
        memo: memo.trim() || undefined,
        tasteNote: tasteNote.trim()
          ? { text: tasteNote.trim() }
          : undefined,
      });
      showToast("기록 저장 완료");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "저장에 실패했어요");
    }
  }

  const isBlend = entries.length > 1;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="빠른 기록">
      <View className="gap-4 pt-2">
        <View className="gap-2">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            원두 {isBlend ? `(${entries.length}개 블렌딩)` : ""}
          </Text>
          {entries.map((entry, index) => {
            const bean = beans.find((b) => b.id === entry.beanId);
            return (
              <View key={index} className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setPickerFor(index)}
                    className="flex-1 h-12 rounded-input border border-border px-3 flex-row items-center justify-between bg-primary-subtle"
                  >
                    <Text
                      className={`text-[14px] font-pretendard ${
                        bean
                          ? "text-text-primary"
                          : "text-text-tertiary"
                      }`}
                      numberOfLines={1}
                    >
                      {bean
                        ? `${bean.name} · ${formatGrams(bean.remainGrams)} 남음`
                        : "원두 선택"}
                    </Text>
                    <ChevronDown size={16} color="#8C8C8C" />
                  </Pressable>
                  {entries.length > 1 ? (
                    <Pressable
                      onPress={() => removeEntry(index)}
                      className="w-12 h-12 items-center justify-center rounded-input border border-border"
                    >
                      <XIcon size={16} color="#8C8C8C" />
                    </Pressable>
                  ) : null}
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <NumberField
                      label="사용량"
                      value={entry.grams}
                      onChangeText={(v) => updateEntry(index, { grams: v })}
                      placeholder="예) 18"
                      unit="g"
                      decimals
                    />
                  </View>
                </View>
              </View>
            );
          })}

          {entries.length < beans.length ? (
            <Pressable
              onPress={addEntry}
              className="rounded-input border border-dashed border-primary-light bg-primary-subtle py-3 items-center"
            >
              <Text className="text-[13px] font-pretendard-medium text-primary">
                + 원두 추가 (블렌딩)
              </Text>
            </Pressable>
          ) : null}
        </View>

        <TextField
          label="한 줄 메모 (선택)"
          value={memo}
          onChangeText={setMemo}
          placeholder="오늘 향이 정말 좋았어"
          maxLength={200}
        />

        <TextField
          label="맛 노트 (선택)"
          value={tasteNote}
          onChangeText={setTasteNote}
          placeholder="예) 베리, 다크초콜릿, 깊은 단맛"
          multiline
        />

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

      {pickerFor !== null ? (
        <BeanPickerSheet
          beans={beans}
          excluded={new Set(
            entries
              .filter((_, i) => i !== pickerFor)
              .map((entry) => entry.beanId),
          )}
          onPick={(beanId) => {
            updateEntry(pickerFor, { beanId });
            setPickerFor(null);
          }}
          onClose={() => setPickerFor(null)}
        />
      ) : null}
    </BottomSheet>
  );
}

function BeanPickerSheet({
  beans,
  excluded,
  onPick,
  onClose,
}: {
  beans: Bean[];
  excluded: Set<number>;
  onPick: (beanId: number) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible onClose={onClose} title="원두 선택">
      <View className="gap-2 pt-2 pb-4">
        {beans
          .filter((bean) => !excluded.has(bean.id))
          .map((bean) => (
            <Pressable
              key={bean.id}
              onPress={() => onPick(bean.id)}
              className="bg-surface rounded-card p-4 border border-border active:opacity-80"
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
  );
}

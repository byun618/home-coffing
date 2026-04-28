import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, X as XIcon } from "lucide-react-native";

import { ApiError } from "../../lib/api";
import {
  useUpdateRecord,
  type UpdateRecordInput,
} from "../../lib/queries/records";
import { showToast } from "../../lib/stores/toast-store";
import type { Bean, Record as RecordItem } from "../../lib/types";
import { formatGrams } from "../../lib/format";
import { BottomSheet } from "../BottomSheet";
import { NumberField } from "../form/NumberField";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

interface Props {
  visible: boolean;
  onClose: () => void;
  record: RecordItem;
  beans: Bean[];
  onDelete: () => void;
}

interface BeanEntry {
  beanId: number;
  grams: string;
}

function entriesFromRecord(record: RecordItem): BeanEntry[] {
  return record.beans.map((bean) => ({
    beanId: bean.beanId,
    grams: String(bean.grams),
  }));
}

export function RecordEditSheet({
  visible,
  onClose,
  record,
  beans,
  onDelete,
}: Props) {
  const [entries, setEntries] = useState<BeanEntry[]>(() =>
    entriesFromRecord(record),
  );
  const [memo, setMemo] = useState(record.memo ?? "");
  const [tasteNote, setTasteNote] = useState(record.tasteNote?.text ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const updateMutation = useUpdateRecord(record.id);

  useEffect(() => {
    if (visible) {
      setEntries(entriesFromRecord(record));
      setMemo(record.memo ?? "");
      setTasteNote(record.tasteNote?.text ?? "");
      setError(null);
      setPickerFor(null);
    }
  }, [visible, record]);

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

  // record가 참조하는 bean 중 활성 리스트에 없는 것(예: finished)도 picker엔 표시 필요.
  const beansForPicker = (() => {
    const map = new Map<number, Pick<Bean, "id" | "name" | "remainGrams" | "rop">>();
    for (const bean of beans) {
      map.set(bean.id, bean);
    }
    for (const beanInRecord of record.beans) {
      if (!map.has(beanInRecord.beanId)) {
        map.set(beanInRecord.beanId, {
          id: beanInRecord.beanId,
          name: beanInRecord.beanName,
          remainGrams: 0,
          rop: {
            status: "paused",
            cupsRemaining: 0,
            daysRemaining: null,
            dailyGrams: 0,
            source: "fallback",
          },
        });
      }
    }
    return Array.from(map.values());
  })();

  const isLoading = updateMutation.isPending;
  const canSubmit =
    entries.length > 0 &&
    entries.every((entry) => entry.beanId > 0 && Number(entry.grams) > 0) &&
    !isLoading;

  async function onSubmit() {
    setError(null);
    const input: UpdateRecordInput = {
      beans: entries.map((entry) => ({
        beanId: entry.beanId,
        grams: Number(entry.grams),
      })),
      memo: memo.trim() || undefined,
      tasteNote: tasteNote.trim() ? { text: tasteNote.trim() } : undefined,
    };
    try {
      await updateMutation.mutateAsync(input);
      showToast("수정 완료");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
    }
  }

  const isBlend = entries.length > 1;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="기록 수정">
      <View className="gap-4 pt-2">
        <View className="gap-2">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            원두 {isBlend ? `(${entries.length}개 블렌딩)` : ""}
          </Text>
          {entries.map((entry, index) => {
            const bean = beansForPicker.find((b) => b.id === entry.beanId);
            return (
              <View key={index} className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setPickerFor(index)}
                    className="flex-1 h-12 rounded-input border border-border px-3 flex-row items-center justify-between bg-primary-subtle"
                  >
                    <Text
                      className={`text-[14px] font-pretendard ${
                        bean ? "text-text-primary" : "text-text-tertiary"
                      }`}
                      numberOfLines={1}
                    >
                      {bean ? bean.name : "원두 선택"}
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
                <NumberField
                  label="사용량"
                  value={entry.grams}
                  onChangeText={(v) => updateEntry(index, { grams: v })}
                  unit="g"
                  decimals
                />
              </View>
            );
          })}

          {entries.length < beansForPicker.length ? (
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
          label="한 줄 메모"
          value={memo}
          onChangeText={setMemo}
          placeholder="오늘 향이 정말 좋았어"
          maxLength={200}
        />

        <TextField
          label="맛 노트"
          value={tasteNote}
          onChangeText={setTasteNote}
          placeholder="예) 베리, 다크초콜릿"
          multiline
        />

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={onDelete}
            className="flex-1 h-[52px] items-center justify-center rounded-btn border border-danger active:opacity-80"
          >
            <Text className="text-[15px] font-pretendard-medium text-danger">
              삭제
            </Text>
          </Pressable>
          <View className="flex-1">
            <PrimaryButton
              label={isLoading ? "저장 중..." : "저장"}
              onPress={onSubmit}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </View>

      {pickerFor !== null ? (
        <BottomSheet
          visible
          onClose={() => setPickerFor(null)}
          title="원두 선택"
        >
          <View className="gap-2 pt-2 pb-4">
            {beansForPicker
              .filter(
                (bean) =>
                  !entries.some(
                    (entry, i) => i !== pickerFor && entry.beanId === bean.id,
                  ),
              )
              .map((bean) => (
                <Pressable
                  key={bean.id}
                  onPress={() => {
                    updateEntry(pickerFor, { beanId: bean.id });
                    setPickerFor(null);
                  }}
                  className="bg-surface rounded-card p-4 border border-border active:opacity-80"
                >
                  <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                    {bean.name}
                  </Text>
                  {bean.remainGrams > 0 ? (
                    <Text className="text-[12px] font-pretendard text-text-secondary mt-1">
                      {formatGrams(bean.remainGrams)} 남음
                    </Text>
                  ) : null}
                </Pressable>
              ))}
          </View>
        </BottomSheet>
      ) : null}
    </BottomSheet>
  );
}

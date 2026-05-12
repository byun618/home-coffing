import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { ChevronDown, X as XIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import {
  useUpdateRecord,
  type UpdateRecordInput,
} from "../../lib/queries/records";
import { showSuccess } from "../../lib/stores/alert-store";
import type { Bean, Record as RecordItem } from "../../lib/types";
import { formatGrams } from "../../lib/format";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { NumberField } from "../form/NumberField";
import { PrimaryButton } from "../form/PrimaryButton";

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

function entriesEqual(a: BeanEntry[], b: BeanEntry[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (entry, index) =>
      entry.beanId === b[index].beanId && entry.grams === b[index].grams,
  );
}

export function RecordEditSheet({
  visible,
  onClose,
  record,
  beans,
  onDelete,
}: Props) {
  const baselineEntries = entriesFromRecord(record);

  const [entries, setEntries] = useState<BeanEntry[]>(baselineEntries);
  const [brewedAt, setBrewedAt] = useState<Date>(new Date(record.brewedAt));
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<number | null>(null);

  const updateMutation = useUpdateRecord(record.id);

  useEffect(() => {
    if (visible) {
      setEntries(entriesFromRecord(record));
      setBrewedAt(new Date(record.brewedAt));
      setShowPicker(false);
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
    setEntries((prev) => [...prev, { beanId: next?.id ?? 0, grams: "" }]);
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

  // 활성 리스트에 없는 record 참조 원두도 picker에 표시
  // RecordResponse.beans는 catalog id가 아닌 CafeBean(봉지) id 참조이므로,
  // 활성 봉지 list에 없는 봉지는 record에서 받은 name을 fallback으로 사용.
  interface PickerBean {
    id: number;
    name: string;
    remainGrams: number;
  }
  const beansForPicker: PickerBean[] = (() => {
    const map = new Map<number, PickerBean>();
    for (const cafeBean of beans) {
      map.set(cafeBean.id, {
        id: cafeBean.id,
        name: cafeBean.bean.name,
        remainGrams: cafeBean.remainGrams,
      });
    }
    for (const beanInRecord of record.beans) {
      if (!map.has(beanInRecord.beanId)) {
        map.set(beanInRecord.beanId, {
          id: beanInRecord.beanId,
          name: beanInRecord.beanName,
          remainGrams: 0,
        });
      }
    }
    return Array.from(map.values());
  })();

  const isDirty =
    !entriesEqual(entries, baselineEntries) ||
    new Date(record.brewedAt).getTime() !== brewedAt.getTime();
  const close = useDirtyClose(isDirty, onClose);

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
    };
    if (new Date(record.brewedAt).getTime() !== brewedAt.getTime()) {
      input.brewedAt = brewedAt.toISOString();
    }
    try {
      await updateMutation.mutateAsync(input);
      showSuccess("수정 완료", "기록을 수정했어요");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
    }
  }

  const isBlend = entries.length > 1;

  return (
    <BottomSheet visible={visible} onClose={close.tryClose} title="기록 수정">
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
                    className="flex-1 h-12 rounded-lg border border-divider px-3 flex-row items-center justify-between bg-accent-cream"
                  >
                    <Text
                      className={`text-[14px] font-pretendard ${
                        bean ? "text-text-primary" : "text-text-tertiary"
                      }`}
                      numberOfLines={1}
                    >
                      {bean ? bean.name : "원두 선택"}
                    </Text>
                    <ChevronDown size={16} color="#7B6A5C" />
                  </Pressable>
                  {entries.length > 1 ? (
                    <Pressable
                      onPress={() => removeEntry(index)}
                      className="w-12 h-12 items-center justify-center rounded-lg border border-divider"
                    >
                      <XIcon size={16} color="#7B6A5C" />
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
              className="rounded-lg border border-dashed border-accent-light bg-accent-cream py-3 items-center"
            >
              <Text className="text-[13px] font-pretendard-medium text-accent">
                + 원두 추가 (블렌딩)
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            추출 시각
          </Text>
          <Pressable
            onPress={openBrewedAtPicker}
            className="h-12 rounded-lg border border-divider px-3 justify-center"
          >
            <Text className="text-[14px] font-pretendard text-text-primary">
              {brewedAt.getFullYear()}-
              {String(brewedAt.getMonth() + 1).padStart(2, "0")}-
              {String(brewedAt.getDate()).padStart(2, "0")}{" "}
              {String(brewedAt.getHours()).padStart(2, "0")}:
              {String(brewedAt.getMinutes()).padStart(2, "0")}
            </Text>
          </Pressable>
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

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={onDelete}
            className="flex-1 h-[52px] items-center justify-center rounded-lg border border-danger active:opacity-80"
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
                  className="bg-bg-secondary rounded-xl p-4 border border-divider active:opacity-80"
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

      <ConfirmDialog
        visible={close.confirming}
        title="변경사항이 사라져요"
        message="수정 중인 내용을 닫을까요?"
        confirmLabel="닫기"
        danger
        onConfirm={close.accept}
        onCancel={close.cancel}
      />
    </BottomSheet>
  );
}

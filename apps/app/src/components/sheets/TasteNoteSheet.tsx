import { Star, StarHalf } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import {
  useTasteNoteCreate,
  useTasteNoteDelete,
  useTasteNoteUpdate,
} from "../../lib/queries/taste-notes";
import { showSuccess } from "../../lib/stores/alert-store";
import type { TasteNoteResponse } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

type Mode =
  | { mode: "create"; recordId: number }
  | { mode: "update"; tasteNote: TasteNoteResponse };

type Props = {
  visible: boolean;
  onClose: () => void;
  cafeId: number | null;
} & Mode;

const MAX_MEMO = 200;

/**
 * S05c — 맛 노트 입력 시트 (mockup C1/C2)
 * - 별점 0.5 단위 (별 5개, 좌/우 절반 탭으로 0.5/1.0 — 같은 위치 다시 탭 시 0.5씩 토글)
 * - 별점 지우기 link (값 > 0일 때만)
 * - 메모 (선택, 200자, multiline)
 * - 저장: rating·memo 둘 다 비어있으면 disabled
 * - update 모드: 삭제 link → ConfirmDialog → DELETE
 */
export function TasteNoteSheet(props: Props) {
  const { visible, onClose, cafeId } = props;
  const isUpdate = props.mode === "update";

  const recordId =
    props.mode === "create" ? props.recordId : props.tasteNote.recordId;
  const tasteNoteId = props.mode === "update" ? props.tasteNote.id : 0;
  const initialRating =
    props.mode === "update" ? (props.tasteNote.rating ?? 0) : 0;
  const initialMemo =
    props.mode === "update" ? (props.tasteNote.memo ?? "") : "";

  const [rating, setRating] = useState<number>(initialRating);
  const [memo, setMemo] = useState<string>(initialMemo);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const createMutation = useTasteNoteCreate(recordId, cafeId);
  const updateMutation = useTasteNoteUpdate(tasteNoteId, recordId);
  const deleteMutation = useTasteNoteDelete(recordId, cafeId);

  useEffect(() => {
    if (visible) {
      setRating(initialRating);
      setMemo(initialMemo);
      setError(null);
      setConfirmingDelete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const trimmedMemo = memo.trim();
  const isDirty =
    rating !== initialRating || trimmedMemo !== initialMemo.trim();
  const close = useDirtyClose(isDirty, onClose);

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const canSubmit =
    !isLoading && (rating > 0 || trimmedMemo.length > 0);

  async function onSubmit() {
    setError(null);
    try {
      if (props.mode === "create") {
        await createMutation.mutateAsync({
          rating: rating > 0 ? rating : undefined,
          memo: trimmedMemo.length > 0 ? trimmedMemo : undefined,
        });
        showSuccess("저장 완료", "맛 노트를 추가했어요");
      } else {
        await updateMutation.mutateAsync({
          rating: rating > 0 ? rating : null,
          memo: trimmedMemo.length > 0 ? trimmedMemo : null,
        });
        showSuccess("수정 완료", "맛 노트를 수정했어요");
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "저장에 실패했어요");
    }
  }

  async function onDelete() {
    if (props.mode !== "update") return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(props.tasteNote.id);
      showSuccess("삭제 완료", "맛 노트를 삭제했어요");
      setConfirmingDelete(false);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "삭제에 실패했어요");
      setConfirmingDelete(false);
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title={isUpdate ? "맛 노트 수정" : "맛 노트 추가"}
    >
      <View className="gap-4 pt-2 pb-2">
        <View style={{ gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
              별점
              <Text className="text-text-tertiary"> · 선택</Text>
            </Text>
            {rating > 0 ? (
              <Pressable onPress={() => setRating(0)} hitSlop={8}>
                <Text className="text-[12px] font-pretendard-medium text-text-tertiary underline">
                  별점 지우기
                </Text>
              </Pressable>
            ) : null}
          </View>
          <HalfStarRating value={rating} onChange={setRating} />
        </View>

        <TextField
          label="메모 (선택)"
          value={memo}
          onChangeText={setMemo}
          placeholder="맛, 향, 다음에 시도할 점을 적어보세요"
          maxLength={MAX_MEMO}
          multiline
        />

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        {isUpdate ? (
          <Pressable
            onPress={() => setConfirmingDelete(true)}
            hitSlop={8}
            className="self-center"
          >
            <Text className="text-[13px] font-pretendard-medium text-danger">
              맛 노트 삭제
            </Text>
          </Pressable>
        ) : null}

        <View className="mt-2">
          <PrimaryButton
            label={isLoading ? "저장 중..." : "저장"}
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmingDelete}
        title="맛 노트를 삭제할까요?"
        message="삭제한 노트는 복구할 수 없어요."
        confirmLabel="삭제"
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirmingDelete(false)}
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

/**
 * 0.5 단위 별점 picker.
 * - 별 5개, 각 별의 좌 절반 탭 → slot-0.5 (half), 우 절반 탭 → slot (full)
 * - 별점 지우기는 외부 link로
 */
function HalfStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View
      className="bg-bg-secondary flex-row items-center justify-center"
      style={{ borderRadius: 14, paddingVertical: 16, gap: 6 }}
    >
      {[1, 2, 3, 4, 5].map((slot) => {
        const full = value >= slot;
        const half = !full && value >= slot - 0.5;
        return (
          <View
            key={slot}
            style={{ width: 36, height: 36, position: "relative" }}
          >
            {/* 배경 outline 별 */}
            <View
              pointerEvents="none"
              style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
            >
              <Star
                size={32}
                color="#A89A8C"
                fill="transparent"
                strokeWidth={1.5}
              />
            </View>
            {/* 채워진 상태 (full or half) */}
            {full ? (
              <View
                pointerEvents="none"
                style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
              >
                <Star size={32} color="#3A2419" fill="#3A2419" strokeWidth={1.5} />
              </View>
            ) : half ? (
              <View
                pointerEvents="none"
                style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}
              >
                <StarHalf size={32} color="#3A2419" fill="#3A2419" strokeWidth={1.5} />
              </View>
            ) : null}
            {/* 좌·우 절반 탭 영역 */}
            <View className="flex-row" style={{ width: 36, height: 36 }}>
              <Pressable
                onPress={() => onChange(slot - 0.5)}
                hitSlop={2}
                style={{ width: 18, height: 36 }}
              />
              <Pressable
                onPress={() => onChange(slot)}
                hitSlop={2}
                style={{ width: 18, height: 36 }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

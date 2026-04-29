import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import { useUpdateCafeName } from "../../lib/queries/cafe";
import { showSuccess } from "../../lib/stores/alert-store";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

interface Props {
  visible: boolean;
  onClose: () => void;
  cafeId: number | null;
  current: string;
}

export function CafeNameSheet({ visible, onClose, cafeId, current }: Props) {
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const updateName = useUpdateCafeName(cafeId);

  useEffect(() => {
    if (visible) {
      setValue(current);
      setError(null);
    }
  }, [visible, current]);

  const trimmed = value.trim();
  const isLoading = updateName.isPending;
  const isDirty = trimmed !== current.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= 80 && isDirty && !isLoading;
  const close = useDirtyClose(isDirty, onClose);

  async function onSubmit() {
    setError(null);
    try {
      await updateName.mutateAsync(trimmed);
      showSuccess("수정 완료", "홈카페 이름을 변경했어요");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title="홈카페 이름 변경"
    >
      <View className="gap-4 pt-2 pb-2">
        <TextField
          label="홈카페 이름"
          value={value}
          onChangeText={setValue}
          placeholder="우리집 카페"
          maxLength={80}
        />

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
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

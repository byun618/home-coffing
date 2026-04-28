import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import { useUpdateMe } from "../../lib/queries/me";
import { showToast } from "../../lib/stores/toast-store";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

interface Props {
  visible: boolean;
  onClose: () => void;
  current: string | null;
}

export function DisplayNameSheet({ visible, onClose, current }: Props) {
  const [value, setValue] = useState(current ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateMe = useUpdateMe();

  useEffect(() => {
    if (visible) {
      setValue(current ?? "");
      setError(null);
    }
  }, [visible, current]);

  const trimmed = value.trim();
  const isLoading = updateMe.isPending;
  const isDirty = trimmed !== (current ?? "").trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= 80 && isDirty && !isLoading;
  const close = useDirtyClose(isDirty, onClose);

  async function onSubmit() {
    setError(null);
    try {
      await updateMe.mutateAsync({ displayName: trimmed });
      showToast("수정 완료");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
    }
  }

  return (
    <BottomSheet visible={visible} onClose={close.tryClose} title="닉네임 변경">
      <View className="gap-4 pt-2 pb-2">
        <TextField
          label="닉네임"
          value={value}
          onChangeText={setValue}
          placeholder="홈카페 멤버에게 보이는 이름"
          maxLength={80}
        />
        <Text className="text-[11px] font-pretendard text-text-tertiary">
          홈카페 멤버에게 보이는 이름이에요
        </Text>

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

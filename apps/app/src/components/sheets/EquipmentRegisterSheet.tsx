import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import { useCreateEquipment } from "../../lib/queries/equipments";
import { showSuccess } from "../../lib/stores/alert-store";
import type { EquipmentResponse, EquipmentType } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: EquipmentType;
  onCreated: (equipment: EquipmentResponse) => void;
}

const TYPES: Array<{ value: EquipmentType; label: string }> = [
  { value: "grinder", label: "그라인더" },
  { value: "brewer", label: "드리퍼" },
  { value: "scale", label: "저울" },
  { value: "kettle", label: "케틀" },
];

export function EquipmentRegisterSheet({
  visible,
  onClose,
  defaultType,
  onCreated,
}: Props) {
  const [type, setType] = useState<EquipmentType>(defaultType ?? "brewer");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateEquipment();

  useEffect(() => {
    if (visible) {
      setType(defaultType ?? "brewer");
      setName("");
      setBrand("");
      setModel("");
      setError(null);
    }
  }, [visible, defaultType]);

  const isDirty =
    name.length > 0 ||
    brand.length > 0 ||
    model.length > 0 ||
    type !== (defaultType ?? "brewer");
  const close = useDirtyClose(isDirty, onClose);

  const isLoading = createMutation.isPending;
  const canSubmit = name.trim().length > 0 && !isLoading;

  async function onSubmit() {
    setError(null);
    try {
      const equipment = await createMutation.mutateAsync({
        type,
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
      });
      showSuccess("등록 완료", "장비가 추가됐어요");
      onCreated(equipment);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "등록에 실패했어요");
    }
  }

  return (
    <BottomSheet visible={visible} onClose={close.tryClose} title="새 장비 등록">
      <View className="gap-4 pt-2">
        <View className="gap-2">
          <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
            종류
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {TYPES.map((t) => {
              const selected = type === t.value;
              return (
                <Pressable
                  key={t.value}
                  onPress={() => setType(t.value)}
                  className={`items-center justify-center active:opacity-80 ${
                    selected ? "bg-accent" : "bg-bg-secondary"
                  }`}
                  style={{
                    paddingHorizontal: 16,
                    height: 40,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    className={`text-[13px] font-pretendard-medium ${
                      selected ? "text-text-on-dark" : "text-text-secondary"
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextField
          label="이름"
          value={name}
          onChangeText={setName}
          placeholder="예: V60 02"
        />
        <TextField
          label="브랜드 (선택)"
          value={brand}
          onChangeText={setBrand}
          placeholder="예: Hario"
        />
        <TextField
          label="모델 (선택)"
          value={model}
          onChangeText={setModel}
          placeholder="예: VDC-02"
        />

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="mt-2">
          <PrimaryButton
            label={isLoading ? "등록 중..." : "등록"}
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

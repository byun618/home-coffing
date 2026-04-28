import { Modal, Pressable, Text, View } from "react-native";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * S16a/b/c 패턴 — 단순 RN Modal 기반 컨펌 (자동 dismiss 없음).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center px-8"
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-bg-secondary rounded-sheet w-full p-5 gap-4"
        >
          <View className="gap-1.5">
            <Text className="text-[17px] font-pretendard-semibold text-text-primary">
              {title}
            </Text>
            {message ? (
              <Text className="text-[14px] font-pretendard text-text-secondary leading-5">
                {message}
              </Text>
            ) : null}
          </View>

          <View className="flex-row gap-2 mt-1">
            <Pressable
              onPress={onCancel}
              className="flex-1 h-12 items-center justify-center rounded-lg bg-accent-cream active:opacity-80"
            >
              <Text className="text-[15px] font-pretendard-medium text-text-primary">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 h-12 items-center justify-center rounded-lg active:opacity-80 ${
                danger ? "bg-danger" : "bg-accent"
              }`}
            >
              <Text className="text-[15px] font-pretendard-semibold text-text-on-dark">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

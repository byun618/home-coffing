import { AlertTriangle } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** danger=true → 우측 confirm 버튼 빨강, false → accent */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Variant B — Confirm Alert (component-library §1)
 * 318w · padding [28,24,20,24] · radius-2xl
 * 56x56 round icon (bg-secondary) + ⚠ in $danger
 * dual button: Cancel(bg-secondary, text-primary 15/600) + Confirm(danger or accent, text-on-dark 15/700)
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
        className="flex-1 bg-bg-overlay items-center justify-center px-6"
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-bg-primary items-center"
          style={{
            width: 318,
            borderRadius: 18,
            paddingTop: 28,
            paddingHorizontal: 24,
            paddingBottom: 20,
            gap: 16,
          }}
        >
          <View
            className="bg-bg-secondary items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
            }}
          >
            <AlertTriangle size={28} color="#B55C3E" strokeWidth={2.5} />
          </View>

          <View className="items-center" style={{ gap: 8 }}>
            <Text className="text-[17px] font-pretendard-bold text-text-primary text-center">
              {title}
            </Text>
            {message ? (
              <Text
                className="text-[13px] font-pretendard text-text-secondary text-center"
                style={{ lineHeight: 19, maxWidth: 270 }}
              >
                {message}
              </Text>
            ) : null}
          </View>

          <View className="flex-row w-full" style={{ gap: 8, marginTop: 8 }}>
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-pill bg-bg-secondary active:opacity-80"
              style={{ height: 50 }}
            >
              <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center justify-center rounded-pill active:opacity-80 ${
                danger ? "bg-danger" : "bg-accent"
              }`}
              style={{ height: 50 }}
            >
              <Text className="text-[15px] font-pretendard-bold text-text-on-dark">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

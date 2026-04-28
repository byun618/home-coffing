import { Check } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";

import { useAlertStore } from "../lib/stores/alert-store";

/**
 * Variant A — Success Alert (component-library §1)
 * - 318w 카드, padding [28,24,20,24], radius-2xl, bg-bg-primary
 * - 56x56 round icon container (#E8F0E0 success-pale), lucide check 28 in $success
 * - title 17/700 + subtitle 13 lineHeight 1.5 center
 * - 단일 [확인] 버튼 50h, $success fill, $text-on-dark 15/700
 * - 2초 자동 dismiss + 사용자 탭 즉시 dismiss (functional-spec 1.7)
 */
export function AlertSuccessDialog() {
  const current = useAlertStore((state) => state.current);
  const dismiss = useAlertStore((state) => state.dismiss);

  return (
    <Modal
      visible={current !== null}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-bg-overlay items-center justify-center px-6"
        onPress={dismiss}
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
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#E8F0E0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={28} color="#7A8B5F" strokeWidth={3} />
          </View>

          <View className="items-center" style={{ gap: 8 }}>
            <Text className="text-[17px] font-pretendard-bold text-text-primary">
              {current?.title ?? ""}
            </Text>
            {current?.subtitle ? (
              <Text
                className="text-[13px] font-pretendard text-text-secondary text-center"
                style={{ lineHeight: 19, maxWidth: 270 }}
              >
                {current.subtitle}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={dismiss}
            className="w-full items-center justify-center rounded-pill active:opacity-80"
            style={{
              height: 50,
              backgroundColor: "#7A8B5F",
              marginTop: 8,
            }}
          >
            <Text className="text-[15px] font-pretendard-bold text-text-on-dark">
              확인
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

import { X } from "lucide-react-native";
import { ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** lg=22/700 (S04 등), md=18/700 (default) */
  titleSize?: "md" | "lg";
  children: ReactNode;
  /** scroll content 자동 wrap 여부. false면 children 직접 렌더 */
  scroll?: boolean;
  /** CTA 영역 (시트 하단 고정, padding [8, 24, 0, 24]) */
  cta?: ReactNode;
}

/**
 * RN Modal 기반 바텀시트 — Expo Go 호환.
 * - 키보드 회피: 외부 KeyboardAvoidingView (iOS=padding, Android=height)
 * - 외부 영역 탭 시 키보드 닫기 + 시트 닫기
 * - 시트 내부 빈 영역 탭 시 키보드만 닫기 (시트 유지)
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  titleSize = "md",
  children,
  scroll = true,
  cta,
}: Props) {
  const titleClass =
    titleSize === "lg"
      ? "text-[22px] font-pretendard-bold text-text-primary"
      : "text-[18px] font-pretendard-bold text-text-primary";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* backdrop — tap to close (also dismisses keyboard) */}
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          className="bg-bg-overlay"
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        {/* sheet content */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="bg-bg-primary"
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "92%",
              paddingTop: 14,
              paddingBottom: cta ? 0 : 44,
            }}
          >
            {/* handle bar 36x4 */}
            <View className="items-center" style={{ paddingBottom: 4 }}>
              <View
                className="bg-bg-tertiary"
                style={{ width: 36, height: 4, borderRadius: 2 }}
              />
            </View>

            {/* head */}
            {title ? (
              <View
                className="flex-row items-center justify-between"
                style={{ paddingVertical: 4, paddingHorizontal: 24 }}
              >
                <Text className={titleClass}>{title}</Text>
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 items-center justify-center -mr-2"
                >
                  <X size={20} color="#7B6A5C" />
                </Pressable>
              </View>
            ) : null}

            {/* body */}
            {scroll ? (
              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingTop: 18,
                  paddingBottom: cta ? 16 : 16,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            ) : (
              <View
                style={{
                  paddingHorizontal: 24,
                  paddingTop: 18,
                  paddingBottom: cta ? 16 : 0,
                }}
              >
                {children}
              </View>
            )}

            {/* CTA */}
            {cta ? (
              <View
                style={{
                  paddingTop: 8,
                  paddingHorizontal: 24,
                  paddingBottom: 44,
                }}
              >
                {cta}
              </View>
            ) : null}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

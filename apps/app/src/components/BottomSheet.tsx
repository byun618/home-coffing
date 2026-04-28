import { ReactNode, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** scroll content 자동 wrap 여부. false면 children 직접 렌더 */
  scroll?: boolean;
}

/**
 * RN Modal 기반 바텀시트 — Expo Go 호환.
 * @gorhom/bottom-sheet의 gesture/snapPoints 복잡도를 피하고 단순 슬라이드만 제공.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  scroll = true,
}: Props) {
  useEffect(() => {
    // 시트 닫힘 시 키보드 자동 dismiss는 안드로이드 onRequestClose에 위임
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="bg-bg rounded-t-modal"
          style={{ maxHeight: "92%" }}
        >
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1 bg-text-tertiary rounded-full" />
          </View>

          {title ? (
            <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
              <Text className="text-[17px] font-pretendard-semibold text-text-primary">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className="w-9 h-9 items-center justify-center -mr-2"
              >
                <X size={22} color="#1A1A1A" />
              </Pressable>
            </View>
          ) : null}

          {scroll ? (
            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View className="px-5 pb-6">{children}</View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

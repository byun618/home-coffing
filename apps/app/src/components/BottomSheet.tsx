import { X } from "lucide-react-native";
import { ReactNode, useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
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
 * - iOS: KeyboardAvoidingView padding으로 시트 위로 올라옴
 * - Android: Keyboard event 수동 추적 + 시트 marginBottom 적용
 *   (Modal + statusBarTranslucent 환경에서 KeyboardAvoidingView가 동작 안 함)
 * - 시트 외부 탭 → 키보드 dismiss + 시트 닫기
 * - 시트 내부 빈 영역 탭 → 키보드만 dismiss
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const titleClass =
    titleSize === "lg"
      ? "text-[22px] font-pretendard-bold text-text-primary"
      : "text-[18px] font-pretendard-bold text-text-primary";

  const content = (
    <View
      className="bg-bg-primary"
      style={{
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "92%",
        paddingTop: 14,
        paddingBottom: cta ? 0 : 44,
        marginBottom: Platform.OS === "android" ? keyboardHeight : 0,
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

      {/* body — ScrollView가 직접 스크롤 + 드래그 시 키보드 자동 dismiss */}
      {scroll ? (
        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 18,
            paddingBottom: cta ? 16 : 16,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "ios"}
    >
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          {/* backdrop */}
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
          {content}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
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
          {content}
        </View>
      )}
    </Modal>
  );
}

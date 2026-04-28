import { X } from "lucide-react-native";
import { ReactNode } from "react";
import {
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
 * mockup 기준:
 * - bg-overlay (#1A0F08CC) backdrop
 * - sheet bg-bg-primary, radius-sheet 상단만, padding [14, 0, 44, 0]
 * - handle bar 36x4 bg-tertiary radius 2 중앙
 * - head padding [4, 24] — title md(18/700) 또는 lg(22/700) + ✕
 * - body padding [0, 24]
 * - cta area padding [8, 24, 0, 24]
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
      <View className="flex-1 justify-end bg-bg-overlay">
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                paddingBottom: cta ? 16 : 0,
              }}
              keyboardShouldPersistTaps="handled"
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

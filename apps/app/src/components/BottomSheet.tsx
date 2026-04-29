import { X } from "lucide-react-native";
import { ReactNode } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** lg=22/700, md=18/700 (default) */
  titleSize?: "md" | "lg";
  children: ReactNode;
  scroll?: boolean;
  cta?: ReactNode;
}

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
          onPress={onClose}
        />

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
          <View className="items-center" style={{ paddingBottom: 4 }}>
            <View
              className="bg-bg-tertiary"
              style={{ width: 36, height: 4, borderRadius: 2 }}
            />
          </View>

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

          {scroll ? (
            <KeyboardAwareScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingTop: 18,
                paddingBottom: cta ? 16 : 16,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bottomOffset={24}
            >
              {children}
            </KeyboardAwareScrollView>
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
      </View>
    </Modal>
  );
}

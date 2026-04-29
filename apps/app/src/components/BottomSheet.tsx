import { X } from "lucide-react-native";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
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

const SCREEN_HEIGHT = Dimensions.get("window").height;

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

  const [mounted, setMounted] = useState(visible);
  const [measured, setMeasured] = useState(false);
  const panelHeightRef = useRef(SCREEN_HEIGHT);
  const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
    if (!measured) return;

    if (visible) {
      slide.setValue(panelHeightRef.current);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: panelHeightRef.current,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, measured, slide, fade]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: fade,
          }}
        >
          <Pressable
            className="bg-bg-overlay"
            style={{ flex: 1 }}
            onPress={onClose}
          />
        </Animated.View>

        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h <= 0) return;
            panelHeightRef.current = h;
            if (!measured) {
              slide.setValue(h);
              setMeasured(true);
            }
          }}
          className="bg-bg-primary"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "92%",
            paddingTop: 14,
            paddingBottom: cta ? 0 : 44,
            transform: [{ translateY: slide }],
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
        </Animated.View>
      </View>
    </Modal>
  );
}

import { X } from "lucide-react-native";
import { ReactNode, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Keyboard,
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
 * 키보드 처리:
 * - statusBarTranslucent=true(양 플랫폼) → Modal이 fullscreen, OS resize 영향 X
 * - Keyboard 이벤트 listening + Animated translateY로 시트만 부드럽게 위로 이동
 * - 키보드 동일한 duration/easing으로 동기화
 *
 * UX:
 * - 백드롭(시트 외부) 탭 → 시트 닫기
 * - 시트 내부: ScrollView keyboardDismissMode="on-drag"로 스크롤 시 키보드 dismiss
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
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates.height;
      const duration = e.duration ?? 250;
      Animated.timing(translateY, {
        toValue: -height,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      const duration = e?.duration ?? 250;
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

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
          onPress={onClose}
        />

        {/* sheet — Animated translateY로 키보드 등장 시 부드럽게 이동 */}
        <Animated.View
          className="bg-bg-primary"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "92%",
            paddingTop: 14,
            paddingBottom: cta ? 0 : 44,
            transform: [{ translateY }],
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
        </Animated.View>
      </View>
    </Modal>
  );
}

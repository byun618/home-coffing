import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Pressable, Text, View } from "react-native";

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

const SNAP_POINTS = ["92%"];

const InSheetContext = createContext(false);
/** TextField/NumberField가 시트 안에 있는지 감지 → BottomSheetTextInput으로 분기 */
export const useInSheet = (): boolean => useContext(InSheetContext);

/**
 * @gorhom/bottom-sheet 기반 BottomSheet wrapper.
 * - keyboardBehavior="interactive" + android_keyboardInputMode="adjustResize"
 *   로 키보드 등장 시 시트가 부드럽게 위로 슬라이드
 * - keyboardBlurBehavior="restore"로 키보드 dismiss 후 원위치
 * - 시트 내부 TextField는 InSheetContext 통해 BottomSheetTextInput 사용
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
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.55}
        pressBehavior="close"
      />
    ),
    [],
  );

  const snapPoints = useMemo(() => SNAP_POINTS, []);

  const titleClass =
    titleSize === "lg"
      ? "text-[22px] font-pretendard-bold text-text-primary"
      : "text-[18px] font-pretendard-bold text-text-primary";

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "#E8DFD2",
        width: 36,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: "#FBF9F6",
      }}
      onDismiss={onClose}
    >
      <InSheetContext.Provider value={true}>
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
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 18,
              paddingBottom: cta ? 16 : 44,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView
            style={{
              paddingHorizontal: 24,
              paddingTop: 18,
              paddingBottom: cta ? 16 : 44,
            }}
          >
            {children}
          </BottomSheetView>
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
      </InSheetContext.Provider>
    </BottomSheetModal>
  );
}

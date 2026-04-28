import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  UIManager,
} from "react-native";

interface FocusLikeEvent {
  target: unknown;
}

interface Options {
  /** 포커스된 input과 키보드 사이 여유 공간(px). default 24 */
  margin?: number;
}

/**
 * 포커스된 TextInput의 화면 위치(pageY)를 측정해서 키보드에 가려지는 만큼만 정확히 스크롤.
 *
 * 사용:
 *   const { scrollRef, onScroll, onInputFocus } = useScrollToFocused();
 *   <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16}>
 *     <TextInput onFocus={onInputFocus} />
 *     <TextField onFocus={onInputFocus} />  // 내부 TextInput이 e.target에 들어옴
 *   </ScrollView>
 *
 * 동작 순서:
 * 1. 사용자 탭 → onFocus 발생 → e.target(native handle) 저장
 * 2. 키보드 등장 → keyboardDidShow → 저장된 handle을 UIManager.measureInWindow로 측정
 * 3. inputBottom + margin > keyboardTop이면 그 차이만큼 scrollTo
 */
export function useScrollToFocused(options: Options = {}) {
  const { margin = 24 } = options;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const pendingHandle = useRef<number | null>(null);

  const measureAndScroll = useCallback(
    (handle: number) => {
      const top = keyboardTop.current;
      if (top === null) return;
      UIManager.measureInWindow(handle, (_x, y, _w, height) => {
        const inputBottom = y + height;
        const overflow = inputBottom + margin - top;
        if (overflow > 0) {
          scrollRef.current?.scrollTo({
            y: scrollY.current + overflow,
            animated: true,
          });
        }
      });
    },
    [margin],
  );

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const screen = Dimensions.get("window").height;
      keyboardTop.current = screen - e.endCoordinates.height;
      if (pendingHandle.current !== null) {
        measureAndScroll(pendingHandle.current);
      }
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [measureAndScroll]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  const onInputFocus = useCallback(
    (e: FocusLikeEvent | NativeSyntheticEvent<unknown>) => {
      const handle = (e as FocusLikeEvent).target;
      if (typeof handle !== "number") return;
      pendingHandle.current = handle;
      // 키보드가 이미 떠 있으면 즉시 스크롤. 아직 안 떠 있으면 keyboardDidShow에서 처리.
      if (keyboardTop.current !== null) {
        measureAndScroll(handle);
      }
    },
    [measureAndScroll],
  );

  return { scrollRef, onScroll, onInputFocus };
}

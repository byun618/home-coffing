import { useCallback, useEffect, useRef } from "react";
import {
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
 * 포커스된 TextInput의 화면(screen) 좌표를 측정해서 키보드에 가려지는 만큼만 정확히 스크롤.
 *
 * 핵심 좌표계:
 * - keyboardTop = e.endCoordinates.screenY  (키보드 윗변, 스크린 좌표)
 * - input.pageY = UIManager.measure(...) 콜백의 pageY (스크린 좌표)
 *   ⚠ Android softInputMode=resize 환경에서 Dimensions.window가 축소돼 부정확하므로
 *     반드시 e.endCoordinates.screenY와 pageY를 함께 사용 (둘 다 스크린 좌표)
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
      UIManager.measure(handle, (_x, _y, _w, height, _pX, pageY) => {
        const inputBottom = pageY + height;
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
      keyboardTop.current = e.endCoordinates.screenY;
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
      if (keyboardTop.current !== null) {
        measureAndScroll(handle);
      }
    },
    [measureAndScroll],
  );

  return { scrollRef, onScroll, onInputFocus };
}

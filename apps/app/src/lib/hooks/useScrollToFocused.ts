import { useCallback, useEffect, useRef } from "react";
import {
  Dimensions,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  TextInput,
} from "react-native";

interface Options {
  /** 포커스된 input과 키보드 사이 여유 공간(px). default 16 */
  margin?: number;
}

/**
 * 포커스된 TextInput의 화면 위치를 측정해서, 키보드에 가려지는 만큼만 정확히 ScrollView 스크롤.
 *
 * 사용:
 *   const { scrollRef, onScroll, onInputFocus } = useScrollToFocused();
 *   <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16}>
 *     <TextInput onFocus={onInputFocus} />
 *     <SomeWrapperWithInput onFocus={onInputFocus} />
 *   </ScrollView>
 *
 * 키보드가 등장할 때 자동으로 한 번 더 시도하므로, 키보드 등장 전에 포커스해도 OK.
 */
export function useScrollToFocused(options: Options = {}) {
  const { margin = 16 } = options;
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);

  const scrollFocusedIntoView = useCallback(() => {
    const top = keyboardTop.current;
    if (top === null) return;

    // RN 내부 TextInputState API — 현재 포커스된 input 인스턴스 반환
    const input =
      (TextInput as unknown as {
        State?: {
          currentlyFocusedInput?: () => {
            measureInWindow?: (
              cb: (x: number, y: number, w: number, h: number) => void,
            ) => void;
          } | null;
        };
      }).State?.currentlyFocusedInput?.();
    if (!input || typeof input.measureInWindow !== "function") return;

    input.measureInWindow((_x, y, _w, height) => {
      const currentTop = keyboardTop.current;
      if (currentTop === null) return;
      const inputBottom = y + height;
      const overflow = inputBottom + margin - currentTop;
      if (overflow > 0) {
        scrollRef.current?.scrollTo({
          y: scrollY.current + overflow,
          animated: true,
        });
      }
    });
  }, [margin]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      const screen = Dimensions.get("window").height;
      keyboardTop.current = screen - e.endCoordinates.height;
      scrollFocusedIntoView();
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = null;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollFocusedIntoView]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  /**
   * input/wrapper의 onFocus에 직접 연결. 인자 없이 호출 가능.
   * 호출 시 RN TextInputState로 현재 포커스된 input을 자동으로 찾음 +
   * 살짝 지연을 두고(키보드 transition 대기) 스크롤 시도.
   */
  const onInputFocus = useCallback(() => {
    setTimeout(scrollFocusedIntoView, 100);
  }, [scrollFocusedIntoView]);

  return { scrollRef, onScroll, onInputFocus };
}

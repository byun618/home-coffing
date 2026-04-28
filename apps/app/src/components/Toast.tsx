import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useToastStore } from "../lib/stores/toast-store";

/**
 * 화면 상단 자동 dismiss(2s) toast.
 * Spec 1.7: 등록/저장/수정/삭제 완료 alert는 표시 후 2s + 사용자 탭 시 즉시 dismiss.
 */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 items-center"
    >
      <View pointerEvents="box-none" className="w-full px-5 pt-2 gap-2">
        {toasts.map((toast) => (
          <Pressable
            key={toast.id}
            onPress={() => dismiss(toast.id)}
            className={`rounded-card px-4 py-3 ${
              toast.tone === "success" ? "bg-primary" : "bg-danger"
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            <Text className="text-[14px] font-pretendard-medium text-surface">
              {toast.message}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

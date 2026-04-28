import { Redirect, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { setOnUnauthorized } from "../lib/api";
import { useAuthStore } from "../lib/stores/auth-store";

/**
 * 인증 상태 게이트.
 * - loading: 스피너
 * - guest가 비-public 진입 → /(public)/login redirect
 * - authenticated가 (public) 진입 → /(main) redirect (post-login)
 * - 그 외(authenticated + 디테일 화면 등)는 그대로 통과
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const segments = useSegments();
  const status = useAuthStore((state) => state.status);
  const init = useAuthStore((state) => state.init);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    init();
    setOnUnauthorized(() => {
      logout();
    });
  }, [init, logout]);

  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-bg-primary">
        <ActivityIndicator color="#3A2419" />
      </View>
    );
  }

  const top = segments[0] as string | undefined;
  const inPublic = top === "(public)";

  if (status === "guest" && !inPublic) {
    return <Redirect href="/(public)/login" />;
  }
  if (status === "authenticated" && inPublic) {
    return <Redirect href="/(main)" />;
  }
  return <>{children}</>;
}

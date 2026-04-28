import { Redirect, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

import { setOnUnauthorized } from "../lib/api";
import { useAuthStore } from "../lib/stores/auth-store";

/**
 * 모든 라우트 진입 전 인증 상태 게이트.
 * - loading: 스피너
 * - guest: (public)/login으로 redirect (단, 이미 (public) 안이면 통과)
 * - authenticated: (main)으로 redirect (단, 이미 (main) 안이면 통과)
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
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#5C3D2E" />
      </View>
    );
  }

  const top = segments[0] as string | undefined;
  const inPublic = top === "(public)";
  const inMain = top === "(main)";

  if (status === "guest" && !inPublic) {
    return <Redirect href="/(public)/login" />;
  }
  if (status === "authenticated" && !inMain) {
    return <Redirect href="/(main)" />;
  }
  return <>{children}</>;
}

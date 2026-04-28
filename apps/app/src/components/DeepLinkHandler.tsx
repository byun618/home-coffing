import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuthStore } from "../lib/stores/auth-store";

/**
 * homecoffing://invite/{code} → invite-code 화면 라우팅.
 * - 인증 상태: 즉시 push
 * - 미인증 상태: 코드 보관 → 로그인/가입 후 status가 authenticated 되는 순간 push
 */
export function DeepLinkHandler() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const pendingCode = useRef<string | null>(null);

  useEffect(() => {
    function handle(url: string | null) {
      if (!url) return;
      const parsed = Linking.parse(url);
      const segments = (parsed.path ?? "").split("/").filter(Boolean);
      if (segments[0] === "invite" && segments[1]) {
        pendingCode.current = segments[1];
        flushIfReady();
      }
    }

    function flushIfReady() {
      if (
        pendingCode.current &&
        useAuthStore.getState().status === "authenticated"
      ) {
        const code = pendingCode.current;
        pendingCode.current = null;
        router.push({
          pathname: "/(main)/invite-code",
          params: { code },
        });
      }
    }

    Linking.getInitialURL().then(handle);
    const subscription = Linking.addEventListener("url", ({ url }) =>
      handle(url),
    );

    flushIfReady();

    return () => subscription.remove();
  }, [status, router]);

  return null;
}

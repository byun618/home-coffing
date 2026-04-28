import "../global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AlertSuccessDialog } from "../src/components/AlertSuccessDialog";
import { AuthGate } from "../src/components/AuthGate";
import { DeepLinkHandler } from "../src/components/DeepLinkHandler";
import { ToastViewport } from "../src/components/Toast";
import { queryClient } from "../src/lib/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    "Pretendard-Regular": require("../assets/fonts/Pretendard-Regular.otf"),
    "Pretendard-Medium": require("../assets/fonts/Pretendard-Medium.otf"),
    "Pretendard-SemiBold": require("../assets/fonts/Pretendard-SemiBold.otf"),
    "Pretendard-Bold": require("../assets/fonts/Pretendard-Bold.otf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthGate>
            <Slot />
          </AuthGate>
          <DeepLinkHandler />
          <AlertSuccessDialog />
          <ToastViewport />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Lightbulb, Link as LinkIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "../src/components/form/PrimaryButton";
import { TextField } from "../src/components/form/TextField";
import { ApiError } from "../src/lib/api";
import { useAcceptInvitation } from "../src/lib/queries/cafe";
import { useAuthStore } from "../src/lib/stores/auth-store";
import { showToast } from "../src/lib/stores/toast-store";

export default function InviteCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const setActiveCafe = useAuthStore((state) => state.setActiveCafe);
  const acceptMutation = useAcceptInvitation();

  const [code, setCode] = useState(params.code ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.code && params.code !== code) setCode(params.code);
  }, [params.code]);

  const isLoading = acceptMutation.isPending;
  const canSubmit = code.trim().length > 0 && !isLoading;

  async function onSubmit() {
    setError(null);
    try {
      const result = await acceptMutation.mutateAsync(code.trim());
      await refreshMe();
      setActiveCafe(result.cafeId);
      showToast(`${result.cafeName}에 합류했어요`);
      router.replace("/(main)");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.body.message);
      } else {
        setError("코드 확인에 실패했어요");
      }
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Nav */}
      <View
        className="flex-row items-center"
        style={{ height: 52, paddingHorizontal: 16, gap: 10 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={22} color="#2A1F18" />
        </Pressable>
        <Text className="text-[17px] font-pretendard-semibold text-text-primary">
          초대 코드 입력
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Hero */}
        <View
          className="items-center"
          style={{
            paddingTop: 48,
            paddingHorizontal: 24,
            paddingBottom: 32,
            gap: 12,
          }}
        >
          <View
            className="bg-bg-secondary items-center justify-center"
            style={{ width: 80, height: 80, borderRadius: 40 }}
          >
            <LinkIcon size={30} color="#3A2419" strokeWidth={2} />
          </View>
          <Text className="text-[22px] font-pretendard-bold text-text-primary mt-2">
            초대 코드를 입력해요
          </Text>
          <Text className="text-[14px] font-pretendard text-text-secondary text-center">
            초대 받은 홈카페에 합류할 수 있어요
          </Text>
        </View>

        {/* Body */}
        <View style={{ paddingHorizontal: 24, gap: 20 }}>
          <TextField
            label="코드"
            value={code}
            onChangeText={(v) =>
              setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
            }
            placeholder="6자리 코드"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />

          <View
            className="flex-row items-start"
            style={{ gap: 8, paddingHorizontal: 4 }}
          >
            <Lightbulb size={14} color="#8B6F5C" />
            <Text
              className="text-[12px] font-pretendard text-text-tertiary flex-1"
              style={{ lineHeight: 18 }}
            >
              받은 링크나 코드를 그대로 입력해요
            </Text>
          </View>

          {error ? (
            <Text className="text-[13px] font-pretendard text-danger text-center">
              {error}
            </Text>
          ) : null}
        </View>

        {/* CTA */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 24,
            marginTop: "auto",
            paddingBottom: 24,
          }}
        >
          <PrimaryButton
            label={isLoading ? "확인 중..." : "홈카페 합류하기"}
            onPress={onSubmit}
            disabled={!canSubmit}
            variant="pill"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

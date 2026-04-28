import { useRouter } from "expo-router";
import { ChevronLeft, Link as LinkIcon } from "lucide-react-native";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "../../src/components/form/PrimaryButton";
import { TextField } from "../../src/components/form/TextField";
import { ApiError } from "../../src/lib/api";
import { useAcceptInvitation } from "../../src/lib/queries/cafe";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";

export default function InviteCodeScreen() {
  const router = useRouter();
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const setActiveCafe = useAuthStore((state) => state.setActiveCafe);
  const acceptMutation = useAcceptInvitation();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-[15px] font-pretendard-medium text-text-primary">
          초대 코드 입력
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-6 pt-8 gap-6">
          <View className="items-center gap-3">
            <View className="w-16 h-16 rounded-full bg-primary-subtle items-center justify-center">
              <LinkIcon size={28} color="#5C3D2E" />
            </View>
            <Text className="text-[22px] font-pretendard-bold text-text-primary">
              초대 코드를 입력해요
            </Text>
            <Text className="text-[14px] font-pretendard text-text-secondary">
              초대 받은 홈카페에 합류할 수 있어요
            </Text>
          </View>

          <View className="mt-2">
            <TextField
              label="코드"
              value={code}
              onChangeText={setCode}
              placeholder="BREW-XXXX 또는 전체 코드"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <Text className="text-[12px] font-pretendard text-text-tertiary text-center">
            💡 받은 링크나 코드를 그대로 입력해요
          </Text>

          {error ? (
            <Text className="text-[13px] font-pretendard text-danger text-center">
              {error}
            </Text>
          ) : null}

          <View className="mt-2">
            <PrimaryButton
              label={isLoading ? "확인 중..." : "홈카페 합류하기"}
              onPress={onSubmit}
              disabled={!canSubmit}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

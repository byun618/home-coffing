import { Link } from "expo-router";
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
import { useAuthStore } from "../../src/lib/stores/auth-store";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length > 0 && !loading;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.body.message);
      else setError("로그인에 실패했어요. 잠시 후 다시 시도해주세요");
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-6 pt-16 gap-6">
          <View className="gap-2">
            <Text className="text-[28px] font-pretendard-bold text-text-primary">
              다시 만나서 반가워요 ☕
            </Text>
            <Text className="text-[15px] font-pretendard text-text-secondary">
              계정으로 들어가요
            </Text>
          </View>

          <View className="gap-4 mt-4">
            <TextField
              label="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="example@home-coffing.com"
            />
            <TextField
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
              secureTextEntry
              placeholder="비밀번호"
            />
          </View>

          {error ? (
            <Text className="text-[13px] font-pretendard text-danger">
              {error}
            </Text>
          ) : null}

          <View className="gap-3 mt-2">
            <PrimaryButton
              label={loading ? "로그인 중..." : "로그인"}
              onPress={onSubmit}
              disabled={!canSubmit}
            />
            <Link href="/(public)/signup" asChild>
              <Pressable className="items-center py-3">
                <Text className="text-[14px] font-pretendard text-text-secondary">
                  계정이 없나요? <Text className="text-accent">가입</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

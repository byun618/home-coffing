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

export default function SignupScreen() {
  const signup = useAuthStore((state) => state.signup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length >= 8 && !loading;

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signup(email.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.body.message);
      else setError("가입에 실패했어요. 잠시 후 다시 시도해주세요");
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-1"
          style={{
            paddingTop: 40,
            paddingHorizontal: 24,
            paddingBottom: 24,
            gap: 32,
          }}
        >
          <View style={{ gap: 8 }}>
            <Text className="text-[28px] font-pretendard-bold text-text-primary">
              환영해요 ☕
            </Text>
            <Text className="text-[15px] font-pretendard text-text-secondary">
              계정을 만들어 시작해요
            </Text>
          </View>

          <View style={{ gap: 16 }}>
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
              label="비밀번호 (8자 이상)"
              value={password}
              onChangeText={setPassword}
              autoComplete="password-new"
              textContentType="newPassword"
              secureTextEntry
              placeholder="비밀번호"
            />
          </View>

          {error ? (
            <Text className="text-[13px] font-pretendard text-danger">
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 16, marginTop: "auto" }}>
            <PrimaryButton
              label={loading ? "가입 중..." : "가입하기"}
              onPress={onSubmit}
              disabled={!canSubmit}
              variant="pill"
            />
            <Link href="/(public)/login" asChild>
              <Pressable
                className="items-center"
                style={{ paddingVertical: 12 }}
              >
                <Text className="text-[14px] font-pretendard text-text-secondary">
                  이미 계정이 있나요?{" "}
                  <Text className="text-accent font-pretendard-semibold">
                    로그인
                  </Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

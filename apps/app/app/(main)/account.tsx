import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { MemberAvatar } from "../../src/components/MemberAvatar";
import { DisplayNameSheet } from "../../src/components/sheets/DisplayNameSheet";
import { ApiError } from "../../src/lib/api";
import { useDeleteMe } from "../../src/lib/queries/me";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showSuccess } from "../../src/lib/stores/alert-store";
import { showToast } from "../../src/lib/stores/toast-store";

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteMe = useDeleteMe();

  const [nameOpen, setNameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initial = user?.displayName?.charAt(0) ?? user?.email.charAt(0) ?? "?";
  const displayName =
    user?.displayName ?? user?.email.split("@")[0] ?? "사용자";

  async function onConfirmDelete() {
    setConfirmDelete(false);
    try {
      await deleteMe.mutateAsync();
      showSuccess("탈퇴 완료", "그동안 함께해주셔서 감사해요");
      await logout();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.body.message : "탈퇴에 실패했어요";
      showToast(message, "error");
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
          계정 설정
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile */}
        <View
          className="items-center"
          style={{ paddingTop: 20, paddingHorizontal: 24, paddingBottom: 12, gap: 16 }}
        >
          <MemberAvatar letter={initial} variant="self" size={80} />
        </View>

        {/* sec1 — 닉네임 / 이메일 */}
        <View
          style={{ paddingTop: 12, paddingHorizontal: 24, gap: 14 }}
        >
          <Pressable
            onPress={() => setNameOpen(true)}
            className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
            style={{ borderRadius: 16, padding: 18 }}
          >
            <View className="flex-1">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                닉네임
              </Text>
              <Text className="text-[16px] font-pretendard-bold text-text-primary mt-0.5">
                {displayName}
              </Text>
            </View>
            <Text className="text-[13px] font-pretendard-medium text-accent">
              수정
            </Text>
          </Pressable>

          <View
            className="bg-bg-tertiary flex-row items-center justify-between"
            style={{ borderRadius: 16, padding: 18 }}
          >
            <View className="flex-1">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                이메일
              </Text>
              <Text className="text-[15px] font-pretendard-semibold text-text-tertiary mt-0.5">
                {user?.email ?? ""}
              </Text>
            </View>
            <Lock size={16} color="#A89A8C" />
          </View>
        </View>

        {/* sec2 — 위험 영역 */}
        <View
          style={{ paddingTop: 24, paddingHorizontal: 24, gap: 8 }}
        >
          <Text className="text-[12px] font-pretendard-semibold text-danger">
            위험 영역
          </Text>
          <Pressable
            onPress={() => setConfirmDelete(true)}
            className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
            style={{ borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18 }}
          >
            <Text className="text-[15px] font-pretendard-medium text-danger">
              회원 탈퇴
            </Text>
            <ChevronRight size={18} color="#B55C3E" />
          </Pressable>
        </View>
      </ScrollView>

      <DisplayNameSheet
        visible={nameOpen}
        onClose={() => setNameOpen(false)}
        current={user?.displayName ?? null}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="회원 탈퇴할까요?"
        message="탈퇴하면 모든 홈카페 멤버십이 해제되고 다시 로그인할 수 없어요. 이 작업은 되돌릴 수 없어요."
        confirmLabel="탈퇴"
        danger
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}

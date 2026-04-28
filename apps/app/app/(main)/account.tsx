import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { DisplayNameSheet } from "../../src/components/sheets/DisplayNameSheet";
import { ApiError } from "../../src/lib/api";
import { useDeleteMe } from "../../src/lib/queries/me";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";

export default function AccountScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const deleteMe = useDeleteMe();

  const [nameOpen, setNameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function onConfirmDelete() {
    setConfirmDelete(false);
    try {
      await deleteMe.mutateAsync();
      await logout();
      showToast("탈퇴 처리됐어요");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.body.message : "탈퇴에 실패했어요";
      showToast(message, "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#2A1F18" />
        </Pressable>
        <Text className="text-[15px] font-pretendard-medium text-text-primary">
          계정 관리
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 gap-3">
          <Pressable
            onPress={() => setNameOpen(true)}
            className="bg-bg-secondary rounded-xl p-4 flex-row items-center justify-between border border-divider active:opacity-80"
          >
            <View className="flex-1">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                닉네임
              </Text>
              <Text className="text-[15px] font-pretendard-semibold text-text-primary mt-0.5">
                {user?.displayName ?? "설정 안 됨"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[12px] font-pretendard text-accent">
                수정
              </Text>
              <ChevronRight size={16} color="#A89A8C" />
            </View>
          </Pressable>

          <View className="bg-bg-secondary rounded-xl p-4 gap-1 border border-divider">
            <Text className="text-[12px] font-pretendard text-text-secondary">
              이메일
            </Text>
            <Text className="text-[15px] font-pretendard-semibold text-text-primary">
              {user?.email}
            </Text>
          </View>

          <View className="mt-6 gap-2">
            <Text className="text-[12px] font-pretendard text-danger">
              위험 영역
            </Text>
            <Pressable
              onPress={() => setConfirmDelete(true)}
              className="bg-bg-secondary rounded-xl p-4 flex-row items-center justify-between border border-danger active:opacity-80"
            >
              <Text className="text-[15px] font-pretendard-medium text-danger">
                회원 탈퇴
              </Text>
              <ChevronRight size={16} color="#B55C3E" />
            </Pressable>
          </View>
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

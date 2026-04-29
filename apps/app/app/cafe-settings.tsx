import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  UserPlus,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../src/components/ConfirmDialog";
import { CafeNameSheet } from "../src/components/sheets/CafeNameSheet";
import { InvitationSheet } from "../src/components/sheets/InvitationSheet";
import { ApiError } from "../src/lib/api";
import {
  useCafeDetail,
  useCreateInvitation,
  useLeaveCafe,
} from "../src/lib/queries/cafe";
import { showSuccess } from "../src/lib/stores/alert-store";
import { useAuthStore } from "../src/lib/stores/auth-store";
import { showToast } from "../src/lib/stores/toast-store";
import type { Invitation } from "../src/lib/types";

export default function CafeSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const setActiveCafe = useAuthStore((state) => state.setActiveCafe);
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const logout = useAuthStore((state) => state.logout);

  const cafeQuery = useCafeDetail(activeCafeId);
  const createInvitation = useCreateInvitation(activeCafeId);
  const leaveCafe = useLeaveCafe();

  const [nameOpen, setNameOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  if (cafeQuery.isLoading || !cafeQuery.data || !user) {
    return (
      <SafeAreaView
        className="flex-1 bg-bg-primary items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator color="#3A2419" />
      </SafeAreaView>
    );
  }

  const cafe = cafeQuery.data;
  const myMembership = cafe.members.find((m) => m.userId === user.id);
  const isAdmin = myMembership?.role === "admin";

  async function onCreateInvitation() {
    try {
      const inv = await createInvitation.mutateAsync();
      setInvitation(inv);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.body.message : "초대 발급에 실패했어요";
      showToast(message, "error");
    }
  }

  async function onConfirmLeave() {
    if (activeCafeId === null || !user) return;
    setConfirmLeave(false);
    try {
      await leaveCafe.mutateAsync(activeCafeId);
      showSuccess("떠남", "홈카페를 떠났어요");
      const other = user.memberships.find(
        (m) => m.cafeId !== activeCafeId,
      );
      if (other) {
        setActiveCafe(other.cafeId);
        await refreshMe();
        router.back();
      } else {
        await logout();
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.body.message : "떠나기에 실패했어요";
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
          홈카페 설정
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={cafeQuery.isFetching && !cafeQuery.isLoading}
            onRefresh={() => cafeQuery.refetch()}
          />
        }
      >
        {/* Hero */}
        <View
          className="items-center"
          style={{
            paddingTop: 20,
            paddingHorizontal: 24,
            paddingBottom: 24,
            gap: 8,
          }}
        >
          <Text
            className="text-[28px] font-pretendard-bold text-text-primary"
            numberOfLines={1}
          >
            {cafe.name}
          </Text>
          <Text className="text-[13px] font-pretendard text-text-secondary">
            {isAdmin ? "호스트" : "멤버"} · {cafe.members.length}/2명
          </Text>
        </View>

        {/* 정보 */}
        <View
          style={{ paddingTop: 12, paddingHorizontal: 24, gap: 8 }}
        >
          <Text className="text-[12px] font-pretendard-semibold text-text-tertiary">
            정보
          </Text>
          <Pressable
            onPress={isAdmin ? () => setNameOpen(true) : undefined}
            disabled={!isAdmin}
            className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
            style={{ borderRadius: 16, padding: 18 }}
          >
            <View className="flex-1">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                홈카페 이름
              </Text>
              <Text
                className="text-[16px] font-pretendard-bold text-text-primary mt-0.5"
                numberOfLines={1}
              >
                {cafe.name}
              </Text>
              {!isAdmin ? (
                <Text className="text-[11px] font-pretendard text-text-tertiary mt-1">
                  호스트만 변경할 수 있어요
                </Text>
              ) : null}
            </View>
            {isAdmin ? (
              <Text className="text-[13px] font-pretendard-medium text-accent">
                수정
              </Text>
            ) : null}
          </Pressable>
        </View>

        {/* 멤버 */}
        <View style={{ paddingTop: 24, paddingHorizontal: 24, gap: 8 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-pretendard-semibold text-text-tertiary">
              멤버 ({cafe.members.length}/2)
            </Text>
            {isAdmin ? (
              <Pressable
                onPress={onCreateInvitation}
                className="flex-row items-center gap-1 active:opacity-80"
                disabled={createInvitation.isPending}
              >
                <UserPlus size={14} color="#3A2419" />
                <Text className="text-[13px] font-pretendard-medium text-accent">
                  {createInvitation.isPending ? "발급 중..." : "초대"}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View className="gap-2">
            {cafe.members.map((member) => {
              const isMe = member.userId === user.id;
              const display =
                member.displayName ?? member.email.split("@")[0];
              return (
                <View
                  key={member.userId}
                  className="bg-bg-secondary flex-row items-center justify-between"
                  style={{ borderRadius: 16, padding: 18 }}
                >
                  <View className="flex-1">
                    <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                      {display}
                      {isMe ? " (나)" : ""}
                    </Text>
                    <Text className="text-[12px] font-pretendard text-text-tertiary mt-0.5">
                      {member.email}
                    </Text>
                  </View>
                  <Text
                    className={`text-[12px] font-pretendard-medium ${
                      member.role === "admin"
                        ? "text-accent"
                        : "text-text-secondary"
                    }`}
                  >
                    {member.role === "admin" ? "호스트" : "멤버"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 위험 영역 */}
        <View style={{ paddingTop: 24, paddingHorizontal: 24, gap: 8 }}>
          <Text className="text-[12px] font-pretendard-semibold text-danger">
            위험 영역
          </Text>
          <Pressable
            onPress={() => setConfirmLeave(true)}
            className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
            style={{ borderRadius: 16, padding: 18, gap: 8 }}
          >
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <LogOut size={16} color="#B55C3E" />
              <Text className="text-[15px] font-pretendard-medium text-danger">
                홈카페 떠나기
              </Text>
            </View>
            <ChevronRight size={18} color="#B55C3E" />
          </Pressable>
        </View>
      </ScrollView>

      <CafeNameSheet
        visible={nameOpen}
        onClose={() => setNameOpen(false)}
        cafeId={activeCafeId}
        current={cafe.name}
      />

      <InvitationSheet
        visible={invitation !== null}
        onClose={() => setInvitation(null)}
        invitation={invitation}
      />

      <ConfirmDialog
        visible={confirmLeave}
        title="홈카페를 떠날까요?"
        message="이 홈카페의 기록·원두를 더 이상 볼 수 없어요. 마지막 호스트라면 다른 멤버에게 권한을 먼저 이전해주세요."
        confirmLabel="떠나기"
        danger
        onConfirm={onConfirmLeave}
        onCancel={() => setConfirmLeave(false)}
      />
    </SafeAreaView>
  );
}

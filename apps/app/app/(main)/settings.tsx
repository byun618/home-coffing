import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Coffee,
  Link as LinkIcon,
  LogOut,
  UserCircle,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CafeSettingsSheet } from "../../src/components/sheets/CafeSettingsSheet";
import { useAuthStore } from "../../src/lib/stores/auth-store";

interface RowProps {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
}

function Row({ icon, label, hint, onPress, danger }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-card p-4 flex-row items-center gap-3 active:opacity-80 border border-border"
    >
      {icon}
      <View className="flex-1">
        <Text
          className={`text-[15px] font-pretendard-medium ${
            danger ? "text-danger" : "text-text-primary"
          }`}
        >
          {label}
        </Text>
        {hint ? (
          <Text className="text-[11px] font-pretendard text-text-tertiary mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#BBBBBB" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const [cafeSheetOpen, setCafeSheetOpen] = useState(false);

  const cafe = user?.memberships.find((m) => m.cafeId === activeCafeId);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-[24px] font-pretendard-bold text-text-primary">
          더보기
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 gap-3">
          <Row
            icon={<Coffee size={20} color="#5C3D2E" />}
            label={cafe?.cafeName ?? "홈카페"}
            hint={cafe?.role === "admin" ? "호스트" : "멤버"}
            onPress={() => setCafeSheetOpen(true)}
          />

          <Row
            icon={<UserCircle size={20} color="#5C3D2E" />}
            label="계정 관리"
            hint={user?.email}
            onPress={() => router.push("/(main)/account")}
          />

          <Row
            icon={<Bell size={20} color="#5C3D2E" />}
            label="알림"
            onPress={() => router.push("/(main)/notifications")}
          />

          <Row
            icon={<LinkIcon size={20} color="#5C3D2E" />}
            label="초대 코드 입력"
            hint="다른 홈카페에 합류"
            onPress={() => router.push("/(main)/invite-code")}
          />

          <View className="mt-2">
            <Pressable
              onPress={() => logout()}
              className="bg-surface rounded-card p-4 flex-row items-center gap-3 active:opacity-80 border border-border"
            >
              <LogOut size={20} color="#E54D2E" />
              <Text className="text-[15px] font-pretendard-medium text-danger flex-1">
                로그아웃
              </Text>
              <ChevronRight size={16} color="#BBBBBB" />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {user && activeCafeId !== null ? (
        <CafeSettingsSheet
          visible={cafeSheetOpen}
          onClose={() => setCafeSheetOpen(false)}
          cafeId={activeCafeId}
          currentUserId={user.id}
          onLeftCafe={() => {
            // 본인의 다른 카페가 있으면 첫 번째로 전환, 없으면 logout (cafe 자체 삭제)
            const other = user.memberships.find(
              (m) => m.cafeId !== activeCafeId,
            );
            if (other) {
              useAuthStore.getState().setActiveCafe(other.cafeId);
              useAuthStore.getState().refreshMe();
            } else {
              logout();
            }
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

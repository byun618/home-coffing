import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Link as LinkIcon,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MemberAvatar } from "../../src/components/MemberAvatar";
import { SettingGroup, SettingRow } from "../../src/components/SettingRow";
import { CafeSwitcherSheet } from "../../src/components/sheets/CafeSwitcherSheet";
import { useAuthStore } from "../../src/lib/stores/auth-store";

const APP_VERSION = "0.3.0";

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const [switcherOpen, setSwitcherOpen] = useState(false);

  const cafe = user?.memberships.find((m) => m.cafeId === activeCafeId);
  const memberships = user?.memberships ?? [];
  const hasMultipleCafes = memberships.length > 1;
  const initial = user?.displayName?.charAt(0) ?? user?.email.charAt(0) ?? "?";
  const displayName =
    user?.displayName ?? user?.email.split("@")[0] ?? "사용자";

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Nav */}
        <View
          className="flex-row items-center"
          style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 4 }}
        >
          <Text className="text-[18px] font-pretendard-semibold text-text-primary">
            더보기
          </Text>
        </View>

        {/* Profile */}
        <View
          className="flex-row items-center"
          style={{ gap: 16, paddingVertical: 20, paddingHorizontal: 24 }}
        >
          <MemberAvatar letter={initial} variant="self" size={56} />
          <View className="gap-1 flex-1">
            <Text
              className="text-[18px] font-pretendard-bold text-text-primary"
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="text-[13px] font-pretendard text-text-secondary"
              numberOfLines={1}
            >
              {user?.email ?? ""}
            </Text>
          </View>
        </View>

        {/* 홈카페 섹션 */}
        <View
          className="gap-2"
          style={{ paddingTop: 12, paddingHorizontal: 24 }}
        >
          <Text className="text-[12px] font-pretendard-semibold text-text-tertiary">
            홈카페
          </Text>
          <Pressable
            onPress={() => router.push("/cafe-settings")}
            className="bg-bg-secondary active:opacity-80"
            style={{ borderRadius: 16, padding: 18, gap: 14 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="gap-1 flex-1">
                <Text
                  className="text-[16px] font-pretendard-bold text-text-primary"
                  numberOfLines={1}
                >
                  {cafe?.cafeName ?? "홈카페"}
                </Text>
                <Text className="text-[13px] font-pretendard text-text-secondary">
                  {cafe?.role === "admin" ? "호스트" : "멤버"}
                </Text>
              </View>
              <SettingsIcon size={18} color="#7B6A5C" />
            </View>
            <View className="flex-row" style={{ marginLeft: -2 }}>
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: "#F5EFE7",
                }}
              >
                <MemberAvatar letter={initial} variant="self" size={32} />
              </View>
            </View>
          </Pressable>

          {hasMultipleCafes ? (
            <Pressable
              onPress={() => setSwitcherOpen(true)}
              className="flex-row items-center justify-between active:opacity-80"
              style={{ paddingVertical: 12, paddingHorizontal: 4 }}
            >
              <Text className="text-[13px] font-pretendard-medium text-text-secondary">
                다른 홈카페로 전환 ({memberships.length}개 가입)
              </Text>
              <ChevronRight size={16} color="#A89A8C" />
            </Pressable>
          ) : null}
        </View>

        {/* 설정 섹션 */}
        <View
          className="gap-2"
          style={{ paddingTop: 20, paddingHorizontal: 24 }}
        >
          <Text className="text-[12px] font-pretendard-semibold text-text-tertiary">
            설정
          </Text>
          <SettingGroup>
            <SettingRow
              icon={Bell}
              label="알림"
              onPress={() => router.push("/notifications")}
            />
            <SettingRow
              icon={UserIcon}
              label="계정 관리"
              onPress={() => router.push("/account")}
            />
            <SettingRow
              icon={LinkIcon}
              label="초대 코드 입력"
              onPress={() => router.push("/invite-code")}
            />
            <SettingRow
              icon={LogOut}
              label="로그아웃"
              onPress={() => logout()}
              danger
            />
          </SettingGroup>
        </View>

        {/* 버전 footer */}
        <View
          style={{ paddingTop: 24, paddingHorizontal: 24, alignItems: "center" }}
        >
          <Text className="text-[12px] font-pretendard text-text-tertiary">
            홈 커핑 v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>

      <CafeSwitcherSheet
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </SafeAreaView>
  );
}

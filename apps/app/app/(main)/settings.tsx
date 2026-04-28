import { ChevronRight, LogOut } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../src/lib/stores/auth-store";

export default function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const cafe = user?.memberships.find((m) => m.cafeId === activeCafeId);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-[24px] font-pretendard-bold text-text-primary">
          더보기
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="px-5 gap-3">
          {cafe ? (
            <View className="bg-surface rounded-card p-4 gap-1 border border-border">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                홈카페
              </Text>
              <Text className="text-[16px] font-pretendard-semibold text-text-primary">
                {cafe.cafeName}
              </Text>
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                {cafe.role === "admin" ? "호스트" : "멤버"}
              </Text>
            </View>
          ) : null}

          {user ? (
            <View className="bg-surface rounded-card p-4 gap-1 border border-border">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                계정
              </Text>
              <Text className="text-[16px] font-pretendard-semibold text-text-primary">
                {user.displayName ?? user.email.split("@")[0]}
              </Text>
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                {user.email}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => logout()}
            className="bg-surface rounded-card p-4 flex-row items-center justify-between active:opacity-80 border border-border"
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={18} color="#E54D2E" />
              <Text className="text-[15px] font-pretendard-medium text-danger">
                로그아웃
              </Text>
            </View>
            <ChevronRight size={18} color="#BBBBBB" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

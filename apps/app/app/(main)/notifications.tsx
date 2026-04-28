import { useRouter } from "expo-router";
import { Bell, ChevronLeft } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useNotifications } from "../../src/lib/queries/notifications";
import { formatRelative } from "../../src/lib/format";

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const items = query.data ?? [];

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
          알림
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {query.isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#3A2419" />
          </View>
        ) : items.length === 0 ? (
          <View className="px-6 py-16 items-center gap-3">
            <View className="w-16 h-16 rounded-full bg-accent-cream items-center justify-center">
              <Bell size={28} color="#3A2419" />
            </View>
            <Text className="text-[15px] font-pretendard-semibold text-text-primary">
              알림이 없어요
            </Text>
            <Text className="text-[12px] font-pretendard text-text-tertiary text-center leading-5">
              원두 잔량이 임박하면 여기서 알려드려요{"\n"}(Phase 2 구현 예정)
            </Text>
          </View>
        ) : (
          <View className="px-5 gap-2.5">
            {items.map((item) => (
              <View
                key={item.id}
                className="bg-bg-secondary rounded-xl p-4 gap-1 border border-divider"
              >
                <View className="flex-row items-baseline justify-between gap-2">
                  <Text className="text-[14px] font-pretendard-semibold text-text-primary flex-1">
                    {item.title}
                  </Text>
                  <Text className="text-[11px] font-pretendard text-text-tertiary">
                    {formatRelative(item.createdAt)}
                  </Text>
                </View>
                <Text className="text-[13px] font-pretendard text-text-secondary">
                  {item.body}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

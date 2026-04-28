import { useRouter } from "expo-router";
import { ArrowLeft, Bell } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatRelative } from "../src/lib/format";
import { useNotifications } from "../src/lib/queries/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const items = query.data ?? [];

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
          알림
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {query.isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#3A2419" />
          </View>
        ) : items.length === 0 ? (
          <View
            className="items-center"
            style={{ paddingTop: 120, paddingHorizontal: 24, gap: 20 }}
          >
            <View
              className="bg-bg-secondary items-center justify-center"
              style={{ width: 96, height: 96, borderRadius: 48 }}
            >
              <Bell size={44} color="#8B6F5C" strokeWidth={1.5} />
            </View>
            <View className="items-center" style={{ gap: 8 }}>
              <Text className="text-[20px] font-pretendard-bold text-text-primary">
                새 알림이 없어요
              </Text>
              <Text className="text-[14px] font-pretendard text-text-secondary text-center">
                원두가 떨어질 때나 멤버의 새 기록을 알려드려요
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, gap: 10 }}>
            {items.map((item) => (
              <View
                key={item.id}
                className="bg-bg-secondary"
                style={{ borderRadius: 16, padding: 16, gap: 4 }}
              >
                <View className="flex-row items-baseline justify-between" style={{ gap: 8 }}>
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

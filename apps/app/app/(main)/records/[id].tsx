import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Coffee } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRecordDetail } from "../../../src/lib/queries/records";
import { useAuthStore } from "../../../src/lib/stores/auth-store";
import { formatGrams, formatRelative } from "../../../src/lib/format";

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recordId = id ? Number(id) : null;
  const recordQuery = useRecordDetail(recordId);
  const currentUserId = useAuthStore((state) => state.user?.id);

  if (recordQuery.isLoading || !recordQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#5C3D2E" />
      </SafeAreaView>
    );
  }

  const record = recordQuery.data;
  const isMine = record.user.id === currentUserId;
  const author = record.user.displayName ?? record.user.email.split("@")[0];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 gap-4">
          <View className="gap-1">
            {record.memo ? (
              <Text className="text-[22px] font-pretendard-bold text-text-primary">
                {record.memo}
              </Text>
            ) : null}
            <Text className="text-[12px] font-pretendard text-text-secondary">
              {author}
              {!isMine ? " (다른 멤버)" : ""} · {formatRelative(record.brewedAt)}
            </Text>
          </View>

          {record.beans.length === 1 ? (
            <View className="bg-surface rounded-card p-4 flex-row items-center gap-3 border border-border">
              <Coffee size={20} color="#5C3D2E" />
              <View className="flex-1">
                <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                  {record.beans[0].beanName}
                </Text>
                <Text className="text-[12px] font-pretendard text-text-secondary mt-0.5">
                  -{formatGrams(record.beans[0].grams)}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-surface rounded-card p-4 gap-2 border border-border">
              <Text className="text-[15px] font-pretendard-semibold text-primary">
                {record.beans.map((bean) => bean.beanName).join(" + ")} · 총 {formatGrams(record.totalGrams)}
              </Text>
              <View className="gap-1 mt-1">
                {record.beans.map((bean) => (
                  <Text
                    key={bean.beanId}
                    className="text-[13px] font-pretendard text-text-secondary"
                  >
                    • {bean.beanName} · {formatGrams(bean.grams)}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {record.tasteNote?.text ? (
            <View className="bg-surface rounded-card p-4 gap-1 border border-border">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                맛 노트
              </Text>
              <Text className="text-[14px] font-pretendard text-text-primary">
                {record.tasteNote.text}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

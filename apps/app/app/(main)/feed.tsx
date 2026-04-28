import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RecordRow } from "../../src/components/RecordRow";
import { useRecordsList } from "../../src/lib/queries/records";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import type { Record } from "../../src/lib/types";

function groupByDate(records: Record[]): Array<{
  date: string;
  items: Record[];
}> {
  const groups = new Map<string, Record[]>();
  for (const record of records) {
    const date = record.brewedAt.slice(0, 10);
    const existing = groups.get(date) ?? [];
    existing.push(record);
    groups.set(date, existing);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}

function formatDateHeader(iso: string): string {
  const today = new Date();
  const target = new Date(iso);
  const isSameDay = today.toDateString() === target.toDateString();
  if (isSameDay) return "오늘";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === target.toDateString()) return "어제";
  return `${target.getMonth() + 1}월 ${target.getDate()}일`;
}

export default function FeedScreen() {
  const router = useRouter();
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, { limit: 50 });

  const groups = groupByDate(recordsQuery.data ?? []);
  const isRefreshing = recordsQuery.isFetching && !recordsQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-2 pb-4">
        <Text className="text-[24px] font-pretendard-bold text-text-primary">
          피드
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => recordsQuery.refetch()}
          />
        }
      >
        {recordsQuery.isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#5C3D2E" />
          </View>
        ) : groups.length === 0 ? (
          <View className="px-5 py-12 items-center">
            <Text className="text-[14px] font-pretendard text-text-tertiary">
              아직 기록이 없어요
            </Text>
          </View>
        ) : (
          <View className="px-5 gap-6">
            {groups.map((group) => (
              <View key={group.date} className="gap-2.5">
                <Text className="text-[13px] font-pretendard-medium text-text-secondary">
                  {formatDateHeader(group.date)}
                </Text>
                <View className="gap-2.5">
                  {group.items.map((record) => (
                    <RecordRow
                      key={record.id}
                      record={record}
                      onPress={() =>
                        router.push(`/(main)/records/${record.id}`)
                      }
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

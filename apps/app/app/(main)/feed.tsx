import { useRouter } from "expo-router";
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

import { FAB } from "../../src/components/FAB";
import { RecordCard } from "../../src/components/RecordCard";
import { BeanFormSheet } from "../../src/components/sheets/BeanFormSheet";
import { QuickRecordSheet } from "../../src/components/sheets/QuickRecordSheet";
import { useBeansList } from "../../src/lib/queries/beans";
import { useRecordsList } from "../../src/lib/queries/records";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import type { Record } from "../../src/lib/types";

type FilterMode = "all" | "self" | "wife";

function groupByDay(records: Record[]): Array<{
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

function dayHeader(iso: string): string {
  const today = new Date();
  const target = new Date(iso);
  if (today.toDateString() === target.toDateString()) return "오늘";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === target.toDateString()) return "어제";
  return `${target.getMonth() + 1}월 ${target.getDate()}일`;
}

function thisWeekTotal(records: Record[]): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return records.filter((r) => new Date(r.brewedAt) >= start).length;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-pill active:opacity-80 ${active ? "bg-accent" : "bg-bg-secondary"}`}
      style={{ paddingVertical: 8, paddingHorizontal: 16 }}
    >
      <Text
        className={`text-[13px] ${active ? "font-pretendard-semibold text-text-on-dark" : "font-pretendard-medium text-text-secondary"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, { limit: 50 });
  const beansQuery = useBeansList(activeCafeId);

  const [filter, setFilter] = useState<FilterMode>("all");
  const [recordOpen, setRecordOpen] = useState(false);
  const [addBeanOpen, setAddBeanOpen] = useState(false);

  const memberships = user?.memberships ?? [];
  const cafe = memberships.find((m) => m.cafeId === activeCafeId);
  const cafeName = cafe?.cafeName ?? "우리집";

  const allRecords = recordsQuery.data ?? [];
  const filteredRecords = allRecords.filter((record) => {
    if (filter === "all") return true;
    if (filter === "self") return record.user.id === user?.id;
    return record.user.id !== user?.id;
  });

  const groups = groupByDay(filteredRecords);
  const weekCount = thisWeekTotal(allRecords);
  const isRefreshing = recordsQuery.isFetching && !recordsQuery.isLoading;
  const hasActiveBeans = (beansQuery.data ?? []).length > 0;

  function onPressFab() {
    if (!hasActiveBeans) {
      showToast("원두를 먼저 등록해주세요", "error");
      setAddBeanOpen(true);
      return;
    }
    setRecordOpen(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => recordsQuery.refetch()}
          />
        }
      >
        {/* Nav */}
        <View
          style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 4 }}
        >
          <Text className="text-[18px] font-pretendard-semibold text-text-primary">
            피드
          </Text>
        </View>

        {/* Header */}
        <View
          className="gap-1.5"
          style={{ paddingTop: 16, paddingHorizontal: 24, paddingBottom: 20 }}
        >
          <Text className="text-[28px] font-pretendard-bold text-text-primary">
            {cafeName} 기록
          </Text>
          {weekCount > 0 ? (
            <Text className="text-[14px] font-pretendard text-text-secondary">
              이번 주 {weekCount}잔 함께 마셨어요
            </Text>
          ) : null}
        </View>

        {/* Filter */}
        <View
          className="flex-row"
          style={{ gap: 8, paddingHorizontal: 24, paddingBottom: 12 }}
        >
          <FilterChip
            label="전체"
            active={filter === "all"}
            onPress={() => setFilter("all")}
          />
          <FilterChip
            label="나"
            active={filter === "self"}
            onPress={() => setFilter("self")}
          />
          <FilterChip
            label="다른 멤버"
            active={filter === "wife"}
            onPress={() => setFilter("wife")}
          />
        </View>

        {/* List */}
        {recordsQuery.isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#3A2419" />
          </View>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            isFiltered={filter !== "all"}
            onPressCta={() => setRecordOpen(true)}
          />
        ) : (
          <View style={{ paddingHorizontal: 24 }} className="gap-3.5">
            {groups.map((group) => (
              <View key={group.date} className="gap-3">
                <Text className="text-[13px] font-pretendard-semibold text-text-tertiary mt-2">
                  {dayHeader(group.date)}
                </Text>
                <View className="gap-3.5">
                  {group.items.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      currentUserId={user?.id ?? null}
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

      <FAB onPress={onPressFab} />

      {activeCafeId !== null ? (
        <QuickRecordSheet
          visible={recordOpen}
          onClose={() => setRecordOpen(false)}
          cafeId={activeCafeId}
          beans={beansQuery.data ?? []}
        />
      ) : null}

      {activeCafeId !== null ? (
        <BeanFormSheet
          visible={addBeanOpen}
          onClose={() => setAddBeanOpen(false)}
          mode={{ kind: "create", cafeId: activeCafeId }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function EmptyState({
  isFiltered,
  onPressCta,
}: {
  isFiltered: boolean;
  onPressCta: () => void;
}) {
  return (
    <View
      className="items-center"
      style={{ gap: 20, paddingTop: 60, paddingHorizontal: 24 }}
    >
      <View
        className="bg-bg-secondary items-center justify-center"
        style={{ width: 96, height: 96, borderRadius: 48 }}
      >
        <Text className="text-[44px]">☕</Text>
      </View>
      <View className="items-center" style={{ gap: 8 }}>
        <Text className="text-[20px] font-pretendard-bold text-text-primary">
          {isFiltered
            ? "해당 멤버의 기록이 없어요"
            : "아직 기록이 없어요"}
        </Text>
        {!isFiltered ? (
          <Text className="text-[14px] font-pretendard text-text-secondary text-center">
            첫 한 잔을 기록해 홈카페 피드를 시작해보세요
          </Text>
        ) : null}
      </View>
      {!isFiltered ? (
        <Pressable
          onPress={onPressCta}
          className="bg-accent rounded-pill flex-row items-center active:opacity-80"
          style={{ gap: 8, paddingVertical: 14, paddingHorizontal: 28 }}
        >
          <Text className="text-[15px] font-pretendard-bold text-text-on-dark">
            첫 한 잔 기록하기
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

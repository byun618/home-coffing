import { useRouter } from "expo-router";
import { Bell, ChevronDown, Plus } from "lucide-react-native";
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

import { BeanCard } from "../../src/components/BeanCard";
import { FAB } from "../../src/components/FAB";
import { RecordRow } from "../../src/components/RecordRow";
import { BeanFormSheet } from "../../src/components/sheets/BeanFormSheet";
import { CafeSwitcherSheet } from "../../src/components/sheets/CafeSwitcherSheet";
import { useBeansList } from "../../src/lib/queries/beans";
import { useRecordsList } from "../../src/lib/queries/records";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const beansQuery = useBeansList(activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, { limit: 5 });

  const [addBeanOpen, setAddBeanOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const cafeName =
    user?.memberships.find((m) => m.cafeId === activeCafeId)?.cafeName ??
    "내 홈카페";
  const hasMultipleCafes = (user?.memberships.length ?? 0) > 1;

  const isRefreshing = beansQuery.isFetching && !beansQuery.isLoading;
  const hasActiveBeans = (beansQuery.data ?? []).length > 0;

  function onRefresh() {
    beansQuery.refetch();
    recordsQuery.refetch();
  }

  function onPressFab() {
    if (!hasActiveBeans) {
      showToast("원두를 먼저 등록해주세요", "error");
      setAddBeanOpen(true);
      return;
    }
    router.push("/records/new");
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header — 카페명 큰 타이틀(+ 다중카페 ⌄) + 우측 벨 */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-2">
          <Pressable
            onPress={() => hasMultipleCafes && setSwitcherOpen(true)}
            disabled={!hasMultipleCafes}
            className="flex-row items-center gap-1.5 active:opacity-80 flex-1"
          >
            <Text
              className="text-[28px] font-pretendard-bold text-text-primary"
              numberOfLines={1}
            >
              {cafeName}
            </Text>
            {hasMultipleCafes ? (
              <ChevronDown size={20} color="#7B6A5C" />
            ) : null}
          </Pressable>
          <Pressable
            onPress={() => router.push("/notifications")}
            className="w-10 h-10 items-center justify-center"
          >
            <Bell size={22} color="#2A1F18" />
          </Pressable>
        </View>

        <View className="pt-4 gap-7">
          {/* 원두 섹션 */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-6">
              <Text className="text-[18px] font-pretendard-bold text-text-primary">
                원두
              </Text>
              <Pressable
                onPress={() => setAddBeanOpen(true)}
                className="flex-row items-center gap-1.5 bg-accent rounded-pill active:opacity-80"
                style={{ paddingVertical: 8, paddingHorizontal: 14 }}
              >
                <Plus size={14} color="#FBF9F6" strokeWidth={3} />
                <Text className="text-[14px] font-pretendard-bold text-text-on-dark">
                  원두
                </Text>
              </Pressable>
            </View>

            {beansQuery.isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#3A2419" />
              </View>
            ) : !hasActiveBeans ? (
              <View className="px-6">
                <View className="bg-bg-secondary rounded-3xl p-6 items-center gap-2">
                  <Text className="text-[14px] font-pretendard text-text-secondary">
                    활성 원두가 없어요
                  </Text>
                  <Text className="text-[12px] font-pretendard text-text-tertiary">
                    새 원두를 등록해서 기록을 시작해요
                  </Text>
                  <Pressable
                    onPress={() => setAddBeanOpen(true)}
                    className="mt-2 px-4 py-2 rounded-pill bg-accent active:opacity-80"
                  >
                    <Text className="text-[13px] font-pretendard-medium text-text-on-dark">
                      첫 원두 등록하기
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  gap: 12,
                }}
              >
                {beansQuery.data?.map((bean) => (
                  <BeanCard
                    key={bean.id}
                    bean={bean}
                    onPress={() => router.push(`/beans/${bean.id}`)}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* 최근 기록 섹션 */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-6">
              <Text className="text-[18px] font-pretendard-bold text-text-primary">
                최근 기록
              </Text>
              <Pressable onPress={() => router.push("/(main)/feed")}>
                <Text className="text-[14px] font-pretendard text-text-secondary">
                  더 보기
                </Text>
              </Pressable>
            </View>

            {recordsQuery.isLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator color="#3A2419" />
              </View>
            ) : recordsQuery.data && recordsQuery.data.length === 0 ? (
              <View className="px-6">
                <View className="bg-bg-secondary rounded-xl p-6 items-center">
                  <Text className="text-[13px] font-pretendard text-text-tertiary">
                    아직 기록이 없어요
                  </Text>
                </View>
              </View>
            ) : (
              <View className="px-6 gap-4">
                {recordsQuery.data?.map((record) => (
                  <RecordRow
                    key={record.id}
                    record={record}
                    currentUserId={user?.id ?? null}
                    onPress={() => router.push(`/records/${record.id}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <FAB onPress={onPressFab} />

      {activeCafeId !== null ? (
        <BeanFormSheet
          visible={addBeanOpen}
          onClose={() => setAddBeanOpen(false)}
          mode={{ kind: "create", cafeId: activeCafeId }}
        />
      ) : null}

      <CafeSwitcherSheet
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
      />
    </SafeAreaView>
  );
}

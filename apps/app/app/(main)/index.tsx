import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
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
import { QuickRecordSheet } from "../../src/components/sheets/QuickRecordSheet";
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
  const [recordOpen, setRecordOpen] = useState(false);

  const cafeName =
    user?.memberships.find((m) => m.cafeId === activeCafeId)?.cafeName ??
    "내 홈카페";

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
    setRecordOpen(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-5 pt-2 pb-4">
          <Text className="text-[12px] font-pretendard text-text-secondary">
            {cafeName}
          </Text>
          <Text className="text-[24px] font-pretendard-bold text-text-primary mt-0.5">
            홈
          </Text>
        </View>

        <View className="px-5 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-[15px] font-pretendard-semibold text-text-primary">
              활성 원두
            </Text>
            <Pressable
              onPress={() => setAddBeanOpen(true)}
              className="flex-row items-center gap-1"
            >
              <Plus size={14} color="#5C3D2E" />
              <Text className="text-[13px] font-pretendard-medium text-primary">
                원두
              </Text>
            </Pressable>
          </View>

          {beansQuery.isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#5C3D2E" />
            </View>
          ) : !hasActiveBeans ? (
            <View className="bg-surface rounded-card p-6 items-center gap-2 border border-border">
              <Text className="text-[14px] font-pretendard text-text-secondary">
                활성 원두가 없어요
              </Text>
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                새 원두를 등록해서 기록을 시작해요
              </Text>
              <Pressable
                onPress={() => setAddBeanOpen(true)}
                className="mt-2 px-4 py-2 rounded-pill bg-primary active:opacity-80"
              >
                <Text className="text-[13px] font-pretendard-medium text-surface">
                  첫 원두 등록하기
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {beansQuery.data?.map((bean) => (
                <BeanCard
                  key={bean.id}
                  bean={bean}
                  onPress={() => router.push(`/(main)/beans/${bean.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-5 mt-8 gap-3">
          <Text className="text-[15px] font-pretendard-semibold text-text-primary">
            최근 기록
          </Text>

          {recordsQuery.isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#5C3D2E" />
            </View>
          ) : recordsQuery.data && recordsQuery.data.length === 0 ? (
            <View className="bg-surface rounded-card p-6 items-center border border-border">
              <Text className="text-[13px] font-pretendard text-text-tertiary">
                아직 기록이 없어요
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {recordsQuery.data?.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onPress={() => router.push(`/(main)/records/${record.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute right-5 bottom-6">
        <FAB onPress={onPressFab}>☕</FAB>
      </View>

      {activeCafeId !== null ? (
        <BeanFormSheet
          visible={addBeanOpen}
          onClose={() => setAddBeanOpen(false)}
          mode={{ kind: "create", cafeId: activeCafeId }}
        />
      ) : null}

      {activeCafeId !== null ? (
        <QuickRecordSheet
          visible={recordOpen}
          onClose={() => setRecordOpen(false)}
          cafeId={activeCafeId}
          beans={beansQuery.data ?? []}
        />
      ) : null}
    </SafeAreaView>
  );
}

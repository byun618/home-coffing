import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
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
import { useBeansList } from "../../src/lib/queries/beans";
import { useRecordsList } from "../../src/lib/queries/records";
import { useAuthStore } from "../../src/lib/stores/auth-store";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);

  const beansQuery = useBeansList(activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, { limit: 5 });

  const cafeName =
    user?.memberships.find((m) => m.cafeId === activeCafeId)?.cafeName ??
    "내 홈카페";

  const isRefreshing = beansQuery.isFetching && !beansQuery.isLoading;

  function onRefresh() {
    beansQuery.refetch();
    recordsQuery.refetch();
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
              onPress={() => {
                /* TODO: open S04 add bean sheet */
              }}
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
          ) : beansQuery.data && beansQuery.data.length === 0 ? (
            <View className="bg-surface rounded-card p-6 items-center gap-2 border border-border">
              <Text className="text-[14px] font-pretendard text-text-secondary">
                활성 원두가 없어요
              </Text>
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                새 원두를 등록해서 기록을 시작해요
              </Text>
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
        <FAB onPress={() => { /* TODO: open S05 quick record sheet */ }}>
          ☕
        </FAB>
      </View>
    </SafeAreaView>
  );
}

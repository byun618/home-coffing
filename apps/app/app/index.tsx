import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddBeanSheet } from "../src/components/bottomsheets/AddBeanSheet";
import { ConsumeSheet } from "../src/components/bottomsheets/ConsumeSheet";
import { BeanCard } from "../src/components/BeanCard";
import { ConsumptionRow } from "../src/components/ConsumptionRow";
import { FAB, FABGroup } from "../src/components/FAB";
import { PrimaryButton } from "../src/components/form/PrimaryButton";
import { useBeans } from "../src/lib/queries/beans";
import { useCafe } from "../src/lib/queries/cafe";
import { useConsumptions } from "../src/lib/queries/consumptions";
import { useSheetStore } from "../src/lib/stores/useSheetStore";

export default function HomeScreen() {
  const router = useRouter();
  useCafe(); // ensure cafe exists
  const { data: beans, isLoading, error } = useBeans();
  const { data: consumptions } = useConsumptions(20);
  const showSheet = useSheetStore((s) => s.show);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="px-5 pt-6">
          <Text className="text-[20px] font-pretendard-bold text-text-primary">
            홈 커핑
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-4 pb-24"
      >
        <Text className="text-[20px] font-pretendard-bold text-text-primary mb-6">
          홈 커핑
        </Text>

        {error && (
          <View className="bg-danger-subtle rounded-card p-5 mb-4">
            <Text className="font-pretendard-medium text-danger">
              API 연결 실패
            </Text>
            <Text className="font-pretendard text-[13px] text-text-secondary mt-2">
              {error.message}
            </Text>
            <Text className="font-pretendard text-[11px] text-text-tertiary mt-2">
              apps/app/.env의 EXPO_PUBLIC_API_URL을 확인하세요
            </Text>
          </View>
        )}

        {beans && beans.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-[40px] mb-3">☕</Text>
            <Text className="text-[15px] font-pretendard text-text-secondary mb-6">
              첫 원두를 등록해보세요
            </Text>
            <View className="w-full">
              <PrimaryButton
                label="원두 추가"
                onPress={() => showSheet("addBean")}
              />
            </View>
          </View>
        ) : (
          <>
            {beans?.map((bean) => (
              <BeanCard
                key={bean.id}
                bean={bean}
                onPress={() =>
                  router.push({
                    pathname: "/beans/[id]",
                    params: { id: bean.id },
                  })
                }
              />
            ))}

            {consumptions && consumptions.items.length > 0 && (
              <>
                <View className="h-px bg-border my-4" />
                <Text className="text-[15px] font-pretendard-semibold text-text-primary mb-2">
                  소비 기록
                </Text>
                {consumptions.items.map((c) => (
                  <ConsumptionRow key={c.id} item={c} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {beans && beans.length > 0 && (
        <FABGroup>
          <FAB onPress={() => showSheet("consume")}>☕</FAB>
          <FAB onPress={() => showSheet("addBean")}>+</FAB>
        </FABGroup>
      )}

      <AddBeanSheet />
      <ConsumeSheet />
    </SafeAreaView>
  );
}

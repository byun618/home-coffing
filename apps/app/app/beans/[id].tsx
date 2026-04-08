import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BeanForm, type BeanFormValues } from "../../src/components/bean/BeanForm";
import { ConsumptionRow } from "../../src/components/ConsumptionRow";
import {
  useBeans,
  useDeleteBean,
  useUpdateBean,
} from "../../src/lib/queries/beans";
import { useConsumptionsByBean } from "../../src/lib/queries/consumptions";

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const beanId = Number(id);
  const router = useRouter();
  const { data: beans } = useBeans();
  const bean = beans?.find((b) => b.id === beanId);
  const { data: consumptions } = useConsumptionsByBean(beanId);
  const updateBean = useUpdateBean(beanId);
  const deleteBean = useDeleteBean();

  if (!bean) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="px-5 pt-4">
          <Text className="font-pretendard text-text-secondary">
            불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const settingDaily = bean.cupsPerDay * bean.gramsPerCup;
  const hasRecordBased = Math.abs(bean.dailyConsumption - settingDaily) > 0.1;
  const recordCups =
    bean.gramsPerCup > 0
      ? (bean.dailyConsumption / bean.gramsPerCup).toFixed(1)
      : "0";
  const recordGrams =
    bean.cupsPerDay > 0
      ? (bean.dailyConsumption / bean.cupsPerDay).toFixed(1)
      : "0";

  const handleSave = (values: BeanFormValues) => {
    updateBean.mutate(
      {
        ...values,
        arrivedAt: values.arrivedAt ?? null,
      },
      {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert("저장 실패", err.message || "저장에 실패했어요"),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert("원두 삭제", "이 원두를 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteBean.mutate(beanId, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-row items-center flex-1">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <Text className="text-[22px] text-text-primary">←</Text>
          </Pressable>
          <Text
            className="flex-1 text-[17px] font-pretendard-semibold text-text-primary"
            numberOfLines={1}
          >
            {bean.name}
          </Text>
        </View>
        <Pressable onPress={handleDelete} className="px-2 py-2">
          <Text className="text-[13px] font-pretendard-medium text-danger">
            삭제
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-2 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[15px] font-pretendard-semibold text-text-primary mb-4">
          원두 정보
        </Text>

        <BeanForm
          initialValues={{
            name: bean.name,
            totalAmount: bean.totalAmount,
            orderedAt: bean.orderedAt,
            roastDate: bean.roastDate,
            arrivedAt: bean.arrivedAt ?? undefined,
            degassingDays: bean.degassingDays,
            cupsPerDay: bean.cupsPerDay,
            gramsPerCup: bean.gramsPerCup,
          }}
          submitLabel="저장"
          submitting={updateBean.isPending}
          onSubmit={handleSave}
        />

        {hasRecordBased && (
          <Text className="text-[11px] font-pretendard text-text-tertiary mt-3">
            소비 기록 기반: 하루 {recordCups}잔 · 한 잔에 {recordGrams}g
          </Text>
        )}

        <View className="h-px bg-border my-6" />

        <Text className="text-[15px] font-pretendard-semibold text-text-primary mb-2">
          소비 기록
        </Text>
        {!consumptions || consumptions.items.length === 0 ? (
          <Text className="font-pretendard text-text-secondary py-3">
            아직 기록이 없어요
          </Text>
        ) : (
          consumptions.items.map((c) => (
            <ConsumptionRow key={c.id} item={c} showBean={false} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

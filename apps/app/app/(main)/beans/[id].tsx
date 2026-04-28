import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "../../../src/components/ProgressBar";
import { RecordRow } from "../../../src/components/RecordRow";
import { useBeanDetail } from "../../../src/lib/queries/beans";
import { useRecordsList } from "../../../src/lib/queries/records";
import { useAuthStore } from "../../../src/lib/stores/auth-store";
import {
  formatDate,
  formatDays,
  formatGrams,
  ropLabel,
  ropTone,
} from "../../../src/lib/format";

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const beanId = id ? Number(id) : null;
  const beanQuery = useBeanDetail(beanId);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, {
    beanId: beanId ?? undefined,
    limit: 30,
  });

  if (beanQuery.isLoading || !beanQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#5C3D2E" />
      </SafeAreaView>
    );
  }

  const bean = beanQuery.data;
  const fillPct = bean.totalGrams > 0
    ? (bean.remainGrams / bean.totalGrams) * 100
    : 0;
  const tone = ropTone(bean.rop.status);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-[15px] font-pretendard-medium text-text-primary">
          원두 상세
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 gap-4">
          <View>
            <Text className="text-[24px] font-pretendard-bold text-text-primary">
              {bean.name}
            </Text>
            {bean.origin ? (
              <Text className="text-[13px] font-pretendard text-text-secondary mt-1">
                {bean.origin}
              </Text>
            ) : null}
          </View>

          <View className="bg-surface rounded-card p-5 gap-3 border border-border">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-[28px] font-pretendard-bold text-text-primary">
                {formatGrams(bean.remainGrams)}
              </Text>
              <Text className="text-[13px] font-pretendard text-text-secondary">
                / {formatGrams(bean.totalGrams)}
              </Text>
            </View>
            <ProgressBar
              value={fillPct}
              tone={tone === "danger" ? "danger" : "primary"}
            />
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-[13px] font-pretendard text-text-secondary">
                약 {bean.rop.cupsRemaining.toFixed(1)}잔 · ~{formatDays(bean.rop.daysRemaining)}
              </Text>
              <Text
                className={`text-[12px] font-pretendard-medium ${
                  tone === "danger"
                    ? "text-danger"
                    : tone === "muted"
                      ? "text-text-secondary"
                      : "text-primary"
                }`}
              >
                {ropLabel(bean.rop.status)}
              </Text>
            </View>
          </View>

          <View className="bg-surface rounded-card p-5 gap-3 border border-border">
            <Text className="text-[13px] font-pretendard-medium text-text-secondary">
              원두 정보
            </Text>
            <View className="flex-row flex-wrap gap-y-3">
              <InfoCell label="주문" value={formatDate(bean.orderedAt)} />
              <InfoCell label="로스팅" value={formatDate(bean.roastedOn)} />
              <InfoCell
                label="배송"
                value={bean.arrivedAt ? formatDate(bean.arrivedAt) : "—"}
              />
              <InfoCell label="디개싱" value={`${bean.degassingDays}일`} />
              <InfoCell label="1잔" value={`${bean.gramsPerCup}g`} />
              <InfoCell label="하루" value={`${bean.cupsPerDay}잔`} />
            </View>
          </View>

          <View className="gap-3">
            <Text className="text-[15px] font-pretendard-semibold text-text-primary">
              이 원두 기록 ({recordsQuery.data?.length ?? 0})
            </Text>
            {recordsQuery.isLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator color="#5C3D2E" />
              </View>
            ) : (recordsQuery.data ?? []).length === 0 ? (
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
                    onPress={() =>
                      router.push(`/(main)/records/${record.id}`)
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/3 gap-0.5">
      <Text className="text-[11px] font-pretendard text-text-tertiary">
        {label}
      </Text>
      <Text className="text-[14px] font-pretendard-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}

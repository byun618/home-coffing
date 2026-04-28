import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, MoreHorizontal, ShoppingCart } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "../../../src/components/ProgressBar";
import { RecordRow } from "../../../src/components/RecordRow";
import { BeanActionsSheet } from "../../../src/components/sheets/BeanActionsSheet";
import { BeanFormSheet } from "../../../src/components/sheets/BeanFormSheet";
import { useBeanDetail, useUpdateBean } from "../../../src/lib/queries/beans";
import { useRecordsList } from "../../../src/lib/queries/records";
import { useAuthStore } from "../../../src/lib/stores/auth-store";
import { showToast } from "../../../src/lib/stores/toast-store";
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
  const updateMutation = useUpdateBean(beanId);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const recordsQuery = useRecordsList(activeCafeId, {
    beanId: beanId ?? undefined,
    limit: 30,
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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
  const isUrgent = bean.rop.status === "urgent";

  function onPressOrder() {
    Linking.openURL(
      `mailto:?subject=${encodeURIComponent("다음 원두 주문")}&body=${encodeURIComponent(
        `다음 원두 주문 메모\n\n현재 원두: ${bean.name}\n잔량: ${bean.remainGrams}g`,
      )}`,
    );
  }

  async function applyAction(input: {
    finishedAt?: string;
    finishedReason?: "consumed" | "discarded";
    archivedAt?: string;
  }, successMessage: string) {
    try {
      await updateMutation.mutateAsync(input);
      showToast(successMessage);
      setActionsOpen(false);
      router.back();
    } catch {
      showToast("처리에 실패했어요", "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        <Text className="text-[15px] font-pretendard-medium text-text-primary">
          원두 상세
        </Text>
        <Pressable
          onPress={() => setActionsOpen(true)}
          className="w-10 h-10 items-center justify-center"
        >
          <MoreHorizontal size={22} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: isUrgent ? 96 : 40 }}>
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

          <View
            className={`rounded-card p-5 gap-3 ${
              isUrgent
                ? "bg-danger-subtle border border-danger"
                : "bg-surface border border-border"
            }`}
            style={isUrgent ? { borderWidth: 1.5 } : undefined}
          >
            <View className="flex-row items-baseline justify-between">
              <Text
                className={`text-[28px] font-pretendard-bold ${
                  isUrgent ? "text-danger" : "text-text-primary"
                }`}
              >
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
              <Text
                className={`text-[13px] font-pretendard ${
                  isUrgent ? "text-danger" : "text-text-secondary"
                }`}
              >
                {isUrgent ? "⚠ " : ""}약 {bean.rop.cupsRemaining.toFixed(1)}잔 · ~{formatDays(bean.rop.daysRemaining)}
                {isUrgent ? " · 곧 떨어져요!" : ""}
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

      <BeanActionsSheet
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        bean={bean}
        onEdit={() => {
          setActionsOpen(false);
          setEditOpen(true);
        }}
        onMarkConsumed={() =>
          applyAction(
            {
              finishedAt: new Date().toISOString(),
              finishedReason: "consumed",
            },
            "처리 완료",
          )
        }
        onMarkDiscarded={() =>
          applyAction(
            {
              finishedAt: new Date().toISOString(),
              finishedReason: "discarded",
            },
            "처리 완료",
          )
        }
        onArchive={() =>
          applyAction(
            { archivedAt: new Date().toISOString() },
            "보관함으로 이동",
          )
        }
      />

      <BeanFormSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        mode={{ kind: "edit", bean }}
      />

      {isUrgent ? (
        <View
          className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-3 bg-bg border-t border-border"
        >
          <Pressable
            onPress={onPressOrder}
            className="h-[52px] rounded-btn bg-danger flex-row items-center justify-center gap-2 active:opacity-80"
          >
            <ShoppingCart size={18} color="#FFFFFF" />
            <Text className="text-[15px] font-pretendard-semibold text-surface">
              다음 원두 주문하기
            </Text>
          </Pressable>
        </View>
      ) : null}
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

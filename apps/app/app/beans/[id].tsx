import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  MoreVertical,
  ShoppingCart,
} from "lucide-react-native";
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

import { MemberAvatar } from "../../src/components/MemberAvatar";
import { BeanActionsSheet } from "../../src/components/sheets/BeanActionsSheet";
import { BeanFormSheet } from "../../src/components/sheets/BeanFormSheet";
import {
  formatDate,
  formatDays,
  formatGrams,
  ropLabel,
} from "../../src/lib/format";
import { useBeanDetail, useUpdateBean } from "../../src/lib/queries/beans";
import { useRecordsList } from "../../src/lib/queries/records";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import type { Record } from "../../src/lib/types";

interface RecordRowProps {
  record: Record;
  currentUserId?: number | null;
  onPress: () => void;
}

/** S03 small record row — 28 avatar + 인라인 한 줄 + › */
function MiniRecordRow({ record, currentUserId, onPress }: RecordRowProps) {
  const isMe = currentUserId !== undefined && record.user.id === currentUserId;
  const variant: "self" | "wife" = isMe ? "self" : "wife";
  const initial =
    record.user.displayName?.charAt(0) ?? record.user.email.charAt(0);
  const time = new Date(record.brewedAt);
  const timeLabel = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

  return (
    <Pressable
      onPress={onPress}
      className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
      style={{
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        gap: 10,
      }}
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <MemberAvatar letter={initial} variant={variant} size={28} />
        <Text className="text-[13px] font-pretendard text-text-primary">
          {formatGrams(record.totalGrams)} · {timeLabel}
        </Text>
      </View>
      <Text className="text-[18px] font-pretendard text-text-tertiary">›</Text>
    </Pressable>
  );
}

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

function dayLabel(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const beanId = id ? Number(id) : null;
  const beanQuery = useBeanDetail(beanId);
  const updateMutation = useUpdateBean(beanId);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const recordsQuery = useRecordsList(activeCafeId, {
    beanId: beanId ?? undefined,
    limit: 30,
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (beanQuery.isLoading || !beanQuery.data) {
    return (
      <SafeAreaView
        className="flex-1 bg-bg-primary items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator color="#3A2419" />
      </SafeAreaView>
    );
  }

  const bean = beanQuery.data;
  const fillPct =
    bean.totalGrams > 0
      ? Math.max(
          0,
          Math.min(100, (bean.remainGrams / bean.totalGrams) * 100),
        )
      : 0;
  const isUrgent = bean.rop.status === "urgent";

  const numberColor = isUrgent ? "#B55C3E" : "#2A1F18";
  const cardBg = isUrgent ? "#F5EFE7" : "#F5EFE7";
  const cardBorder = isUrgent ? "#B55C3E" : "transparent";

  function onPressOrder() {
    Linking.openURL(
      `mailto:?subject=${encodeURIComponent("다음 원두 주문")}&body=${encodeURIComponent(
        `다음 원두 주문 메모\n\n현재 원두: ${bean.name}\n잔량: ${bean.remainGrams}g`,
      )}`,
    );
  }

  async function applyAction(
    input: {
      finishedAt?: string;
      finishedReason?: "consumed" | "discarded";
      archivedAt?: string;
    },
    successMessage: string,
  ) {
    try {
      await updateMutation.mutateAsync(input);
      showToast(successMessage);
      setActionsOpen(false);
      router.back();
    } catch {
      showToast("처리에 실패했어요", "error");
    }
  }

  const recordGroups = groupByDate(recordsQuery.data ?? []);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between"
        style={{ paddingVertical: 12, paddingHorizontal: 24, gap: 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={22} color="#2A1F18" />
        </Pressable>
        <Text className="text-[17px] font-pretendard-semibold text-text-primary flex-1 text-center">
          원두 상세
        </Text>
        <Pressable
          onPress={() => setActionsOpen(true)}
          className="w-10 h-10 items-center justify-center -mr-2"
        >
          <MoreVertical size={20} color="#7B6A5C" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: isUrgent ? 110 : 32,
          paddingHorizontal: 24,
          gap: 24,
        }}
      >
        {/* bean name */}
        <View>
          <Text
            className="text-[24px] font-pretendard-bold text-text-primary"
            numberOfLines={2}
          >
            {bean.name}
          </Text>
          {bean.origin ? (
            <Text className="text-[13px] font-pretendard text-text-secondary mt-1">
              {bean.origin}
            </Text>
          ) : null}
        </View>

        {/* amount card */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 20,
            paddingVertical: 24,
            paddingHorizontal: 20,
            gap: 8,
            borderWidth: isUrgent ? 1.5 : 0,
            borderColor: cardBorder,
          }}
        >
          <Text
            className="text-[32px] font-pretendard-bold"
            style={{ color: numberColor }}
          >
            {formatGrams(bean.remainGrams)} 남음
          </Text>
          <Text
            className="text-[13px] font-pretendard"
            style={{ color: isUrgent ? "#B55C3E" : "#7B6A5C" }}
          >
            {isUrgent ? "⚠ " : ""}약 {bean.rop.cupsRemaining.toFixed(1)}잔
            {bean.rop.daysRemaining !== null
              ? ` · ~${formatDays(bean.rop.daysRemaining)}`
              : ""}{" "}
            · {ropLabel(bean.rop.status)}
            {isUrgent ? "!" : ""}
          </Text>
          <View
            className="bg-bg-tertiary overflow-hidden"
            style={{ height: 6, borderRadius: 3, marginTop: 4 }}
          >
            <View
              style={{
                height: "100%",
                width: `${fillPct}%`,
                backgroundColor: isUrgent ? "#B55C3E" : "#3A2419",
                borderRadius: 3,
              }}
            />
          </View>
        </View>

        {/* info card */}
        <View
          className="bg-bg-secondary"
          style={{ borderRadius: 18, padding: 20, gap: 14 }}
        >
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            원두 정보
          </Text>
          <InfoRow label="주문" value={formatDate(bean.orderedAt)} />
          <InfoRow label="로스팅" value={formatDate(bean.roastedOn)} />
          <InfoRow
            label="배송"
            value={bean.arrivedAt ? formatDate(bean.arrivedAt) : "—"}
          />
          <InfoRow label="1잔 용량" value={`${bean.gramsPerCup}g`} />
          <InfoRow label="하루 잔수" value={`${bean.cupsPerDay}잔`} />
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-pretendard text-text-secondary">
              ROP 자동 알림
            </Text>
            <Text
              className="text-[13px] font-pretendard-semibold"
              style={{
                color: bean.autoRopEnabled ? "#7A8B5F" : "#A89A8C",
              }}
            >
              {bean.autoRopEnabled ? "ON" : "OFF"}
            </Text>
          </View>
        </View>

        {/* records */}
        <View className="gap-3">
          <Text className="text-[18px] font-pretendard-bold text-text-primary">
            이 원두 기록 ({recordsQuery.data?.length ?? 0})
          </Text>
          {recordsQuery.isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator color="#3A2419" />
            </View>
          ) : (recordsQuery.data ?? []).length === 0 ? (
            <View
              className="bg-bg-secondary items-center"
              style={{ borderRadius: 14, padding: 24 }}
            >
              <Text className="text-[13px] font-pretendard text-text-tertiary">
                아직 기록이 없어요
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {recordGroups.map((group) => (
                <View key={group.date} className="gap-2">
                  <Text className="text-[12px] font-pretendard-semibold text-text-secondary">
                    {dayLabel(group.date)}
                  </Text>
                  <View className="gap-2">
                    {group.items.map((record) => (
                      <MiniRecordRow
                        key={record.id}
                        record={record}
                        currentUserId={currentUserId ?? null}
                        onPress={() =>
                          router.push(`/records/${record.id}`)
                        }
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
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
          className="absolute left-0 right-0 bottom-0"
          style={{
            paddingHorizontal: 24,
            paddingVertical: 16,
            backgroundColor: "#FBF9F6",
            borderTopWidth: 1,
            borderTopColor: "#E8DFD2",
          }}
        >
          <Pressable
            onPress={onPressOrder}
            className="bg-danger flex-row items-center justify-center active:opacity-80"
            style={{
              height: 52,
              borderRadius: 14,
              gap: 8,
            }}
          >
            <ShoppingCart size={18} color="#FBF9F6" />
            <Text className="text-[15px] font-pretendard-bold text-text-on-dark">
              다음 원두 주문하기
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] font-pretendard text-text-secondary">
        {label}
      </Text>
      <Text className="text-[13px] font-pretendard-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}

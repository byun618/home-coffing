import { Pressable, Text, View } from "react-native";

import type { Record } from "../lib/types";
import { formatGrams, formatRelative } from "../lib/format";

export function RecordRow({
  record,
  onPress,
}: {
  record: Record;
  onPress: () => void;
}) {
  const beanLabel =
    record.beans.length === 0
      ? ""
      : record.beans.length === 1
        ? record.beans[0].beanName
        : `${record.beans[0].beanName} 외 ${record.beans.length - 1}`;
  const author = record.user.displayName ?? record.user.email.split("@")[0];

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-card p-4 gap-2 active:opacity-80 border border-border"
    >
      <View className="flex-row items-baseline justify-between gap-2">
        <Text
          className="text-[15px] font-pretendard-semibold text-text-primary flex-1"
          numberOfLines={1}
        >
          {record.memo ?? beanLabel}
        </Text>
        <Text className="text-[12px] font-pretendard text-text-tertiary">
          {formatRelative(record.brewedAt)}
        </Text>
      </View>
      {record.memo ? (
        <Text className="text-[12px] font-pretendard text-text-secondary">
          {beanLabel}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-pretendard text-text-secondary">
          {author} · {formatGrams(record.totalGrams)}
        </Text>
      </View>
    </Pressable>
  );
}

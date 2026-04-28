import { Pressable, Text, View } from "react-native";

import type { Bean } from "../lib/types";
import { formatDays, formatGrams, ropLabel, ropTone } from "../lib/format";
import { ProgressBar } from "./ProgressBar";

export function BeanCard({
  bean,
  onPress,
}: {
  bean: Bean;
  onPress: () => void;
}) {
  const fillPct = bean.totalGrams > 0
    ? (bean.remainGrams / bean.totalGrams) * 100
    : 0;
  const tone = ropTone(bean.rop.status);
  const accent =
    tone === "danger"
      ? "text-danger"
      : tone === "muted"
        ? "text-text-secondary"
        : "text-primary";

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface rounded-card p-4 gap-3 active:opacity-80 border border-border"
    >
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text
            className="text-[16px] font-pretendard-semibold text-text-primary"
            numberOfLines={1}
          >
            {bean.name}
          </Text>
          {bean.origin ? (
            <Text className="text-[12px] font-pretendard text-text-secondary mt-0.5">
              {bean.origin}
            </Text>
          ) : null}
        </View>
        <Text className={`text-[12px] font-pretendard-medium ${accent}`}>
          {ropLabel(bean.rop.status)}
        </Text>
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[20px] font-pretendard-bold text-text-primary">
            {formatGrams(bean.remainGrams)}
          </Text>
          <Text className="text-[12px] font-pretendard text-text-secondary">
            / {formatGrams(bean.totalGrams)}
          </Text>
        </View>
        <ProgressBar
          value={fillPct}
          tone={tone === "danger" ? "danger" : "primary"}
        />
      </View>

      <Text className="text-[12px] font-pretendard text-text-secondary">
        약 {bean.rop.cupsRemaining.toFixed(1)}잔 · ~{formatDays(bean.rop.daysRemaining)}
      </Text>
    </Pressable>
  );
}

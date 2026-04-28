import { Pressable, Text, View } from "react-native";

import type { Bean } from "../lib/types";
import { formatDays, formatGrams } from "../lib/format";

interface Props {
  bean: Bean;
  onPress: () => void;
}

/**
 * Home grid Bean Card (mockup KPvvn / creOs 기준)
 * - 200×150, padding 18, radius 20
 * - 일반: bg-bg-secondary, text-text-primary
 * - ROP urgent: bg-accent, text-text-on-dark (강조)
 */
export function BeanCard({ bean, onPress }: Props) {
  const isUrgent = bean.rop.status === "urgent";
  const fillPct =
    bean.totalGrams > 0
      ? Math.max(0, Math.min(100, (bean.remainGrams / bean.totalGrams) * 100))
      : 0;

  const containerClass = isUrgent ? "bg-accent" : "bg-bg-secondary";
  const titleClass = isUrgent ? "text-text-on-dark" : "text-text-secondary";
  const numberClass = isUrgent ? "text-text-on-dark" : "text-text-primary";
  const metaClass = isUrgent ? "text-text-on-dark" : "text-text-secondary";
  const trackClass = isUrgent ? "bg-text-on-dark/30" : "bg-bg-tertiary";
  const fillClass = isUrgent ? "bg-text-on-dark" : "bg-accent";

  const cupsRemaining = bean.rop.cupsRemaining.toFixed(1);
  const daysLabel = formatDays(bean.rop.daysRemaining);
  const metaText = isUrgent
    ? `${cupsRemaining}잔 · 곧 떨어져요`
    : bean.rop.daysRemaining !== null
      ? `${cupsRemaining}잔 · ~${daysLabel}`
      : `${cupsRemaining}잔 · 사용 적음`;

  return (
    <Pressable
      onPress={onPress}
      className={`${containerClass} active:opacity-80`}
      style={{
        width: 200,
        height: 150,
        padding: 18,
        borderRadius: 20,
      }}
    >
      <Text
        className={`text-[12px] font-pretendard ${titleClass}`}
        numberOfLines={1}
      >
        {bean.name}
      </Text>
      <Text
        className={`text-[32px] font-pretendard-bold ${numberClass} mt-1`}
        numberOfLines={1}
      >
        {formatGrams(bean.remainGrams)}
      </Text>
      <View className="gap-1.5 mt-auto">
        <View className={`h-1.5 rounded-full overflow-hidden ${trackClass}`}>
          <View
            className={`h-full rounded-full ${fillClass}`}
            style={{ width: `${fillPct}%` }}
          />
        </View>
        <Text className={`text-[11px] font-pretendard ${metaClass}`}>
          {metaText}
        </Text>
      </View>
    </Pressable>
  );
}

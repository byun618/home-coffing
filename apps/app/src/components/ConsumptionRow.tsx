import { Text, View } from "react-native";
import type { ConsumptionItem } from "@home-coffing/shared-types";
import { formatConsumptionTime } from "../lib/format";

export function ConsumptionRow({
  item,
  showBean = true,
}: {
  item: ConsumptionItem;
  showBean?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border">
      <View className="flex-1 pr-3">
        <Text className="text-[13px] font-pretendard text-text-secondary">
          {formatConsumptionTime(item.createdAt)}
        </Text>
        {showBean && (
          <Text className="text-[15px] font-pretendard-medium text-text-primary mt-0.5">
            {item.beanName}
          </Text>
        )}
      </View>
      <Text className="text-[15px] font-pretendard-semibold text-text-primary">
        {item.amount}g
      </Text>
    </View>
  );
}

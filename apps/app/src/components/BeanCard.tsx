import { Pressable, Text, View } from "react-native";
import type { BeanWithStats } from "@home-coffing/shared-types";
import { statsText } from "../lib/format";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";

interface Props {
  bean: BeanWithStats;
  onPress: () => void;
}

export function BeanCard({ bean, onPress }: Props) {
  const isEmpty = bean.status === "empty";
  return (
    <Pressable
      onPress={onPress}
      className={`bg-surface rounded-card p-5 mb-3 ${isEmpty ? "opacity-60" : ""}`}
    >
      <View className="flex-row justify-between items-start mb-3.5">
        <View className="flex-1 pr-3">
          <Text className="text-[17px] font-pretendard-semibold text-text-primary">
            {bean.name}
          </Text>
          <Text className="text-[13px] font-pretendard text-text-secondary mt-1">
            {bean.roastDate} 로스팅
          </Text>
        </View>
        <StatusBadge status={bean.status} />
      </View>
      <ProgressBar progress={bean.progress} />
      <Text className="text-[15px] font-pretendard text-text-secondary mt-3">
        {statsText(bean)}
      </Text>
    </Pressable>
  );
}

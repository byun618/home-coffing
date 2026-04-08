import { Text, View } from "react-native";
import type { BeanStatus } from "@home-coffing/shared-types";
import { badgeLabel } from "../lib/format";

const STYLES: Record<BeanStatus, { bg: string; fg: string }> = {
  degassing: { bg: "bg-primary-subtle", fg: "text-primary" },
  safe: { bg: "bg-success-subtle", fg: "text-success" },
  soon: { bg: "bg-danger-subtle", fg: "text-danger" },
  order: { bg: "bg-danger-subtle", fg: "text-danger" },
  empty: { bg: "bg-[#EEEEEE]", fg: "text-text-secondary" },
};

export function StatusBadge({ status }: { status: BeanStatus }) {
  const { bg, fg } = STYLES[status];
  return (
    <View className={`${bg} rounded-pill px-3 py-1`}>
      <Text
        className={`${fg} text-[11px] font-pretendard-medium`}
        numberOfLines={1}
      >
        {badgeLabel(status)}
      </Text>
    </View>
  );
}

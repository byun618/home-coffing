import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import type { Record } from "../lib/types";
import { formatGrams, formatRelative } from "../lib/format";
import { MemberAvatar } from "./MemberAvatar";

interface Props {
  record: Record;
  currentUserId?: number | null;
  onPress: () => void;
}

/**
 * S02 최근 기록 row — mockup BMAWg/52vFo/oyUeZ 기준
 * - 좌: MemberAvatar(32) + 인라인 텍스트 "원두명 사용량g · 시간"
 * - 우: › chevron
 */
export function RecordRow({ record, currentUserId, onPress }: Props) {
  const beanLabel =
    record.beans.length === 0
      ? "—"
      : record.beans.length === 1
        ? record.beans[0].beanName
        : `${record.beans[0].beanName} 외 ${record.beans.length - 1}`;

  const isMe = currentUserId !== undefined && record.user.id === currentUserId;
  const variant: "self" | "wife" = isMe ? "self" : "wife";
  const initial =
    record.user.displayName?.charAt(0) ?? record.user.email.charAt(0);

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between gap-2.5 active:opacity-80"
    >
      <View className="flex-row items-center gap-2.5 flex-1">
        <MemberAvatar letter={initial} variant={variant} size={32} />
        <Text
          className="text-[13px] font-pretendard text-text-primary flex-1"
          numberOfLines={1}
        >
          {beanLabel} {formatGrams(record.totalGrams)} · {formatRelative(record.brewedAt)}
        </Text>
      </View>
      <ChevronRight size={18} color="#A89A8C" />
    </Pressable>
  );
}

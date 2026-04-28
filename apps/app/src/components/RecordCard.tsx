import { Coffee } from "lucide-react-native";
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
 * S08 Feed 기록 카드 (mockup J0knb / IxKAU 기준)
 * - bg-secondary, radius xl(16), padding 18, gap 12
 * - 헤더 row: avatar 32 + name + time / 사용량 우측 강조 (member color)
 * - 메모 텍스트 15/500 (한 줄 메모 = 타이틀 역할)
 * - bean chip: bg-bg-primary radius md padding [10, 14], coffee icon + 원두명
 */
export function RecordCard({ record, currentUserId, onPress }: Props) {
  const isMe = currentUserId !== undefined && record.user.id === currentUserId;
  const variant: "self" | "wife" = isMe ? "self" : "wife";
  const accentColor = isMe ? "#3A2419" : "#8B6F5C";
  const initial =
    record.user.displayName?.charAt(0) ?? record.user.email.charAt(0);
  const author = record.user.displayName ?? record.user.email.split("@")[0];

  const beanLabel =
    record.beans.length === 0
      ? "—"
      : record.beans.length === 1
        ? record.beans[0].beanName
        : record.beans.map((b) => b.beanName).join(" + ");

  return (
    <Pressable
      onPress={onPress}
      className="bg-bg-secondary active:opacity-80"
      style={{ borderRadius: 16, padding: 18, gap: 12 }}
    >
      {/* header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1">
          <MemberAvatar letter={initial} variant={variant} size={32} />
          <View className="gap-0.5 flex-1">
            <Text
              className="text-[13px] font-pretendard-semibold text-text-primary"
              numberOfLines={1}
            >
              {author}
            </Text>
            <Text className="text-[11px] font-pretendard text-text-secondary">
              {formatRelative(record.brewedAt)}
            </Text>
          </View>
        </View>
        <Text
          className="text-[14px] font-pretendard-bold"
          style={{ color: accentColor }}
        >
          -{formatGrams(record.totalGrams)}
        </Text>
      </View>

      {/* memo — 있을 때만 */}
      {record.memo ? (
        <Text
          className="text-[15px] font-pretendard-medium text-text-primary"
          numberOfLines={3}
        >
          {record.memo}
        </Text>
      ) : null}

      {/* bean chip */}
      <View
        className="bg-bg-primary flex-row items-center"
        style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, gap: 8 }}
      >
        <Coffee size={14} color={accentColor} strokeWidth={2.2} />
        <Text
          className="text-[13px] font-pretendard-medium text-text-primary flex-1"
          numberOfLines={1}
        >
          {beanLabel}
        </Text>
      </View>
    </Pressable>
  );
}

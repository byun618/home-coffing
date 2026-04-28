import { Text, View } from "react-native";

interface Props {
  /** 표시할 이니셜. email 또는 displayName에서 추출 */
  letter: string;
  /** member-self / member-wife 색 (User ID hash로 결정) */
  variant?: "self" | "wife";
  size?: 24 | 28 | 32 | 40 | 56 | 80;
}

const FONT_SIZES: Record<number, number> = {
  24: 11,
  28: 11,
  32: 12,
  40: 14,
  56: 22,
  80: 32,
};

const FONT_WEIGHTS: Record<number, "Pretendard-SemiBold" | "Pretendard-Bold"> = {
  24: "Pretendard-Bold",
  28: "Pretendard-SemiBold",
  32: "Pretendard-SemiBold",
  40: "Pretendard-Bold",
  56: "Pretendard-Bold",
  80: "Pretendard-Bold",
};

export function MemberAvatar({ letter, variant = "self", size = 32 }: Props) {
  const bg = variant === "self" ? "#3A2419" : "#8B6F5C";
  const upper = letter.charAt(0).toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: FONT_WEIGHTS[size],
          fontSize: FONT_SIZES[size],
          color: "#FBF9F6",
        }}
      >
        {upper}
      </Text>
    </View>
  );
}

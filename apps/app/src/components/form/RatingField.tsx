import { Star } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface Props {
  label?: string;
  value: number; // 0~5
  onChange: (value: number) => void;
}

/**
 * 1~5 별점 picker. value=0 → 미설정 상태.
 * 동일 별 다시 탭 → 0으로 리셋(미설정).
 */
export function RatingField({ label, value, onChange }: Props) {
  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="text-[13px] font-pretendard-medium text-text-secondary">
          {label}
          <Text className="text-text-tertiary"> · 선택</Text>
        </Text>
      ) : null}
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((slot) => {
          const filled = slot <= value;
          return (
            <Pressable
              key={slot}
              onPress={() => onChange(value === slot ? 0 : slot)}
              className="w-10 h-10 items-center justify-center"
              hitSlop={4}
            >
              <Star
                size={26}
                color={filled ? "#5C3D2E" : "#BBBBBB"}
                fill={filled ? "#5C3D2E" : "transparent"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

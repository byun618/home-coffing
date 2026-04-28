import { ChevronRight } from "lucide-react-native";
import { ComponentType, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface IconProps {
  size: number;
  color: string;
}

interface RowProps {
  icon?: ComponentType<IconProps>;
  label: string;
  hint?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  /** danger=true → label 텍스트 빨강 */
  danger?: boolean;
}

/**
 * S09/S10/S11 등의 설정 항목 (component-library §11)
 * - padding [16, 18], 좌: icon + 라벨 15/500, 우: › chevron 18 text-tertiary
 * - 그룹 안에 들어갈 때 SettingGroup으로 감싸 사용 (bg-secondary + 내부 1px divider)
 */
export function SettingRow({
  icon: Icon,
  label,
  hint,
  trailing,
  onPress,
  danger = false,
}: RowProps) {
  const labelColor = danger ? "#B55C3E" : "#2A1F18";
  const iconColor = danger ? "#B55C3E" : "#2A1F18";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between active:opacity-80"
      style={{ paddingVertical: 16, paddingHorizontal: 18 }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {Icon ? <Icon size={20} color={iconColor} /> : null}
        <View className="flex-1">
          <Text
            className="text-[15px] font-pretendard-medium"
            style={{ color: labelColor }}
          >
            {label}
          </Text>
          {hint ? (
            <Text className="text-[12px] font-pretendard text-text-tertiary mt-0.5">
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
      {trailing ?? <ChevronRight size={18} color="#A89A8C" />}
    </Pressable>
  );
}

/**
 * Setting 그룹 컨테이너 — bg-secondary + radius xl, 자식 간 1px divider 자동 삽입.
 */
export function SettingGroup({ children }: { children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <View
      className="bg-bg-secondary rounded-xl overflow-hidden"
      style={{ width: "100%" }}
    >
      {items.map((child, index) => (
        <View key={index}>
          {child}
          {index < items.length - 1 ? (
            <View
              className="bg-divider"
              style={{ height: 1, marginHorizontal: 18 }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

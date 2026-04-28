import { Pressable, Text } from "react-native";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** default: rounded-lg(14) 16/500, pill: rounded-pill 16/700 */
  variant?: "default" | "pill";
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "default",
}: Props) {
  const isPill = variant === "pill";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`items-center justify-center ${
        disabled
          ? "bg-bg-tertiary"
          : "bg-accent active:opacity-80"
      }`}
      style={{
        height: 56,
        borderRadius: isPill ? 36 : 14,
      }}
    >
      <Text
        className={
          disabled
            ? "text-text-tertiary"
            : "text-text-on-dark"
        }
        style={{
          fontFamily: isPill ? "Pretendard-Bold" : "Pretendard-Medium",
          fontSize: 16,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

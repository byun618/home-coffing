import { Pressable, Text } from "react-native";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-[52px] rounded-lg items-center justify-center ${
        disabled ? "bg-accent-light opacity-50" : "bg-accent active:opacity-80"
      }`}
    >
      <Text className="text-[15px] font-pretendard-semibold text-text-on-dark">
        {label}
      </Text>
    </Pressable>
  );
}

import { Pressable, Text, TextInput, View } from "react-native";

interface Props {
  value: number;
  onChange: (value: number) => void;
  step?: number;
}

export function Stepper({ value, onChange, step = 1 }: Props) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => onChange(Math.max(0, value - step))}
        className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center active:opacity-70"
      >
        <Text className="text-[20px] font-pretendard-semibold text-primary leading-[22px]">
          −
        </Text>
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(t) => onChange(Number(t) || 0)}
        keyboardType="decimal-pad"
        className="w-16 h-10 rounded-input border border-border text-center text-[15px] font-pretendard-medium text-text-primary"
      />
      <Pressable
        onPress={() => onChange(value + step)}
        className="w-10 h-10 rounded-full bg-primary-subtle items-center justify-center active:opacity-70"
      >
        <Text className="text-[20px] font-pretendard-semibold text-primary leading-[22px]">
          ＋
        </Text>
      </Pressable>
    </View>
  );
}

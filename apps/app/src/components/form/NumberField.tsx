import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  unit?: string;
  decimals?: boolean;
}

export function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  decimals = false,
}: Props) {
  return (
    <View className="gap-1.5 flex-1">
      <Text className="text-[13px] font-pretendard-medium text-text-secondary">
        {label}
      </Text>
      <View className="flex-row items-center h-12 rounded-input border border-border px-3">
        <TextInput
          value={value}
          onChangeText={(next) =>
            onChangeText(
              decimals
                ? next.replace(/[^0-9.]/g, "")
                : next.replace(/[^0-9]/g, ""),
            )
          }
          placeholder={placeholder}
          placeholderTextColor="#BBBBBB"
          keyboardType={decimals ? "decimal-pad" : "number-pad"}
          className="flex-1 text-[15px] font-pretendard text-text-primary"
        />
        {unit ? (
          <Text className="text-[13px] font-pretendard text-text-secondary">
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

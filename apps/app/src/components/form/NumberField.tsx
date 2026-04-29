import { Text, TextInput, View } from "react-native";

interface Props {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  unit?: string;
  decimals?: boolean;
}

/**
 * NumberField (Variant B — design-system §6.2 + Input Field Variant B)
 * - bg-bg-secondary, 56h, radius lg(14), padding [0, 18]
 * - flex-row: 숫자 좌측 + 단위 우측
 */
export function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  decimals = false,
}: Props) {
  return (
    <View style={{ gap: 8 }}>
      <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
        {label}
      </Text>
      <View
        className="bg-bg-secondary flex-row items-center"
        style={{
          height: 56,
          borderRadius: 14,
          paddingHorizontal: 18,
          gap: 8,
        }}
      >
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
          placeholderTextColor="#A89A8C"
          keyboardType={decimals ? "decimal-pad" : "number-pad"}
          style={{
            flex: 1,
            fontFamily: "Pretendard-Regular",
            fontSize: 15,
            color: "#2A1F18",
            padding: 0,
          }}
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

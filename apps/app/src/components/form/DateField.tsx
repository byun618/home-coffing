import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

interface Props {
  label: string;
  value: string; // YYYY-MM-DD (empty allowed)
  onChange: (value: string) => void;
  optional?: boolean;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateField({ label, value, onChange, optional }: Props) {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : new Date();

  return (
    <View className="flex-1" style={{ gap: 8 }}>
      <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
        {label}
        {optional && <Text className="text-text-tertiary"> · 선택</Text>}
      </Text>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-bg-secondary justify-center"
        style={{ height: 56, borderRadius: 14, paddingHorizontal: 18 }}
      >
        <Text
          className={`text-[15px] font-pretendard ${value ? "text-text-primary" : "text-text-tertiary"}`}
        >
          {value || "날짜 선택"}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={parsed}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(event, selected) => {
            setOpen(Platform.OS === "ios");
            if (event.type === "set" && selected) {
              onChange(toISODate(selected));
            }
          }}
        />
      )}
      {optional && value !== "" && (
        <Pressable onPress={() => onChange("")} className="self-start">
          <Text className="text-[11px] font-pretendard-medium text-text-secondary">
            지우기
          </Text>
        </Pressable>
      )}
    </View>
  );
}

import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

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

/**
 * 날짜 선택. iOS는 Modal에 spinner 띄움 (인라인 시 sheet layout 깨짐 회피).
 * Android는 시스템 dialog 사용 (default behavior).
 */
export function DateField({ label, value, onChange, optional }: Props) {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date(),
  );

  function openPicker() {
    setTempDate(value ? new Date(value) : new Date());
    setOpen(true);
  }

  function confirm(d: Date) {
    onChange(toISODate(d));
    setOpen(false);
  }

  return (
    <View className="flex-1" style={{ gap: 8 }}>
      <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
        {label}
        {optional && <Text className="text-text-tertiary"> · 선택</Text>}
      </Text>
      <Pressable
        onPress={openPicker}
        className="bg-bg-secondary justify-center"
        style={{ height: 56, borderRadius: 14, paddingHorizontal: 18 }}
      >
        <Text
          className={`text-[15px] font-pretendard ${value ? "text-text-primary" : "text-text-tertiary"}`}
        >
          {value || "날짜 선택"}
        </Text>
      </Pressable>

      {optional && value !== "" && (
        <Pressable onPress={() => onChange("")} className="self-start">
          <Text className="text-[11px] font-pretendard-medium text-text-secondary">
            지우기
          </Text>
        </Pressable>
      )}

      {/* iOS: Modal-wrapped spinner picker */}
      {open && Platform.OS === "ios" ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            className="flex-1 bg-bg-overlay justify-end"
            onPress={() => setOpen(false)}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-bg-primary"
              style={{
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 14,
                paddingBottom: 32,
              }}
            >
              <View
                className="items-center"
                style={{ paddingBottom: 4 }}
              >
                <View
                  className="bg-bg-tertiary"
                  style={{ width: 36, height: 4, borderRadius: 2 }}
                />
              </View>
              <View
                className="flex-row items-center justify-between"
                style={{ paddingVertical: 8, paddingHorizontal: 24 }}
              >
                <Pressable onPress={() => setOpen(false)}>
                  <Text className="text-[15px] font-pretendard text-text-secondary">
                    취소
                  </Text>
                </Pressable>
                <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                  {label}
                </Text>
                <Pressable onPress={() => confirm(tempDate)}>
                  <Text className="text-[15px] font-pretendard-bold text-accent">
                    확인
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                themeVariant="light"
                onChange={(_, selected) => {
                  if (selected) setTempDate(selected);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {/* Android: native system dialog */}
      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setOpen(false);
            if (event.type === "set" && selected) {
              onChange(toISODate(selected));
            }
          }}
        />
      ) : null}
    </View>
  );
}

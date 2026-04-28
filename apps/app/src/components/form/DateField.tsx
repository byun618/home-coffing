import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
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
 * 날짜 선택.
 * - iOS: Modal 안에 spinner picker + 취소/확인 (인라인 렌더링 시 sheet layout 깨짐 회피)
 * - Android: DateTimePickerAndroid.open() imperative API로 시스템 dialog 호출
 *   (JSX로 렌더 시 flicker / duplicate dialog 발생 가능)
 */
export function DateField({ label, value, onChange, optional }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date(),
  );

  function openPicker() {
    const initial = value ? new Date(value) : new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: initial,
        mode: "date",
        onChange: (event, selected) => {
          if (event.type === "set" && selected) {
            onChange(toISODate(selected));
          }
        },
      });
    } else {
      setTempDate(initial);
      setIosOpen(true);
    }
  }

  function confirmIos() {
    onChange(toISODate(tempDate));
    setIosOpen(false);
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

      {/* iOS: Modal-wrapped spinner picker (Android는 시스템 dialog 사용) */}
      {iosOpen && Platform.OS === "ios" ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setIosOpen(false)}
        >
          <Pressable
            className="flex-1 bg-bg-overlay justify-end"
            onPress={() => setIosOpen(false)}
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
              <View className="items-center" style={{ paddingBottom: 4 }}>
                <View
                  className="bg-bg-tertiary"
                  style={{ width: 36, height: 4, borderRadius: 2 }}
                />
              </View>
              <View
                className="flex-row items-center justify-between"
                style={{ paddingVertical: 8, paddingHorizontal: 24 }}
              >
                <Pressable onPress={() => setIosOpen(false)}>
                  <Text className="text-[15px] font-pretendard text-text-secondary">
                    취소
                  </Text>
                </Pressable>
                <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                  {label}
                </Text>
                <Pressable onPress={confirmIos}>
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
    </View>
  );
}

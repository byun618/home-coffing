import WheelPicker from "@quidone/react-native-wheel-picker";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { parseTimeMmSs } from "../../lib/recipe-format";
import { BottomSheet } from "../BottomSheet";
import { PrimaryButton } from "../form/PrimaryButton";

interface Props {
  visible: boolean;
  title: string;
  /** "mm:ss" 텍스트. 빈 값/잘못된 값이면 0:00 으로 시작 */
  value: string;
  /** "mm:ss" 텍스트로 반환 (mm 1+ 자리, ss 2 자리) */
  onChange: (mmss: string) => void;
  onClose: () => void;
  maxMinutes?: number;
}

const SECOND_DATA = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

export function TimeWheelSheet({
  visible,
  title,
  value,
  onChange,
  onClose,
  maxMinutes = 30,
}: Props) {
  const minuteData = Array.from({ length: maxMinutes + 1 }, (_, i) => ({
    value: i,
    label: String(i),
  }));

  const [mm, setMm] = useState(0);
  const [ss, setSs] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const total = parseTimeMmSs(value);
    if (total !== null && total >= 0) {
      setMm(Math.min(maxMinutes, Math.floor(total / 60)));
      setSs(total % 60);
    } else {
      setMm(0);
      setSs(0);
    }
  }, [visible, value, maxMinutes]);

  function onConfirm() {
    onChange(`${mm}:${String(ss).padStart(2, "0")}`);
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <View className="gap-4 pt-2 pb-4">
        <View
          className="flex-row items-center justify-center"
          style={{ gap: 8, height: 220 }}
        >
          <View style={{ flex: 1 }}>
            <WheelPicker
              data={minuteData}
              value={mm}
              onValueChanged={({ item }) => setMm(item.value)}
              itemHeight={44}
              visibleItemCount={5}
            />
          </View>
          <Text className="text-[24px] font-pretendard-bold text-text-primary">
            :
          </Text>
          <View style={{ flex: 1 }}>
            <WheelPicker
              data={SECOND_DATA}
              value={ss}
              onValueChanged={({ item }) => setSs(item.value)}
              itemHeight={44}
              visibleItemCount={5}
            />
          </View>
        </View>
        <View className="flex-row" style={{ gap: 12, alignItems: "center" }}>
          <Text className="text-[12px] font-pretendard text-text-tertiary flex-1">
            분 · 초
          </Text>
          <View style={{ flex: 2 }}>
            <PrimaryButton label="확인" onPress={onConfirm} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

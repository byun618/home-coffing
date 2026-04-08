import { useState } from "react";
import { Text, View } from "react-native";
import type { BeanCreateRequest } from "@home-coffing/shared-types";

import { DateField } from "../form/DateField";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type BeanFormValues = BeanCreateRequest;

interface Props {
  initialValues?: Partial<BeanFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: BeanFormValues) => void;
}

export function BeanForm({
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
}: Props) {
  const today = todayISO();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [totalAmount, setTotalAmount] = useState(
    initialValues?.totalAmount ? String(initialValues.totalAmount) : "",
  );
  const [orderedAt, setOrderedAt] = useState(initialValues?.orderedAt ?? today);
  const [roastDate, setRoastDate] = useState(initialValues?.roastDate ?? today);
  const [arrivedAt, setArrivedAt] = useState(initialValues?.arrivedAt ?? "");
  const [degassingDays, setDegassingDays] = useState(
    String(initialValues?.degassingDays ?? 7),
  );
  const [cupsPerDay, setCupsPerDay] = useState(
    (initialValues?.cupsPerDay ?? 2).toFixed(2),
  );
  const [gramsPerCup, setGramsPerCup] = useState(
    (initialValues?.gramsPerCup ?? 20).toFixed(2),
  );

  const canSubmit =
    name.trim() !== "" &&
    Number(totalAmount) > 0 &&
    orderedAt !== "" &&
    roastDate !== "" &&
    Number(degassingDays) >= 0 &&
    Number(cupsPerDay) > 0 &&
    Number(gramsPerCup) > 0;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit({
      name: name.trim(),
      totalAmount: Number(totalAmount),
      orderedAt,
      roastDate,
      ...(arrivedAt ? { arrivedAt } : {}),
      degassingDays: Number(degassingDays),
      cupsPerDay: Number(cupsPerDay),
      gramsPerCup: Number(gramsPerCup),
    });
  };

  return (
    <View className="gap-4">
      <TextField
        label="원두 이름"
        placeholder="예) 에티오피아 예가체프"
        value={name}
        onChangeText={setName}
      />
      <TextField
        label="용량 (g)"
        placeholder="200"
        keyboardType="number-pad"
        value={totalAmount}
        onChangeText={setTotalAmount}
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <DateField label="주문일" value={orderedAt} onChange={setOrderedAt} />
        </View>
        <View className="flex-1">
          <DateField label="로스팅일" value={roastDate} onChange={setRoastDate} />
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <DateField
            label="배송완료일"
            value={arrivedAt}
            onChange={setArrivedAt}
            optional
          />
        </View>
        <View className="flex-1">
          <TextField
            label="디개싱 (일)"
            keyboardType="number-pad"
            value={degassingDays}
            onChangeText={setDegassingDays}
          />
        </View>
      </View>
      <Text className="text-[11px] font-pretendard text-text-tertiary -mt-2">
        주문 알림 기준에 사용돼요
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField
            label="보통 하루 몇 잔"
            keyboardType="decimal-pad"
            value={cupsPerDay}
            onChangeText={setCupsPerDay}
          />
        </View>
        <View className="flex-1">
          <TextField
            label="보통 한 잔에 몇 g"
            keyboardType="decimal-pad"
            value={gramsPerCup}
            onChangeText={setGramsPerCup}
          />
        </View>
      </View>
      <View className="mt-2">
        <PrimaryButton
          label={submitting ? "저장 중..." : submitLabel}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        />
      </View>
    </View>
  );
}

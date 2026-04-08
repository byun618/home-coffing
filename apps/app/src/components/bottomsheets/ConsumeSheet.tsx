import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "../form/PrimaryButton";
import { Stepper } from "../form/Stepper";
import { useBeans } from "../../lib/queries/beans";
import { useCreateConsumption } from "../../lib/queries/consumptions";
import { useSheetStore } from "../../lib/stores/useSheetStore";
import { BottomModal } from "./BottomModal";

export function ConsumeSheet() {
  const open = useSheetStore((s) => s.open === "consume");
  const close = useSheetStore((s) => s.close);
  const { data: beans } = useBeans();
  const createConsumption = useCreateConsumption();

  const activeBeans = useMemo(
    () => beans?.filter((b) => b.remainAmount > 0) ?? [],
    [beans],
  );

  const [amounts, setAmounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (open) {
      setAmounts(Object.fromEntries(activeBeans.map((b) => [b.id, 0])));
    }
  }, [open, activeBeans]);

  const setAmount = (beanId: number, value: number) => {
    setAmounts((prev) => ({ ...prev, [beanId]: Math.max(0, value) }));
  };

  const items = Object.entries(amounts)
    .filter(([, amount]) => amount > 0)
    .map(([beanId, amount]) => ({ beanId: Number(beanId), amount }));

  const hasAny = items.length > 0;

  const handleSubmit = () => {
    if (!hasAny) return;
    createConsumption.mutate({ items }, { onSuccess: () => close() });
  };

  return (
    <BottomModal visible={open} title="소비 기록" onClose={close}>
      {activeBeans.length === 0 ? (
        <Text className="font-pretendard text-text-secondary">
          먼저 원두를 등록해주세요
        </Text>
      ) : (
        <View className="gap-4">
          {activeBeans.map((bean) => (
            <View
              key={bean.id}
              className="flex-row items-center justify-between"
            >
              <Text
                className="flex-1 pr-3 text-[15px] font-pretendard-medium text-text-primary"
                numberOfLines={1}
              >
                {bean.name}
              </Text>
              <Stepper
                value={amounts[bean.id] ?? 0}
                onChange={(v) => setAmount(bean.id, v)}
              />
            </View>
          ))}
          <View className="mt-4">
            <PrimaryButton
              label={createConsumption.isPending ? "기록 중..." : "기록"}
              onPress={handleSubmit}
              disabled={!hasAny || createConsumption.isPending}
            />
          </View>
        </View>
      )}
    </BottomModal>
  );
}

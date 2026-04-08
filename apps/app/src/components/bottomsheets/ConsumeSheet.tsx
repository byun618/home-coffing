import BottomSheet, { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "../form/PrimaryButton";
import { Stepper } from "../form/Stepper";
import { useBeans } from "../../lib/queries/beans";
import { useCreateConsumption } from "../../lib/queries/consumptions";
import { useSheetStore } from "../../lib/stores/useSheetStore";

export function ConsumeSheet() {
  const ref = useRef<BottomSheet>(null);
  const open = useSheetStore((s) => s.open === "consume");
  const close = useSheetStore((s) => s.close);
  const { data: beans } = useBeans();
  const createConsumption = useCreateConsumption();

  const activeBeans = useMemo(
    () => beans?.filter((b) => b.remainAmount > 0) ?? [],
    [beans],
  );

  const [amounts, setAmounts] = useState<Record<number, number>>({});

  // Reset amounts when sheet opens
  useEffect(() => {
    if (open) {
      setAmounts(
        Object.fromEntries(activeBeans.map((b) => [b.id, 0])),
      );
    }
  }, [open, activeBeans]);

  useEffect(() => {
    if (open) ref.current?.expand();
    else ref.current?.close();
  }, [open]);

  const handleChange = useCallback(
    (index: number) => {
      if (index === -1) close();
    },
    [close],
  );

  const setAmount = (beanId: number, value: number) => {
    setAmounts((prev) => ({ ...prev, [beanId]: Math.max(0, value) }));
  };

  const items = Object.entries(amounts)
    .filter(([, amount]) => amount > 0)
    .map(([beanId, amount]) => ({ beanId: Number(beanId), amount }));

  const hasAny = items.length > 0;

  const handleSubmit = () => {
    if (!hasAny) return;
    createConsumption.mutate(
      { items },
      { onSuccess: () => close() },
    );
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={["60%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#DDDDDD" }}
      onChange={handleChange}
    >
      <BottomSheetView className="px-5 pt-2 pb-2">
        <Text className="text-[17px] font-pretendard-semibold text-text-primary mb-4">
          소비 기록
        </Text>
      </BottomSheetView>
      {activeBeans.length === 0 ? (
        <BottomSheetView className="px-5 pb-10">
          <Text className="font-pretendard text-text-secondary">
            먼저 원두를 등록해주세요
          </Text>
        </BottomSheetView>
      ) : (
        <BottomSheetScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
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
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

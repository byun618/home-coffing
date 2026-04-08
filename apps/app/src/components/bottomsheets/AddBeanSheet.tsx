import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef } from "react";
import { Text } from "react-native";

import { BeanForm, type BeanFormValues } from "../bean/BeanForm";
import { useCreateBean } from "../../lib/queries/beans";
import { useSheetStore } from "../../lib/stores/useSheetStore";

export function AddBeanSheet() {
  const ref = useRef<BottomSheet>(null);
  const open = useSheetStore((s) => s.open === "addBean");
  const close = useSheetStore((s) => s.close);
  const createBean = useCreateBean();

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

  const handleSubmit = (values: BeanFormValues) => {
    createBean.mutate(values, {
      onSuccess: () => close(),
    });
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={["92%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#FFFFFF", borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: "#DDDDDD" }}
      onChange={handleChange}
    >
      <BottomSheetView className="px-5 pt-2 pb-2">
        <Text className="text-[17px] font-pretendard-semibold text-text-primary mb-4">
          원두 추가
        </Text>
      </BottomSheetView>
      <BottomSheetScrollView
        contentContainerClassName="px-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <BeanForm
          submitLabel="저장"
          submitting={createBean.isPending}
          onSubmit={handleSubmit}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

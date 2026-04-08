import { BeanForm, type BeanFormValues } from "../bean/BeanForm";
import { useCreateBean } from "../../lib/queries/beans";
import { useSheetStore } from "../../lib/stores/useSheetStore";
import { BottomModal } from "./BottomModal";

export function AddBeanSheet() {
  const open = useSheetStore((s) => s.open === "addBean");
  const close = useSheetStore((s) => s.close);
  const createBean = useCreateBean();

  const handleSubmit = (values: BeanFormValues) => {
    createBean.mutate(values, {
      onSuccess: () => close(),
    });
  };

  return (
    <BottomModal visible={open} title="원두 추가" onClose={close}>
      <BeanForm
        submitLabel="저장"
        submitting={createBean.isPending}
        onSubmit={handleSubmit}
      />
    </BottomModal>
  );
}

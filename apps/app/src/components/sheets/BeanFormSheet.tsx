import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import {
  useCreateBean,
  useUpdateBean,
  type CreateBeanInput,
  type UpdateBeanInput,
} from "../../lib/queries/beans";
import { showSuccess } from "../../lib/stores/alert-store";
import type { Bean } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { DateField } from "../form/DateField";
import { NumberField } from "../form/NumberField";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";

type Mode =
  | { kind: "create"; cafeId: number }
  | { kind: "edit"; bean: Bean };

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
}

interface FormState {
  name: string;
  origin: string;
  totalGrams: string;
  orderedAt: string;
  roastedOn: string;
  arrivedAt: string;
  degassingDays: string;
  cupsPerDay: string;
  gramsPerCup: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    origin: "",
    totalGrams: "",
    orderedAt: "",
    roastedOn: "",
    arrivedAt: "",
    degassingDays: "7",
    cupsPerDay: "2",
    gramsPerCup: "20",
  };
}

function formFromBean(bean: Bean): FormState {
  return {
    name: bean.name,
    origin: bean.origin ?? "",
    totalGrams: String(bean.totalGrams),
    orderedAt: bean.orderedAt.slice(0, 10),
    roastedOn: bean.roastedOn.slice(0, 10),
    arrivedAt: bean.arrivedAt ? bean.arrivedAt.slice(0, 10) : "",
    degassingDays: String(bean.degassingDays),
    cupsPerDay: String(bean.cupsPerDay),
    gramsPerCup: String(bean.gramsPerCup),
  };
}

export function BeanFormSheet({ visible, onClose, mode }: Props) {
  const baseline =
    mode.kind === "edit" ? formFromBean(mode.bean) : emptyForm();
  const [form, setForm] = useState<FormState>(() => baseline);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(mode.kind === "edit" ? formFromBean(mode.bean) : emptyForm());
      setError(null);
    }
  }, [visible, mode]);

  const isDirty = (Object.keys(baseline) as Array<keyof FormState>).some(
    (key) => form[key] !== baseline[key],
  );
  const close = useDirtyClose(isDirty, onClose);

  const createMutation = useCreateBean(
    mode.kind === "create" ? mode.cafeId : null,
  );
  const updateMutation = useUpdateBean(
    mode.kind === "edit" ? mode.bean.id : null,
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    form.name.trim().length > 0 &&
    Number(form.totalGrams) > 0 &&
    form.orderedAt.length > 0 &&
    form.roastedOn.length > 0 &&
    !isLoading;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit() {
    setError(null);
    if (mode.kind === "create") {
      const input: CreateBeanInput = {
        name: form.name.trim(),
        origin: form.origin.trim() || undefined,
        totalGrams: Number(form.totalGrams),
        orderedAt: form.orderedAt,
        roastedOn: form.roastedOn,
        arrivedAt: form.arrivedAt || undefined,
        degassingDays: form.degassingDays
          ? Number(form.degassingDays)
          : undefined,
        cupsPerDay: form.cupsPerDay ? Number(form.cupsPerDay) : undefined,
        gramsPerCup: form.gramsPerCup ? Number(form.gramsPerCup) : undefined,
      };
      try {
        await createMutation.mutateAsync(input);
        showSuccess("등록 완료", "새 원두가 등록됐어요");
        onClose();
      } catch (err) {
        setError(err instanceof ApiError ? err.body.message : "등록에 실패했어요");
      }
    } else {
      const original = mode.bean;
      const input: UpdateBeanInput = {};
      if (form.name.trim() !== original.name) input.name = form.name.trim();
      const newOrigin = form.origin.trim() || undefined;
      if ((newOrigin ?? null) !== original.origin) input.origin = newOrigin;
      if (Number(form.totalGrams) !== original.totalGrams)
        input.totalGrams = Number(form.totalGrams);
      if (form.orderedAt !== original.orderedAt.slice(0, 10))
        input.orderedAt = form.orderedAt;
      if (form.roastedOn !== original.roastedOn.slice(0, 10))
        input.roastedOn = form.roastedOn;
      const originalArrived = original.arrivedAt
        ? original.arrivedAt.slice(0, 10)
        : "";
      if (form.arrivedAt !== originalArrived) {
        input.arrivedAt = form.arrivedAt || undefined;
      }
      if (Number(form.degassingDays) !== original.degassingDays)
        input.degassingDays = Number(form.degassingDays);
      if (Number(form.cupsPerDay) !== original.cupsPerDay)
        input.cupsPerDay = Number(form.cupsPerDay);
      if (Number(form.gramsPerCup) !== original.gramsPerCup)
        input.gramsPerCup = Number(form.gramsPerCup);

      try {
        await updateMutation.mutateAsync(input);
        showSuccess("수정 완료", "원두 정보를 수정했어요");
        onClose();
      } catch (err) {
        setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
      }
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title={mode.kind === "create" ? "원두 추가" : "원두 수정"}
      titleSize="lg"
    >
      <View className="gap-4 pt-2">
        <TextField
          label="이름"
          value={form.name}
          onChangeText={(v) => set("name", v)}
          placeholder="예) 에티오피아 예가체프"
        />
        <TextField
          label="원산지 (선택)"
          value={form.origin}
          onChangeText={(v) => set("origin", v)}
          placeholder="예) 에티오피아"
        />
        <NumberField
          label="전체 용량"
          value={form.totalGrams}
          onChangeText={(v) => set("totalGrams", v)}
          placeholder="예) 250"
          unit="g"
          decimals
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <DateField
              label="주문일"
              value={form.orderedAt}
              onChange={(v) => set("orderedAt", v)}
            />
          </View>
          <View className="flex-1">
            <DateField
              label="로스팅일"
              value={form.roastedOn}
              onChange={(v) => set("roastedOn", v)}
            />
          </View>
        </View>
        <DateField
          label="배송일"
          value={form.arrivedAt}
          onChange={(v) => set("arrivedAt", v)}
          optional
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <NumberField
              label="디개싱 일수"
              value={form.degassingDays}
              onChangeText={(v) => set("degassingDays", v)}
              unit="일"
            />
          </View>
          <View className="flex-1">
            <NumberField
              label="하루 잔수"
              value={form.cupsPerDay}
              onChangeText={(v) => set("cupsPerDay", v)}
              unit="잔"
              decimals
            />
          </View>
        </View>
        <NumberField
          label="1잔 용량"
          value={form.gramsPerCup}
          onChangeText={(v) => set("gramsPerCup", v)}
          unit="g"
          decimals
        />

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="mt-2">
          <PrimaryButton
            label={
              isLoading
                ? "저장 중..."
                : mode.kind === "create"
                  ? "등록"
                  : "저장"
            }
            onPress={onSubmit}
            disabled={!canSubmit}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={close.confirming}
        title="변경사항이 사라져요"
        message="작성 중인 내용을 닫을까요?"
        confirmLabel="닫기"
        danger
        onConfirm={close.accept}
        onCancel={close.cancel}
      />
    </BottomSheet>
  );
}

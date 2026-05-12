import { ChevronRight, Coffee } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import {
  useCreateBean,
  useUpdateBean,
  type CreateBeanInput,
  type UpdateBeanInput,
} from "../../lib/queries/cafe-beans";
import { showSuccess } from "../../lib/stores/alert-store";
import type {
  Bean,
  BeanCatalogItem,
  BeanProcess,
  BeanType,
} from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { DateField } from "../form/DateField";
import { NumberField } from "../form/NumberField";
import { PrimaryButton } from "../form/PrimaryButton";
import { BeanCatalogPickerSheet } from "./BeanCatalogPickerSheet";

// T005 — B-add-bag (mockup.md):
//   - 이름/원산지 TextField 제거
//   - catalog selector chip 추가 (필수)
//   - edit mode (Q8): chip read-only — catalog 변경은 별 ticket

type Mode =
  | { kind: "create"; cafeId: number }
  | { kind: "edit"; bean: Bean };

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
}

interface FormState {
  beanId: number | null;
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
    beanId: null,
    totalGrams: "",
    orderedAt: "",
    roastedOn: "",
    arrivedAt: "",
    degassingDays: "7",
    cupsPerDay: "2",
    gramsPerCup: "20",
  };
}

function formFromBean(cafeBean: Bean): FormState {
  return {
    beanId: cafeBean.bean.id,
    totalGrams: String(cafeBean.totalGrams),
    orderedAt: cafeBean.orderedAt.slice(0, 10),
    roastedOn: cafeBean.roastedOn.slice(0, 10),
    arrivedAt: cafeBean.arrivedAt ? cafeBean.arrivedAt.slice(0, 10) : "",
    degassingDays: String(cafeBean.degassingDays),
    cupsPerDay: String(cafeBean.cupsPerDay),
    gramsPerCup: String(cafeBean.gramsPerCup),
  };
}

function typeLabel(type: BeanType): string {
  switch (type) {
    case "single":
      return "싱글";
    case "blend":
      return "블렌드";
    case "decaf":
      return "디카페인";
  }
}

function processLabel(process: BeanProcess): string {
  switch (process) {
    case "washed":
      return "워시드";
    case "natural":
      return "내추럴";
    case "honey":
      return "허니";
    case "anaerobic":
      return "무산소";
  }
}

function beanSubline(beanInfo: {
  type: BeanType;
  process: BeanProcess | null;
}): string {
  const parts: string[] = [typeLabel(beanInfo.type)];
  if (beanInfo.process) parts.push(processLabel(beanInfo.process));
  return parts.join(" · ");
}

export function BeanFormSheet({ visible, onClose, mode }: Props) {
  const baseline =
    mode.kind === "edit" ? formFromBean(mode.bean) : emptyForm();
  const [form, setForm] = useState<FormState>(() => baseline);
  // edit mode일 땐 mode.bean.bean이 있고, create mode에선 picker 선택 결과를 여기 저장.
  const [pickedBean, setPickedBean] = useState<BeanCatalogItem | null>(
    mode.kind === "edit" ? mode.bean.bean : null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setForm(mode.kind === "edit" ? formFromBean(mode.bean) : emptyForm());
      setPickedBean(mode.kind === "edit" ? mode.bean.bean : null);
      setError(null);
    }
  }, [visible, mode]);

  // dirty 체크 — edit mode는 chip read-only이므로 beanId는 비교 대상 아님 (어차피 동일).
  const isDirty = (
    Object.keys(baseline) as Array<keyof FormState>
  ).some((key) => form[key] !== baseline[key]);
  const close = useDirtyClose(isDirty, onClose);

  const createMutation = useCreateBean(
    mode.kind === "create" ? mode.cafeId : null,
  );
  const updateMutation = useUpdateBean(
    mode.kind === "edit" ? mode.bean.id : null,
  );

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canSubmit =
    pickedBean !== null &&
    Number(form.totalGrams) > 0 &&
    form.orderedAt.length > 0 &&
    form.roastedOn.length > 0 &&
    !isLoading;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickCatalog(bean: BeanCatalogItem) {
    setPickedBean(bean);
    set("beanId", bean.id);
  }

  async function onSubmit() {
    setError(null);
    if (pickedBean === null) return;

    if (mode.kind === "create") {
      const input: CreateBeanInput = {
        beanId: pickedBean.id,
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
      // beanId는 edit mode에서 read-only — payload에 안 보냄
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
        input.arrivedAt = form.arrivedAt || null;
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

  const isEdit = mode.kind === "edit";

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title={mode.kind === "create" ? "원두 추가" : "원두 수정"}
      titleSize="lg"
    >
      <View className="gap-4 pt-2">
        {/* Catalog selector chip */}
        <View className="gap-1.5">
          <Text className="text-[13px] font-pretendard-medium text-text-secondary">
            원두
          </Text>
          <CatalogChip
            bean={pickedBean}
            readOnly={isEdit}
            onPress={() => {
              if (isEdit) return;
              setPickerOpen(true);
            }}
          />
          {isEdit ? (
            <Text className="text-[11px] font-pretendard text-text-tertiary">
              원두 종류는 변경할 수 없어요
            </Text>
          ) : null}
        </View>

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

      <BeanCatalogPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onPickCatalog}
        mode="all"
      />

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

function CatalogChip({
  bean,
  readOnly,
  onPress,
}: {
  bean: BeanCatalogItem | null;
  readOnly: boolean;
  onPress: () => void;
}) {
  if (bean === null) {
    // empty — B-add-bag empty variant
    return (
      <Pressable
        onPress={onPress}
        className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
        style={{
          height: 60,
          borderRadius: 14,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#A89A8C",
        }}
      >
        <Text className="text-[15px] font-pretendard-medium text-text-tertiary">
          + 원두 선택
        </Text>
        <ChevronRight size={18} color="#A89A8C" />
      </Pressable>
    );
  }

  // filled — B-add-bag filled variant
  return (
    <Pressable
      onPress={onPress}
      disabled={readOnly}
      className={`flex-row items-center ${
        readOnly ? "bg-bg-secondary" : "bg-accent-cream active:opacity-80"
      }`}
      style={{
        height: 60,
        borderRadius: 14,
        paddingHorizontal: 14,
        gap: 12,
      }}
    >
      <View
        className="bg-bg-primary items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 10 }}
      >
        <Coffee size={18} color="#3A2419" strokeWidth={2} />
      </View>
      <View className="flex-1" style={{ gap: 2 }}>
        <Text
          className="text-[15px] font-pretendard-semibold text-text-primary"
          numberOfLines={1}
        >
          {bean.name}
        </Text>
        <Text
          className="text-[12px] font-pretendard text-text-secondary"
          numberOfLines={1}
        >
          {beanSubline(bean)}
        </Text>
      </View>
      {readOnly ? null : (
        <Text className="text-[12px] font-pretendard-medium text-text-secondary">
          변경
        </Text>
      )}
    </Pressable>
  );
}

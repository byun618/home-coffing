import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Trash2,
  X as XIcon,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { ApiError } from "../../lib/api";
import { useDirtyClose } from "../../lib/hooks/useDirtyClose";
import {
  useCreateRecipe,
  useUpdateRecipe,
} from "../../lib/queries/recipes";
import {
  cumulativePourGrams,
  formatBrewingTime,
  formatTimeMmSs,
  parseTimeMmSs,
  pourStyleShort,
} from "../../lib/recipe-format";
import { showSuccess } from "../../lib/stores/alert-store";
import type {
  EquipmentResponse,
  EquipmentType,
  PourOverParams,
  PourStage,
  PourStyle,
  RecipeMethod,
  RecipeResponse,
} from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { PrimaryButton } from "../form/PrimaryButton";
import { TextField } from "../form/TextField";
import { EquipmentPickerSheet } from "./EquipmentPickerSheet";
import { TimeWheelSheet } from "./TimeWheelSheet";

type WizardMode = "create" | "edit" | "clone";

interface Props {
  visible: boolean;
  onClose: () => void;
  cafeId: number;
  initial?: RecipeResponse | null;
  /**
   * - create (default, initial 없음): 신규 생성
   * - edit (initial 있을 때 default): 동일 Recipe 업데이트
   * - clone: initial로 prefill 후 새 Recipe 생성 (이름 default "{원본} 사본")
   */
  mode?: WizardMode;
  onSaved: (recipe: RecipeResponse) => void;
}

const METHOD_OPTIONS: Array<{
  value: RecipeMethod;
  label: string;
  active: boolean;
}> = [
  { value: "pour-over", label: "핸드드립", active: true },
  { value: "espresso", label: "에스프레소", active: false },
  { value: "french-press", label: "프렌치프레스", active: false },
  { value: "aeropress", label: "에어로프레스", active: false },
];

const POUR_STYLES: Array<{ value: PourStyle; label: string }> = [
  { value: "center", label: "센터" },
  { value: "circle-out", label: "원(밖)" },
  { value: "circle-in", label: "원(안)" },
  { value: "spiral", label: "스파이럴" },
  { value: "pulse", label: "펄스" },
  { value: "continuous", label: "연속" },
  { value: "bloom-only", label: "블룸" },
];

const DIRECTIONAL_STYLES: PourStyle[] = ["circle-out", "circle-in", "spiral"];

interface StageDraft {
  label: string;
  startSec: string;
  pourGrams: string;
  pourStyle: PourStyle | null;
  direction: "cw" | "ccw" | null;
  notes: string;
}

function stageFromParams(stage: PourStage): StageDraft {
  return {
    label: stage.label,
    startSec: formatTimeMmSs(stage.startSec),
    pourGrams: String(stage.pourGrams),
    pourStyle: stage.pourStyle ?? null,
    direction: stage.direction ?? null,
    notes: stage.notes ?? "",
  };
}

function emptyStage(): StageDraft {
  return {
    label: "",
    startSec: "0:00",
    pourGrams: "",
    pourStyle: null,
    direction: null,
    notes: "",
  };
}

function stageDraftValid(s: StageDraft): boolean {
  if (s.label.trim().length === 0) return false;
  const startSec = parseTimeMmSs(s.startSec);
  if (startSec === null || startSec < 0) return false;
  const pour = Number(s.pourGrams);
  if (!Number.isFinite(pour) || pour <= 0) return false;
  return true;
}

function equipmentTypeLabel(type: EquipmentType): string {
  switch (type) {
    case "grinder":
      return "그라인더";
    case "brewer":
      return "드리퍼";
    case "kettle":
      return "케틀";
    case "scale":
      return "저울";
  }
}

export function RecipeWizardSheet({
  visible,
  onClose,
  cafeId,
  initial,
  mode,
  onSaved,
}: Props) {
  const resolvedMode: WizardMode = mode ?? (initial ? "edit" : "create");
  const [step, setStep] = useState<number>(1);
  const [method, setMethod] = useState<RecipeMethod>("pour-over");
  const [name, setName] = useState("");
  const [doseGrams, setDoseGrams] = useState("");
  const [grindSize, setGrindSize] = useState("");
  const [waterTempC, setWaterTempC] = useState("");
  const [serveMode, setServeMode] = useState<"hot" | "iced">("hot");
  const [totalYieldGrams, setTotalYieldGrams] = useState("");
  const [iceGrams, setIceGrams] = useState("");
  const [totalTimeText, setTotalTimeText] = useState("0:00");
  const [stages, setStages] = useState<StageDraft[]>([]);
  const [equipments, setEquipments] = useState<EquipmentResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(
    null,
  );
  /** 'total' = W2-B 총 시간, number = 해당 stage index의 startSec */
  const [timeWheelTarget, setTimeWheelTarget] = useState<
    "total" | number | null
  >(null);

  const createMutation = useCreateRecipe(cafeId);
  const updateMutation = useUpdateRecipe(cafeId);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setPickerOpen(false);
    setEditingStageIndex(null);

    if (initial) {
      setMethod(initial.method);
      const baseName = initial.name ?? "";
      setName(
        resolvedMode === "clone"
          ? baseName.length > 0
            ? `${baseName} 사본`
            : ""
          : baseName,
      );
      setEquipments(
        initial.equipments.map((eq) => ({
          id: eq.id,
          type: eq.type,
          name: eq.name,
          brand: eq.brand,
          model: eq.model,
        })),
      );
      const params = initial.params;
      if (params && params.method === "pour-over") {
        setDoseGrams(String(params.doseGrams));
        setGrindSize(String(params.grindSize));
        setWaterTempC(String(params.waterTempC));
        setServeMode(params.serveMode);
        setTotalYieldGrams(String(params.totalYieldGrams));
        setIceGrams(
          params.iceGrams !== undefined ? String(params.iceGrams) : "",
        );
        setTotalTimeText(formatTimeMmSs(params.totalTimeSec));
        setStages(params.stages.map(stageFromParams));
      } else {
        setDoseGrams(params ? String(params.doseGrams) : "");
        setGrindSize(
          params?.grindSize !== undefined ? String(params.grindSize) : "",
        );
        setWaterTempC(params ? String(params.waterTempC) : "");
        setServeMode("hot");
        setTotalYieldGrams("");
        setIceGrams("");
        setTotalTimeText("0:00");
        setStages([]);
      }
      setStep(1);
    } else {
      setMethod("pour-over");
      setName("");
      setDoseGrams("");
      setGrindSize("");
      setWaterTempC("");
      setServeMode("hot");
      setTotalYieldGrams("");
      setIceGrams("");
      setTotalTimeText("0:00");
      setStages([]);
      setEquipments([]);
      setStep(1);
    }
  }, [visible, initial]);

  const isDirty =
    method !== (initial?.method ?? "pour-over") ||
    name !== (initial?.name ?? "") ||
    doseGrams.length > 0 ||
    grindSize.length > 0 ||
    waterTempC.length > 0 ||
    totalYieldGrams.length > 0 ||
    iceGrams.length > 0 ||
    totalTimeText !== "0:00" ||
    stages.length > 0 ||
    equipments.length !== (initial?.equipments.length ?? 0);

  const close = useDirtyClose(isDirty, onClose);

  function updateStage(index: number, patch: Partial<StageDraft>) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  }
  function addStageAndEdit() {
    setStages((prev) => {
      const next = [...prev, emptyStage()];
      setEditingStageIndex(next.length - 1);
      return next;
    });
  }
  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  const placeholderName = useMemo(() => {
    const dose = Number(doseGrams);
    const yieldG = Number(totalYieldGrams);
    const temp = Number(waterTempC);
    if (!dose || !yieldG || !temp) return "예: V60 21g · 1:9 · 90°C";
    const ratio = Math.round((yieldG / dose) * 10) / 10;
    const ratioStr = Number.isInteger(ratio)
      ? ratio.toFixed(0)
      : ratio.toFixed(1);
    const head = equipments.find((e) => e.type === "brewer")?.name ?? "V60";
    return `${head} ${dose}g · 1:${ratioStr} · ${temp}°C`;
  }, [doseGrams, totalYieldGrams, waterTempC, equipments]);

  function buildParams(): PourOverParams | null {
    const dose = Number(doseGrams);
    const temp = Number(waterTempC);
    const yieldG = Number(totalYieldGrams);
    const totalTime = parseTimeMmSs(totalTimeText);
    if (!dose || !temp || !yieldG || totalTime === null) return null;
    if (stages.length === 0) return null;

    const builtStages: PourStage[] = [];
    for (const s of stages) {
      if (!stageDraftValid(s)) return null;
      const startSec = parseTimeMmSs(s.startSec);
      if (startSec === null) return null;
      const pour = Number(s.pourGrams);
      const stage: PourStage = {
        label: s.label.trim(),
        startSec,
        pourGrams: pour,
      };
      if (s.pourStyle) stage.pourStyle = s.pourStyle;
      if (s.pourStyle && DIRECTIONAL_STYLES.includes(s.pourStyle) && s.direction) {
        stage.direction = s.direction;
      }
      const trimmedNotes = s.notes.trim();
      if (trimmedNotes.length > 0) stage.notes = trimmedNotes;
      builtStages.push(stage);
    }

    builtStages.sort((a, b) => a.startSec - b.startSec);

    const grind = Number(grindSize);
    if (!Number.isFinite(grind) || grind <= 0) return null;

    const params: PourOverParams = {
      method: "pour-over",
      doseGrams: dose,
      grindSize: grind,
      waterTempC: temp,
      serveMode,
      totalYieldGrams: yieldG,
      totalTimeSec: totalTime,
      stages: builtStages,
    };
    if (serveMode === "iced" && iceGrams) {
      const ice = Number(iceGrams);
      if (Number.isFinite(ice) && ice >= 0) params.iceGrams = ice;
    }
    return params;
  }

  const isLoading = createMutation.isPending || updateMutation.isPending;

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return method === "pour-over";
      case 2:
        return (
          Number(doseGrams) > 0 &&
          Number(grindSize) > 0 &&
          Number(waterTempC) > 0 &&
          Number(totalYieldGrams) > 0 &&
          parseTimeMmSs(totalTimeText) !== null
        );
      case 3:
        return stages.length > 0 && stages.every(stageDraftValid);
      case 4:
        return buildParams() !== null;
      default:
        return false;
    }
  }

  async function onSave() {
    setError(null);
    const params = buildParams();
    if (!params) {
      setError("입력값을 다시 확인해 주세요");
      return;
    }
    try {
      const equipmentIds = equipments.map((eq) => eq.id);
      if (resolvedMode === "edit" && initial) {
        const recipe = await updateMutation.mutateAsync({
          recipeId: initial.id,
          body: {
            name: name.trim() || null,
            params,
            equipmentIds,
          },
        });
        showSuccess("저장 완료", "레시피를 수정했어요");
        onSaved(recipe);
      } else {
        const recipe = await createMutation.mutateAsync({
          method: "pour-over",
          name: name.trim() || null,
          params,
          equipmentIds,
        });
        showSuccess(
          "저장 완료",
          resolvedMode === "clone" ? "레시피가 복제됐어요" : "레시피가 추가됐어요",
        );
        onSaved(recipe);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "저장에 실패했어요");
    }
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={close.tryClose}
      title={
        resolvedMode === "edit"
          ? "레시피 수정"
          : resolvedMode === "clone"
            ? "레시피 복제"
            : "새 레시피"
      }
    >
      <View className="gap-4 pt-1">
        {resolvedMode === "edit" ? (
          <View
            className="bg-accent-cream"
            style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text className="text-[12px] font-pretendard-medium text-accent">
              수정 모드 — 동일 Recipe에 변경사항 저장
            </Text>
          </View>
        ) : null}
        {resolvedMode === "clone" ? (
          <View
            className="bg-accent-cream"
            style={{ borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text className="text-[12px] font-pretendard-medium text-accent">
              복제 모드 — 새 Recipe로 저장
            </Text>
          </View>
        ) : null}
        <StepIndicator step={step} />

        {step === 1 ? (
          <Step1Method method={method} onChange={setMethod} />
        ) : null}
        {step === 2 ? (
          <Step2Setup
            doseGrams={doseGrams}
            onDose={setDoseGrams}
            grindSize={grindSize}
            onGrind={setGrindSize}
            waterTempC={waterTempC}
            onTemp={setWaterTempC}
            serveMode={serveMode}
            onServe={setServeMode}
            totalYieldGrams={totalYieldGrams}
            onYield={setTotalYieldGrams}
            totalTimeText={totalTimeText}
            onOpenTotalTime={() => setTimeWheelTarget("total")}
            iceGrams={iceGrams}
            onIce={setIceGrams}
          />
        ) : null}
        {step === 3 ? (
          <Step3Stages
            stages={stages}
            totalYieldGrams={Number(totalYieldGrams)}
            totalTimeSec={parseTimeMmSs(totalTimeText) ?? 0}
            onTapStage={setEditingStageIndex}
            onAdd={addStageAndEdit}
          />
        ) : null}
        {step === 4 ? (
          <Step4Finalize
            equipments={equipments}
            onPick={() => setPickerOpen(true)}
            onRemoveEquipment={(id) =>
              setEquipments((prev) => prev.filter((e) => e.id !== id))
            }
            name={name}
            onName={setName}
            placeholder={placeholderName}
          />
        ) : null}

        {error ? (
          <Text className="text-[13px] font-pretendard text-danger">
            {error}
          </Text>
        ) : null}

        <View className="flex-row mt-2" style={{ gap: 8 }}>
          {step > 1 ? (
            <Pressable
              onPress={() => setStep((s) => Math.max(1, s - 1))}
              className="flex-1 items-center justify-center bg-bg-secondary active:opacity-80"
              style={{ height: 56, borderRadius: 14 }}
            >
              <Text className="text-[15px] font-pretendard-medium text-text-primary">
                이전
              </Text>
            </Pressable>
          ) : null}
          <View className="flex-1">
            {step < 4 ? (
              <PrimaryButton
                label="다음"
                onPress={() => setStep((s) => Math.min(4, s + 1))}
                disabled={!canAdvance()}
              />
            ) : (
              <PrimaryButton
                label={isLoading ? "저장 중..." : "저장"}
                onPress={onSave}
                disabled={isLoading || !canAdvance()}
              />
            )}
          </View>
        </View>
      </View>

      <EquipmentPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selectedIds={equipments.map((e) => e.id)}
        onPick={(eq) => {
          setEquipments((prev) =>
            prev.some((e) => e.id === eq.id) ? prev : [...prev, eq],
          );
          setPickerOpen(false);
        }}
      />

      <PourStageEditSheet
        visible={editingStageIndex !== null}
        stage={
          editingStageIndex !== null ? stages[editingStageIndex] ?? null : null
        }
        canRemove={editingStageIndex !== null}
        onClose={() => setEditingStageIndex(null)}
        onUpdate={(patch) => {
          if (editingStageIndex === null) return;
          updateStage(editingStageIndex, patch);
        }}
        onRemove={() => {
          if (editingStageIndex === null) return;
          removeStage(editingStageIndex);
          setEditingStageIndex(null);
        }}
        onOpenTime={() => {
          if (editingStageIndex === null) return;
          setTimeWheelTarget(editingStageIndex);
        }}
      />

      <TimeWheelSheet
        visible={timeWheelTarget !== null}
        title={timeWheelTarget === "total" ? "총 시간" : "시점 (시작 시간)"}
        value={
          timeWheelTarget === "total"
            ? totalTimeText
            : typeof timeWheelTarget === "number"
              ? stages[timeWheelTarget]?.startSec ?? "0:00"
              : "0:00"
        }
        maxMinutes={timeWheelTarget === "total" ? 30 : 30}
        onChange={(mmss) => {
          if (timeWheelTarget === "total") {
            setTotalTimeText(mmss);
          } else if (typeof timeWheelTarget === "number") {
            updateStage(timeWheelTarget, { startSec: mmss });
          }
        }}
        onClose={() => setTimeWheelTarget(null)}
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

function StepIndicator({ step }: { step: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      {[1, 2, 3, 4].map((n) => {
        const filled = n <= step;
        return (
          <View
            key={n}
            style={{
              width: filled ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: filled ? "#3A2419" : "#E5DBCF",
            }}
          />
        );
      })}
      <Text className="text-[12px] font-pretendard text-text-tertiary ml-2">
        {step}/4
      </Text>
    </View>
  );
}

function Step1Method({
  method,
  onChange,
}: {
  method: RecipeMethod;
  onChange: (method: RecipeMethod) => void;
}) {
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-[18px] font-pretendard-bold text-text-primary">
          어떤 방식으로 내려요?
        </Text>
        <Text className="text-[12px] font-pretendard text-text-secondary">
          방식에 따라 다음 단계가 달라져요
        </Text>
      </View>
      <View className="gap-2">
        {METHOD_OPTIONS.map((opt) => {
          const selected = method === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => opt.active && onChange(opt.value)}
              disabled={!opt.active}
              className={`flex-row items-center justify-between active:opacity-80 ${
                selected ? "bg-accent" : "bg-bg-secondary"
              }`}
              style={{
                minHeight: 60,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 14,
                opacity: opt.active ? 1 : 0.5,
              }}
            >
              <Text
                className={`text-[15px] font-pretendard-bold ${
                  selected ? "text-text-on-dark" : "text-text-primary"
                }`}
              >
                {opt.label}
              </Text>
              {!opt.active ? (
                <View
                  className="bg-bg-tertiary"
                  style={{
                    paddingHorizontal: 8,
                    height: 22,
                    borderRadius: 11,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-[11px] font-pretendard-medium text-text-tertiary">
                    곧 출시
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Step2Setup({
  doseGrams,
  onDose,
  grindSize,
  onGrind,
  waterTempC,
  onTemp,
  serveMode,
  onServe,
  totalYieldGrams,
  onYield,
  totalTimeText,
  onOpenTotalTime,
  iceGrams,
  onIce,
}: {
  doseGrams: string;
  onDose: (v: string) => void;
  grindSize: string;
  onGrind: (v: string) => void;
  waterTempC: string;
  onTemp: (v: string) => void;
  serveMode: "hot" | "iced";
  onServe: (v: "hot" | "iced") => void;
  totalYieldGrams: string;
  onYield: (v: string) => void;
  totalTimeText: string;
  onOpenTotalTime: () => void;
  iceGrams: string;
  onIce: (v: string) => void;
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-[18px] font-pretendard-bold text-text-primary">
          셋업 한 번에
        </Text>
        <Text className="text-[12px] font-pretendard text-text-secondary">
          원두 · 분쇄도 · 물 온도 · 모드 · 추출량 · 시간
        </Text>
      </View>

      <View className="flex-row" style={{ gap: 8 }}>
        <CellNumber
          label="원두 양"
          suffix="g"
          value={doseGrams}
          onChange={(v) => onDose(v.replace(/[^0-9.]/g, ""))}
          placeholder="21"
          decimal
        />
        <CellNumber
          label="분쇄도"
          value={grindSize}
          onChange={(v) => onGrind(v.replace(/[^0-9]/g, ""))}
          placeholder="22"
        />
        <CellNumber
          label="물 온도"
          suffix="°C"
          value={waterTempC}
          onChange={(v) => onTemp(v.replace(/[^0-9]/g, ""))}
          placeholder="90"
        />
      </View>

      <View
        className="bg-bg-secondary flex-row"
        style={{ borderRadius: 999, padding: 4 }}
      >
        {(["hot", "iced"] as const).map((mode) => {
          const selected = serveMode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => onServe(mode)}
              className={`flex-1 items-center justify-center ${
                selected ? "bg-accent" : ""
              }`}
              style={{ height: 40, borderRadius: 999 }}
            >
              <Text
                className={`text-[13px] font-pretendard-medium ${
                  selected ? "text-text-on-dark" : "text-text-secondary"
                }`}
              >
                {mode === "hot" ? "☀ Hot" : "❄ Iced"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row" style={{ gap: 8 }}>
        <CellNumber
          label="총 추출량"
          suffix="g"
          value={totalYieldGrams}
          onChange={(v) => onYield(v.replace(/[^0-9]/g, ""))}
          placeholder="200"
        />
        <TimeDisplayCell
          label="총 시간"
          value={totalTimeText}
          placeholder="2:20"
          onPress={onOpenTotalTime}
        />
        {serveMode === "iced" ? (
          <CellNumber
            label="얼음"
            suffix="g"
            value={iceGrams}
            onChange={(v) => onIce(v.replace(/[^0-9]/g, ""))}
            placeholder="120"
          />
        ) : (
          <View className="flex-1" style={{ opacity: 0.5 }}>
            <View
              className="bg-bg-secondary"
              style={{
                borderRadius: 14,
                padding: 12,
                gap: 4,
              }}
            >
              <Text className="text-[10px] font-pretendard text-text-tertiary">
                얼음
              </Text>
              <Text className="text-[15px] font-pretendard-bold text-text-tertiary">
                —
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function Step3Stages({
  stages,
  totalYieldGrams,
  totalTimeSec,
  onTapStage,
  onAdd,
}: {
  stages: StageDraft[];
  totalYieldGrams: number;
  totalTimeSec: number;
  onTapStage: (index: number) => void;
  onAdd: () => void;
}) {
  // 누적 표기를 위해 정렬된 stage 사본 사용 (서버 전송도 동일 정렬)
  const sortedView = useMemo(() => {
    return stages
      .map((s, originalIndex) => ({ s, originalIndex }))
      .sort((a, b) => {
        const aSec = parseTimeMmSs(a.s.startSec) ?? 0;
        const bSec = parseTimeMmSs(b.s.startSec) ?? 0;
        return aSec - bSec;
      });
  }, [stages]);

  // 누적 계산용 PourStage 배열 (정렬된 순서)
  const cumulativeStages: PourStage[] = sortedView.map(({ s }) => ({
    label: s.label,
    startSec: parseTimeMmSs(s.startSec) ?? 0,
    pourGrams: Number(s.pourGrams) || 0,
  }));

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-[18px] font-pretendard-bold text-text-primary">
          어떻게 부어요?
        </Text>
        <Text className="text-[12px] font-pretendard text-text-secondary">
          단계별로 시간 · 물량 기록 (뜸 · 1차 · 2차 · ...)
        </Text>
      </View>

      <View
        className="bg-accent flex-row"
        style={{ borderRadius: 18, padding: 16, gap: 16 }}
      >
        <View className="flex-1" style={{ gap: 4 }}>
          <Text className="text-[10px] font-pretendard text-text-on-dark opacity-70">
            총 추출량
          </Text>
          <Text className="text-[18px] font-pretendard-bold text-text-on-dark">
            {totalYieldGrams > 0 ? `${totalYieldGrams}g` : "—"}
          </Text>
        </View>
        <View className="flex-1 items-end" style={{ gap: 4 }}>
          <Text className="text-[10px] font-pretendard text-text-on-dark opacity-70">
            총 시간
          </Text>
          <Text className="text-[18px] font-pretendard-bold text-text-on-dark">
            {totalTimeSec > 0 ? formatBrewingTime(totalTimeSec) : "—"}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        {sortedView.map(({ s, originalIndex }, viewIdx) => {
          const subLabel = pourStyleShort(s.pourStyle);
          const startSec = parseTimeMmSs(s.startSec) ?? 0;
          const pour = Number(s.pourGrams) || 0;
          const cumulative = cumulativePourGrams(cumulativeStages, viewIdx);
          return (
            <Pressable
              key={originalIndex}
              onPress={() => onTapStage(originalIndex)}
              className="bg-bg-secondary flex-row items-center active:opacity-80"
              style={{
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              <View style={{ width: 54 }}>
                <Text className="text-[14px] font-pretendard-bold text-text-primary">
                  {s.label || `단계 ${viewIdx + 1}`}
                </Text>
                {subLabel ? (
                  <Text className="text-[9px] font-pretendard text-text-tertiary">
                    {subLabel}
                  </Text>
                ) : null}
              </View>
              <View className="flex-1" style={{ gap: 1 }}>
                <Text className="text-[13px] font-pretendard-bold text-text-primary">
                  {cumulative}g
                </Text>
                <Text className="text-[11px] font-pretendard text-text-secondary">
                  {formatTimeMmSs(startSec)}
                </Text>
              </View>
              <View
                className="bg-accent-cream items-center justify-center"
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text className="text-[13px] font-pretendard-bold text-accent">
                  +{pour}g
                </Text>
              </View>
              <ChevronRight size={14} color="#7B6A5C" />
            </Pressable>
          );
        })}

        <Pressable
          onPress={onAdd}
          className="items-center justify-center active:opacity-80 flex-row"
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: "#A89A8C",
            paddingVertical: 14,
            gap: 6,
          }}
        >
          <Plus size={14} color="#7B6A5C" />
          <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
            단계 추가
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Step4Finalize({
  equipments,
  onPick,
  onRemoveEquipment,
  name,
  onName,
  placeholder,
}: {
  equipments: EquipmentResponse[];
  onPick: () => void;
  onRemoveEquipment: (id: number) => void;
  name: string;
  onName: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text className="text-[18px] font-pretendard-bold text-text-primary">
          마무리
        </Text>
        <Text className="text-[12px] font-pretendard text-text-secondary">
          장비는 선택사항. 이름 안 적으면 자동으로 채워줘요.
        </Text>
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
            장비 (선택)
          </Text>
          <Pressable onPress={onPick} className="active:opacity-80">
            <Text className="text-[12px] font-pretendard-semibold text-accent">
              + 추가
            </Text>
          </Pressable>
        </View>
        {equipments.length === 0 ? (
          <Text className="text-[12px] font-pretendard text-text-tertiary">
            등록된 장비가 없어요
          </Text>
        ) : (
          <View className="gap-2">
            {equipments.map((eq) => (
              <Pressable
                key={eq.id}
                onPress={() => onRemoveEquipment(eq.id)}
                className="bg-bg-secondary flex-row items-center justify-between active:opacity-80"
                style={{
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <Text className="text-[13px] font-pretendard-medium text-text-primary">
                  {equipmentTypeLabel(eq.type)} · {eq.name}
                  {eq.model ? ` · ${eq.model}` : ""}
                </Text>
                <XIcon size={14} color="#7B6A5C" />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <TextField
        label="이름 (선택)"
        value={name}
        onChangeText={onName}
        placeholder={placeholder}
        hint="비워두면 추출 정보로 자동 표기돼요"
      />
    </View>
  );
}

function PourStageEditSheet({
  visible,
  stage,
  canRemove,
  onClose,
  onUpdate,
  onRemove,
  onOpenTime,
}: {
  visible: boolean;
  stage: StageDraft | null;
  canRemove: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<StageDraft>) => void;
  onRemove: () => void;
  onOpenTime: () => void;
}) {
  if (!stage) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <View />
      </BottomSheet>
    );
  }
  const directionalActive =
    stage.pourStyle !== null && DIRECTIONAL_STYLES.includes(stage.pourStyle);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="gap-4 pt-1 pb-2">
        <View
          className="flex-row items-center justify-between"
          style={{ marginBottom: 4 }}
        >
          <Pressable
            onPress={onClose}
            className="w-9 h-9 items-center justify-center"
          >
            <ArrowLeft size={20} color="#7B6A5C" />
          </Pressable>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 items-center justify-center"
          >
            <XIcon size={20} color="#7B6A5C" />
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            라벨
          </Text>
          <View
            className="bg-bg-secondary"
            style={{
              borderRadius: 18,
              paddingHorizontal: 18,
              height: 56,
              justifyContent: "center",
            }}
          >
            <TextInput
              value={stage.label}
              onChangeText={(v) => onUpdate({ label: v })}
              placeholder="뜸 / 1차 / 2차 / 마무리"
              placeholderTextColor="#A89A8C"
              style={{
                fontFamily: "Pretendard-SemiBold",
                fontSize: 15,
                color: "#2A1F18",
                padding: 0,
              }}
            />
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            시점 (시작 시간)
          </Text>
          <Pressable
            onPress={onOpenTime}
            className="bg-bg-secondary active:opacity-80"
            style={{
              borderRadius: 18,
              paddingHorizontal: 18,
              height: 64,
              justifyContent: "center",
            }}
          >
            <Text
              className="font-pretendard-bold text-text-primary"
              style={{ fontSize: 24 }}
            >
              {stage.startSec || "0:00"}
            </Text>
          </Pressable>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            이번에 부은 양 (g)
          </Text>
          <View
            className="bg-bg-secondary flex-row items-center"
            style={{
              borderRadius: 18,
              paddingHorizontal: 18,
              height: 64,
            }}
          >
            <TextInput
              value={stage.pourGrams}
              onChangeText={(v) =>
                onUpdate({ pourGrams: v.replace(/[^0-9]/g, "") })
              }
              placeholder="60"
              placeholderTextColor="#A89A8C"
              keyboardType="number-pad"
              className="flex-1"
              style={{
                fontFamily: "Pretendard-Bold",
                fontSize: 24,
                color: "#2A1F18",
                padding: 0,
              }}
            />
            <Text className="text-[15px] font-pretendard-medium text-text-tertiary ml-2">
              g
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            푸어 스타일 (선택)
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {POUR_STYLES.map((p) => {
              const selected = stage.pourStyle === p.value;
              return (
                <Pressable
                  key={p.value}
                  onPress={() =>
                    onUpdate({
                      pourStyle: selected ? null : p.value,
                      direction: DIRECTIONAL_STYLES.includes(p.value)
                        ? stage.direction
                        : null,
                    })
                  }
                  className={`active:opacity-80 ${
                    selected ? "bg-accent" : "bg-bg-secondary"
                  }`}
                  style={{
                    paddingHorizontal: 12,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    className={`text-[12px] ${
                      selected
                        ? "text-text-on-dark font-pretendard-bold"
                        : "text-text-secondary font-pretendard-medium"
                    }`}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2" style={{ opacity: directionalActive ? 1 : 0.5 }}>
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            방향 (선택)
          </Text>
          <View
            className="bg-bg-secondary flex-row"
            style={{ borderRadius: 999, padding: 4 }}
          >
            {(["cw", "ccw"] as const).map((dir) => {
              const selected = stage.direction === dir;
              return (
                <Pressable
                  key={dir}
                  disabled={!directionalActive}
                  onPress={() =>
                    onUpdate({ direction: selected ? null : dir })
                  }
                  className={`flex-1 items-center justify-center ${
                    selected ? "bg-accent" : ""
                  }`}
                  style={{ height: 36, borderRadius: 999 }}
                >
                  <Text
                    className={`text-[12px] font-pretendard-medium ${
                      selected ? "text-text-on-dark" : "text-text-secondary"
                    }`}
                  >
                    {dir === "cw" ? "시계방향" : "반시계"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-[11px] font-pretendard-semibold text-text-secondary">
            메모 (선택)
          </Text>
          <View
            className="bg-bg-secondary"
            style={{
              borderRadius: 18,
              paddingHorizontal: 18,
              minHeight: 56,
              justifyContent: "center",
              paddingVertical: 12,
            }}
          >
            <TextInput
              value={stage.notes}
              onChangeText={(v) => onUpdate({ notes: v })}
              placeholder="swirl 후 wait 5s"
              placeholderTextColor="#A89A8C"
              multiline
              style={{
                fontFamily: "Pretendard-Regular",
                fontSize: 14,
                color: "#2A1F18",
                padding: 0,
              }}
            />
          </View>
        </View>

        <View
          className="flex-row items-center"
          style={{ gap: 12, marginTop: 4 }}
        >
          {canRemove ? (
            <Pressable
              onPress={onRemove}
              className="flex-row items-center active:opacity-80"
              style={{ paddingHorizontal: 4, gap: 6, height: 48 }}
            >
              <Trash2 size={16} color="#C0392B" />
              <Text className="text-[13px] font-pretendard-medium text-danger">
                삭제
              </Text>
            </Pressable>
          ) : null}
          <View className="flex-1">
            <PrimaryButton label="저장" onPress={onClose} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

/**
 * W2-B의 read-only 시간 cell — tap → TimeWheelSheet open.
 * 시각은 CellNumber와 동일, 값은 "mm:ss" 그대로 표시.
 */
function TimeDisplayCell({
  label,
  value,
  placeholder,
  onPress,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
}) {
  const display = value && value !== "0:00" && value !== "0:00" ? value : "";
  return (
    <Pressable
      onPress={onPress}
      className="bg-bg-secondary flex-1 active:opacity-80"
      style={{ borderRadius: 14, padding: 12, gap: 4 }}
    >
      <Text className="text-[10px] font-pretendard text-text-tertiary">
        {label}
      </Text>
      <Text
        className="font-pretendard-bold"
        style={{
          fontSize: 15,
          color: display ? "#2A1F18" : "#A89A8C",
        }}
      >
        {display || placeholder || "0:00"}
      </Text>
    </Pressable>
  );
}

// (구) MmSsLargeField — 분/초 split input. TimeWheelSheet 도입으로 미사용.
// 보존: 향후 키보드 입력 fallback 필요 시 재활용 가능.
function MmSsLargeField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (mmss: string) => void;
  placeholder?: string;
}) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  const mm = m ? m[1].replace(/^0+(?=\d)/, "") : "";
  const ss = m ? m[2] : "";
  const phMatch = placeholder
    ? /^(\d{1,2}):(\d{1,2})$/.exec(placeholder)
    : null;
  const mmPh = phMatch ? phMatch[1] : "0";
  const ssPh = phMatch ? phMatch[2] : "00";

  function setMm(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 2);
    const nextMm = digits.length === 0 ? "0" : digits;
    onChange(`${nextMm}:${ss || "00"}`);
  }
  function setSs(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 2);
    const nextSs =
      digits.length === 0 ? "00" : digits.length === 1 ? `0${digits}` : digits;
    onChange(`${mm || "0"}:${nextSs}`);
  }

  const sharedStyle = {
    fontFamily: "Pretendard-Bold",
    fontSize: 24,
    color: "#2A1F18",
    padding: 0,
  } as const;

  return (
    <View
      className="bg-bg-secondary flex-row items-center"
      style={{
        borderRadius: 18,
        paddingHorizontal: 18,
        height: 64,
      }}
    >
      <TextInput
        value={mm}
        onChangeText={setMm}
        placeholder={mmPh}
        placeholderTextColor="#A89A8C"
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        style={{ ...sharedStyle, minWidth: 24, textAlign: "right" }}
      />
      <Text style={sharedStyle}>:</Text>
      <TextInput
        value={ss}
        onChangeText={setSs}
        placeholder={ssPh}
        placeholderTextColor="#A89A8C"
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        style={{ ...sharedStyle, minWidth: 36 }}
      />
    </View>
  );
}

/**
 * mm:ss 시간 입력 — 분/초 분리 input 2개로 커서 위치 페인 회피.
 * 외부 contract는 "mm:ss" 텍스트 그대로 (parseTimeMmSs 호환).
 */
function MmSsCell({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (mmss: string) => void;
  placeholder?: string;
}) {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(value);
  const mm = m ? m[1].replace(/^0+(?=\d)/, "") : "";
  const ss = m ? m[2] : "";
  const phMatch = placeholder
    ? /^(\d{1,2}):(\d{1,2})$/.exec(placeholder)
    : null;
  const mmPh = phMatch ? phMatch[1] : "0";
  const ssPh = phMatch ? phMatch[2] : "00";

  function setMm(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 2);
    const nextMm = digits.length === 0 ? "0" : digits;
    onChange(`${nextMm}:${ss || "00"}`);
  }
  function setSs(raw: string) {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 2);
    const nextSs =
      digits.length === 0 ? "00" : digits.length === 1 ? `0${digits}` : digits;
    onChange(`${mm || "0"}:${nextSs}`);
  }

  return (
    <View
      className="bg-bg-secondary flex-1"
      style={{ borderRadius: 14, padding: 12, gap: 4 }}
    >
      <Text className="text-[10px] font-pretendard text-text-tertiary">
        {label}
      </Text>
      <View className="flex-row items-baseline">
        <TextInput
          value={mm}
          onChangeText={setMm}
          placeholder={mmPh}
          placeholderTextColor="#A89A8C"
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          style={{
            fontFamily: "Pretendard-Bold",
            fontSize: 15,
            color: "#2A1F18",
            padding: 0,
            minWidth: 14,
          }}
        />
        <Text className="text-[15px] font-pretendard-bold text-text-primary">
          :
        </Text>
        <TextInput
          value={ss}
          onChangeText={setSs}
          placeholder={ssPh}
          placeholderTextColor="#A89A8C"
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          style={{
            fontFamily: "Pretendard-Bold",
            fontSize: 15,
            color: "#2A1F18",
            padding: 0,
            minWidth: 24,
          }}
        />
      </View>
    </View>
  );
}

function CellNumber({
  label,
  suffix,
  value,
  onChange,
  placeholder,
  decimal,
}: {
  label: string;
  suffix?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
}) {
  return (
    <View
      className="bg-bg-secondary flex-1"
      style={{ borderRadius: 14, padding: 12, gap: 4 }}
    >
      <Text className="text-[10px] font-pretendard text-text-tertiary">
        {label}
      </Text>
      <View className="flex-row items-baseline" style={{ gap: 2 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#A89A8C"
          keyboardType={decimal ? "decimal-pad" : "number-pad"}
          className="flex-1"
          style={{
            fontFamily: "Pretendard-Bold",
            fontSize: 15,
            color: "#2A1F18",
            padding: 0,
          }}
        />
        {suffix ? (
          <Text className="text-[11px] font-pretendard text-text-tertiary">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CellText({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View
      className="bg-bg-secondary flex-1"
      style={{ borderRadius: 14, padding: 12, gap: 4 }}
    >
      <Text className="text-[10px] font-pretendard text-text-tertiary">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#A89A8C"
        keyboardType={keyboardType ?? "default"}
        style={{
          fontFamily: "Pretendard-Bold",
          fontSize: 15,
          color: "#2A1F18",
          padding: 0,
        }}
      />
    </View>
  );
}

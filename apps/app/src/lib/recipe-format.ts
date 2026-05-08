import type { PourStage, PourStyle, RecipeMethod, RecipeResponse } from "./types";

export function formatMethodLabel(method: RecipeMethod): string {
  switch (method) {
    case "pour-over":
      return "핸드드립";
    case "espresso":
      return "에스프레소";
    case "french-press":
      return "프렌치프레스";
    case "aeropress":
      return "에어로프레스";
  }
}

/** 초 → mm'ss" (예: 140 → 2'20") */
export function formatBrewingTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "-";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

/** 초 → m:ss (input 표시용. 분은 padStart X — mockup 컨벤션 "0:45" / "2:20"). */
export function formatTimeMmSs(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseTimeMmSs(text: string): number | null {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(text.trim());
  if (!m) return null;
  const min = Number(m[1]);
  const sec = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return null;
  return min * 60 + sec;
}

/**
 * mm:ss 마스킹 — 숫자만 추출해서 자동으로 콜론을 박는다.
 * 사용자가 콜론을 지우거나 다른 문자를 넣을 수 없게 강제.
 *
 * 입력 예: "045" → "0:45", "1230" → "12:30", "" → ""
 * 4자리 초과는 잘라낸다.
 */
export function maskMmSs(input: string): string {
  const digits = input.replace(/[^0-9]/g, "").slice(0, 4);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `0:${digits.padStart(2, "0")}`;
  const mm = digits.slice(0, digits.length - 2);
  const ss = digits.slice(-2);
  return `${mm}:${ss}`;
}

/**
 * 이름 없는 레시피 placeholder.
 * 예: V60 21g · 1:9 · 90°C
 *
 * brewer equipment.name이 있으면 그걸 머리에 사용, 없으면 method 라벨.
 */
export function formatRecipePlaceholder(recipe: RecipeResponse): string {
  const head = headLabel(recipe);
  const params = recipe.params;
  if (!params) return head;

  const dose = `${params.doseGrams}g`;
  const temp = `${params.waterTempC}°C`;

  switch (params.method) {
    case "pour-over": {
      const ratio = ratioLabel(params.doseGrams, params.totalYieldGrams);
      return [head, dose, ratio, temp].filter(Boolean).join(" · ");
    }
    case "espresso": {
      const ratio = ratioLabel(params.doseGrams, params.yieldGrams);
      return [head, dose, ratio, temp].filter(Boolean).join(" · ");
    }
    case "french-press":
    case "aeropress": {
      const yieldG =
        params.method === "french-press"
          ? params.totalYieldGrams
          : params.yieldGrams;
      const ratio = ratioLabel(params.doseGrams, yieldG);
      return [head, dose, ratio, temp].filter(Boolean).join(" · ");
    }
  }
}

/**
 * 한 줄 요약 (chip 보조 라인).
 * 예: 21g · 200ml · 2'20"
 */
export function formatRecipeSummary(recipe: RecipeResponse): string {
  const params = recipe.params;
  if (!params) return formatMethodLabel(recipe.method);

  switch (params.method) {
    case "pour-over":
      return `${params.doseGrams}g · ${params.totalYieldGrams}ml · ${formatBrewingTime(
        params.totalTimeSec,
      )}`;
    case "espresso":
      return `${params.doseGrams}g → ${params.yieldGrams}g · ${params.pressureBar}bar`;
    case "french-press":
      return `${params.doseGrams}g · ${params.totalYieldGrams}ml · ${formatBrewingTime(
        params.steepTimeSec,
      )}`;
    case "aeropress":
      return `${params.doseGrams}g · ${params.yieldGrams}ml · ${formatBrewingTime(
        params.steepTimeSec,
      )}`;
  }
}

function headLabel(recipe: RecipeResponse): string {
  const brewer = recipe.equipments.find((eq) => eq.type === "brewer");
  if (brewer?.name) return brewer.name;
  return formatMethodLabel(recipe.method);
}

/** 현재 stage 까지의 pourGrams 누적 합 */
export function cumulativePourGrams(stages: PourStage[], idx: number): number {
  return stages.slice(0, idx + 1).reduce((sum, s) => sum + s.pourGrams, 0);
}

/** 푸어 스타일을 stage 카드 sub-label로 짧게 표기. 'center' / null 은 미표시. */
export function pourStyleShort(
  style: PourStyle | null | undefined,
): string | null {
  if (!style) return null;
  switch (style) {
    case "bloom-only":
      return "bloom";
    case "circle-out":
    case "circle-in":
      return "circle ↻";
    case "spiral":
      return "spiral";
    case "pulse":
      return "pulse";
    case "continuous":
      return "continuous";
    case "center":
      return null;
  }
}

function ratioLabel(dose: number, yieldG: number): string {
  if (!dose || !yieldG) return "";
  const ratio = yieldG / dose;
  if (!Number.isFinite(ratio)) return "";
  // 1:9, 1:15.5 같은 모양
  const rounded = Math.round(ratio * 10) / 10;
  const display = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
  return `1:${display}`;
}

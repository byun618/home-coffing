import type { RopStatus } from "./types";

export function formatGrams(grams: number): string {
  if (Number.isInteger(grams)) return `${grams}g`;
  return `${grams.toFixed(1)}g`;
}

export function formatRelative(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.floor((now - target) / 60000);
  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  const date = new Date(iso);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDays(days: number | null): string {
  if (days === null) return "—";
  if (days < 1) return "오늘";
  if (days < 30) return `${Math.round(days)}일`;
  return `${Math.round(days / 7)}주`;
}

export function ropLabel(status: RopStatus): string {
  switch (status) {
    case "fresh":
      return "여유";
    case "soon":
      return "곧 떨어져요";
    case "urgent":
      return "지금 시키세요";
    case "paused":
      return "사용 적음";
  }
}

export function ropTone(status: RopStatus): "primary" | "danger" | "muted" {
  switch (status) {
    case "urgent":
      return "danger";
    case "paused":
      return "muted";
    case "soon":
    case "fresh":
      return "primary";
  }
}

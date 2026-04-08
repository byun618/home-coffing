import type { BeanStatus, BeanWithStats } from "@home-coffing/shared-types";

export function badgeLabel(status: BeanStatus): string {
  switch (status) {
    case "degassing":
      return "디개싱 중";
    case "safe":
      return "여유";
    case "soon":
      return "곧 시켜야 해요";
    case "order":
      return "지금 시켜야 해요";
    case "empty":
      return "다 마셨어요";
  }
}

export function statsText(bean: BeanWithStats): string {
  if (bean.status === "degassing" && bean.degassingEndDate) {
    const end = new Date(bean.degassingEndDate);
    const now = new Date();
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `${bean.remainAmount}g · 디개싱 ${diff}일 남음`;
  }
  return `${bean.remainAmount}g 남음`;
}

export function formatConsumptionTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const time = `${h}:${m}`;
  if (isToday) return `오늘 ${time}`;
  if (isYesterday) return `어제 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

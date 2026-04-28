import { View } from "react-native";

/**
 * @param value 0~100 (채워질 비율)
 * @param tone primary(brown) / danger(red) — ROP urgent 등 강조용
 */
export function ProgressBar({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "danger";
}) {
  const filled = Math.max(0, Math.min(100, value));
  const fillClass = tone === "danger" ? "bg-danger" : "bg-accent";
  return (
    <View className="h-[6px] w-full bg-border rounded-[3px] overflow-hidden">
      <View
        className={`h-full rounded-[3px] ${fillClass}`}
        style={{ width: `${filled}%` }}
      />
    </View>
  );
}

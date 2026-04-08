import { View } from "react-native";

/**
 * @param progress 0~100 (filled percentage)
 */
export function ProgressBar({ progress }: { progress: number }) {
  const remaining = Math.max(2, 100 - progress);
  return (
    <View className="h-[6px] w-full bg-border rounded-[3px] overflow-hidden">
      <View
        className="h-full bg-primary rounded-[3px]"
        style={{ width: `${remaining}%` }}
      />
    </View>
  );
}

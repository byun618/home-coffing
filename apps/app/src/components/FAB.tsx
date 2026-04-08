import { Pressable, Text, View } from "react-native";

interface Props {
  onPress: () => void;
  children: string;
}

export function FAB({ onPress, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="w-14 h-14 rounded-full bg-primary items-center justify-center active:opacity-80"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      }}
    >
      <Text className="text-surface text-[24px] font-pretendard-semibold">
        {children}
      </Text>
    </Pressable>
  );
}

export function FABGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute right-5 bottom-6 gap-3">{children}</View>
  );
}

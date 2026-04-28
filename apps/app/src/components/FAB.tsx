import { Coffee } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  onPress: () => void;
}

/**
 * FAB — Home/Feed 우측 하단, Pill Tab Bar 위 16px gap (mockup adYoY 기준)
 * 60×60 원형, accent fill, lucide coffee 흰색 28px, shadow
 */
export function FAB({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        right: 24,
        bottom: 18 + 62 + 16 + insets.bottom,
      }}
    >
      <Pressable
        onPress={onPress}
        className="bg-accent items-center justify-center active:opacity-80"
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          shadowColor: "#3A2419",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Coffee size={28} color="#FBF9F6" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { House, Menu, Rss } from "lucide-react-native";
import { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface IconProps {
  size: number;
  color: string;
}

const TABS: Record<string, { Icon: ComponentType<IconProps>; label: string }> = {
  index: { Icon: House, label: "홈" },
  feed: { Icon: Rss, label: "피드" },
  settings: { Icon: Menu, label: "더보기" },
};

const ACTIVE_COLOR = "#FBF9F6";
const INACTIVE_COLOR = "#D9C5B0";

/**
 * Pill Tab Bar — 화면 하단 floating capsule (mockup S02 K1P9H 기준)
 * - 양옆 24px 마진, 62h, accent fill, radius-pill(36)
 * - 활성: text-on-dark, icon, 13/700
 * - 비활성: accent-cream, 13/500
 */
export function PillTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => TABS[route.name]);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom: 18 + insets.bottom,
      }}
    >
      <View
        className="flex-row bg-accent rounded-pill items-center justify-between px-2"
        style={{ height: 62 }}
      >
        {visibleRoutes.map((route) => {
          const cfg = TABS[route.name];
          const isFocused =
            state.routes[state.index].name === route.name;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (!isFocused) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5"
            >
              <cfg.Icon size={16} color={color} />
              <Text
                style={{
                  fontFamily: isFocused
                    ? "Pretendard-Bold"
                    : "Pretendard-Medium",
                  fontSize: 13,
                  color,
                }}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

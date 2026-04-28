import { Tabs } from "expo-router";
import { Coffee, MoreHorizontal, Newspaper } from "lucide-react-native";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#5C3D2E",
        tabBarInactiveTintColor: "#8C8C8C",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#EEEEEE",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Pretendard-Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => <Coffee color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: "피드",
          tabBarIcon: ({ color, size }) => (
            <Newspaper color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "더보기",
          tabBarIcon: ({ color, size }) => (
            <MoreHorizontal color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="beans/[id]" options={{ href: null }} />
      <Tabs.Screen name="records/[id]" options={{ href: null }} />
    </Tabs>
  );
}

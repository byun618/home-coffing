import { Tabs } from "expo-router";

import { PillTabBar } from "../../src/components/PillTabBar";

export default function MainLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="feed" options={{ title: "피드" }} />
      <Tabs.Screen name="settings" options={{ title: "더보기" }} />
    </Tabs>
  );
}

import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBeans } from "../src/lib/queries/beans";

export default function HomeScreen() {
  const { data: beans, isLoading, error } = useBeans();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-5 py-6">
        <Text className="text-[20px] font-pretendard-bold text-text-primary mb-6">
          홈 커핑
        </Text>

        {isLoading && (
          <Text className="font-pretendard text-text-secondary">
            불러오는 중...
          </Text>
        )}

        {error && (
          <View className="bg-danger-subtle rounded-card p-5">
            <Text className="font-pretendard-medium text-danger">
              API 연결 실패
            </Text>
            <Text className="font-pretendard text-[13px] text-text-secondary mt-2">
              {error.message}
            </Text>
            <Text className="font-pretendard text-[11px] text-text-tertiary mt-2">
              apps/app/.env의 EXPO_PUBLIC_API_URL을 확인하세요
            </Text>
          </View>
        )}

        {beans && beans.length === 0 && (
          <Text className="font-pretendard text-text-secondary">
            첫 원두를 등록해보세요
          </Text>
        )}

        {beans?.map((bean) => (
          <View
            key={bean.id}
            className="bg-surface rounded-card p-5 mb-3"
          >
            <Text className="text-[17px] font-pretendard-semibold text-text-primary">
              {bean.name}
            </Text>
            <Text className="text-[13px] font-pretendard text-text-secondary mt-1">
              {bean.remainAmount}g 남음
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

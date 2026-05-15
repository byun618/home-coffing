import { ArrowLeft, Coffee, Search, SearchX } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBeanCatalog } from "../../lib/queries/bean-catalog";
import type { BeanCatalogItem, BeanProcess, BeanType } from "../../lib/types";

// T005 — F2 / F2-miss 풀스크린 picker (mockup.md, Q9 결정).
// mode='all'    → B-add-bag 진입 시 전체 catalog
// mode='active-only' → C3 "전체 검색" 진입 시 해당 카페에 활성 봉지가 있는 catalog만

// mode·cafeId discriminated union — 'active-only'는 cafeId 필수 (호출처 미스 차단).
type Props =
  | {
      visible: boolean;
      onClose: () => void;
      onPick: (bean: BeanCatalogItem) => void;
      mode: "all";
    }
  | {
      visible: boolean;
      onClose: () => void;
      onPick: (bean: BeanCatalogItem) => void;
      mode: "active-only";
      cafeId: number;
    };

function typeLabel(type: BeanType): string {
  switch (type) {
    case "single":
      return "싱글";
    case "blend":
      return "블렌드";
    case "decaf":
      return "디카페인";
  }
}

function processLabel(process: BeanProcess): string {
  switch (process) {
    case "washed":
      return "워시드";
    case "natural":
      return "내추럴";
    case "honey":
      return "허니";
    case "anaerobic":
      return "무산소";
  }
}

function subline(bean: BeanCatalogItem): string {
  const parts: string[] = [typeLabel(bean.type)];
  if (bean.process) parts.push(processLabel(bean.process));
  return parts.join(" · ");
}

export function BeanCatalogPickerSheet(props: Props) {
  const { visible, onClose, onPick, mode } = props;
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  // 시트 열림 시 검색어 초기화
  useEffect(() => {
    if (visible) {
      setSearch("");
      setDebounced("");
    }
  }, [visible]);

  // 검색어 200ms debounce
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(search.trim()), 200);
    return () => clearTimeout(handle);
  }, [search]);

  const cafeIdForActive = mode === "active-only" ? props.cafeId : null;
  const params = useMemo(() => {
    if (mode === "active-only" && cafeIdForActive !== null) {
      return {
        search: debounced || undefined,
        activeOnly: true,
        cafeId: cafeIdForActive,
        limit: 50,
      };
    }
    return {
      search: debounced || undefined,
      limit: 50,
    };
  }, [mode, debounced, cafeIdForActive]);

  const catalogQuery = useBeanCatalog(params);
  const items = catalogQuery.data ?? [];
  const isLoading = catalogQuery.isLoading || catalogQuery.isFetching;
  const isEmpty = !isLoading && items.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top", "bottom"]}>
        {/* Header */}
        <View
          className="flex-row items-center"
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          <Pressable
            onPress={onClose}
            className="w-10 h-10 items-center justify-center active:opacity-70"
          >
            <ArrowLeft size={22} color="#2A1F18" />
          </Pressable>
          <Text className="text-[17px] font-pretendard-semibold text-text-primary flex-1">
            원두 선택
          </Text>
        </View>

        {/* Search input */}
        <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 12 }}>
          <View
            className="bg-bg-secondary flex-row items-center"
            style={{
              borderRadius: 14,
              paddingHorizontal: 14,
              height: 48,
              gap: 10,
            }}
          >
            <Search size={18} color="#7B6A5C" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="원두 이름 검색"
              placeholderTextColor="#A89A8C"
              autoCorrect={false}
              autoCapitalize="none"
              style={{
                flex: 1,
                fontFamily: "Pretendard-Regular",
                fontSize: 15,
                color: "#2A1F18",
                padding: 0,
              }}
            />
          </View>
        </View>

        {/* List */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 32,
            gap: 8,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading && items.length === 0 ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#3A2419" />
            </View>
          ) : null}

          {isEmpty ? <EmptyState query={debounced} /> : null}

          {items.map((bean) => (
            <Pressable
              key={bean.id}
              onPress={() => {
                onPick(bean);
                onClose();
              }}
              className="bg-bg-secondary flex-row items-center active:opacity-80"
              style={{
                borderRadius: 14,
                padding: 14,
                gap: 12,
              }}
            >
              <View
                className="bg-bg-primary items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: 10 }}
              >
                <Coffee size={18} color="#3A2419" strokeWidth={2} />
              </View>
              <View className="flex-1" style={{ gap: 2 }}>
                <Text
                  className="text-[15px] font-pretendard-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {bean.name}
                </Text>
                <Text
                  className="text-[12px] font-pretendard text-text-secondary"
                  numberOfLines={1}
                >
                  {subline(bean)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function EmptyState({ query }: { query: string }) {
  // mockup.md F2-miss — CTA 없음. 검색어 변경으로만 복귀.
  return (
    <View className="items-center" style={{ paddingTop: 60, gap: 12 }}>
      <View
        className="bg-bg-secondary items-center justify-center"
        style={{ width: 64, height: 64, borderRadius: 32 }}
      >
        <SearchX size={28} color="#A89A8C" strokeWidth={2} />
      </View>
      <Text className="text-[15px] font-pretendard-semibold text-text-primary">
        검색 결과 없음
      </Text>
      <Text
        className="text-[13px] font-pretendard text-text-secondary text-center"
        style={{ paddingHorizontal: 24 }}
      >
        {query.length > 0
          ? "다른 검색어로 시도해보세요"
          : "검색어를 입력해주세요"}
      </Text>
    </View>
  );
}

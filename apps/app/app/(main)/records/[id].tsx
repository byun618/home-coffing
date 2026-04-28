import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Coffee, MoreHorizontal } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmDialog } from "../../../src/components/ConfirmDialog";
import { BottomSheet } from "../../../src/components/BottomSheet";
import { RecordEditSheet } from "../../../src/components/sheets/RecordEditSheet";
import { useBeansList } from "../../../src/lib/queries/beans";
import {
  useDeleteRecord,
  useRecordDetail,
} from "../../../src/lib/queries/records";
import { useAuthStore } from "../../../src/lib/stores/auth-store";
import { showToast } from "../../../src/lib/stores/toast-store";
import { formatGrams, formatRelative } from "../../../src/lib/format";

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recordId = id ? Number(id) : null;
  const recordQuery = useRecordDetail(recordId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const beansQuery = useBeansList(activeCafeId);
  const deleteMutation = useDeleteRecord();

  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (recordQuery.isLoading || !recordQuery.data) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#5C3D2E" />
      </SafeAreaView>
    );
  }

  const record = recordQuery.data;
  const isMine = record.user.id === currentUserId;
  const author = record.user.displayName ?? record.user.email.split("@")[0];

  async function onConfirmDelete() {
    setConfirmDelete(false);
    try {
      await deleteMutation.mutateAsync(record.id);
      showToast("삭제 완료");
      router.back();
    } catch {
      showToast("삭제에 실패했어요", "error");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="flex-row items-center justify-between px-3 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1A1A1A" />
        </Pressable>
        {isMine ? (
          <Pressable
            onPress={() => setActionsOpen(true)}
            className="w-10 h-10 items-center justify-center"
          >
            <MoreHorizontal size={22} color="#1A1A1A" />
          </Pressable>
        ) : (
          <View className="w-10 h-10" />
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 gap-4">
          <View className="gap-1">
            {record.memo ? (
              <Text className="text-[22px] font-pretendard-bold text-text-primary">
                {record.memo}
              </Text>
            ) : null}
            <Text className="text-[12px] font-pretendard text-text-secondary">
              {author}
              {!isMine ? " (다른 멤버)" : ""} · {formatRelative(record.brewedAt)}
            </Text>
          </View>

          {record.beans.length === 1 ? (
            <View className="bg-surface rounded-card p-4 flex-row items-center gap-3 border border-border">
              <Coffee size={20} color="#5C3D2E" />
              <View className="flex-1">
                <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                  {record.beans[0].beanName}
                </Text>
                <Text className="text-[12px] font-pretendard text-text-secondary mt-0.5">
                  -{formatGrams(record.beans[0].grams)}
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-surface rounded-card p-4 gap-2 border border-border">
              <Text className="text-[15px] font-pretendard-semibold text-primary">
                {record.beans.map((bean) => bean.beanName).join(" + ")} · 총 {formatGrams(record.totalGrams)}
              </Text>
              <View className="gap-1 mt-1">
                {record.beans.map((bean) => (
                  <Text
                    key={bean.beanId}
                    className="text-[13px] font-pretendard text-text-secondary"
                  >
                    • {bean.beanName} · {formatGrams(bean.grams)}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {record.tasteNote?.text ? (
            <View className="bg-surface rounded-card p-4 gap-1 border border-border">
              <Text className="text-[12px] font-pretendard text-text-secondary">
                맛 노트
              </Text>
              <Text className="text-[14px] font-pretendard text-text-primary">
                {record.tasteNote.text}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title="기록 관리"
      >
        <View className="gap-1 pt-2 pb-4">
          <Pressable
            onPress={() => {
              setActionsOpen(false);
              setEditOpen(true);
            }}
            className="px-2 py-3.5 rounded-btn active:bg-primary-subtle"
          >
            <Text className="text-[15px] font-pretendard-medium text-text-primary">
              수정
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setActionsOpen(false);
              setConfirmDelete(true);
            }}
            className="px-2 py-3.5 rounded-btn active:bg-primary-subtle"
          >
            <Text className="text-[15px] font-pretendard-medium text-danger">
              삭제
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      <RecordEditSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        record={record}
        beans={beansQuery.data ?? []}
        onDelete={() => {
          setEditOpen(false);
          setConfirmDelete(true);
        }}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title="기록을 삭제할까요?"
        message="이 작업은 되돌릴 수 없어요. 사용한 원두 잔량은 복원돼요."
        confirmLabel="삭제"
        danger
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}

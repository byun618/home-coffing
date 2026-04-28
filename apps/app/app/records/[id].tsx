import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Coffee,
  MoreHorizontal,
  Star,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "../../src/components/BottomSheet";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { MemberAvatar } from "../../src/components/MemberAvatar";
import { RecordEditSheet } from "../../src/components/sheets/RecordEditSheet";
import { useBeansList } from "../../src/lib/queries/beans";
import {
  useDeleteRecord,
  useRecordDetail,
} from "../../src/lib/queries/records";
import { showSuccess } from "../../src/lib/stores/alert-store";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import { formatGrams } from "../../src/lib/format";

function brewedAtLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const hours = d.getHours();
  const period = hours < 12 ? "오전" : "오후";
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const minute = String(d.getMinutes()).padStart(2, "0");
  const time = `${period} ${hour12}:${minute}`;

  if (isToday) return `오늘 ${time}`;
  if (isYesterday) return `어제 ${time}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
}

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
      <SafeAreaView className="flex-1 bg-bg-primary items-center justify-center">
        <ActivityIndicator color="#3A2419" />
      </SafeAreaView>
    );
  }

  const record = recordQuery.data;
  const isMine = record.user.id === currentUserId;
  const author = record.user.displayName ?? record.user.email.split("@")[0];
  const initial =
    record.user.displayName?.charAt(0) ?? record.user.email.charAt(0);
  const variant: "self" | "wife" = isMine ? "self" : "wife";
  const accentColor = isMine ? "#3A2419" : "#8B6F5C";

  // taste note chip 분할 (콤마/중점)
  const tasteChips = (record.tasteNote?.text ?? "")
    .split(/[,，·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  async function onConfirmDelete() {
    setConfirmDelete(false);
    try {
      await deleteMutation.mutateAsync(record.id);
      showSuccess("삭제 완료", "기록이 삭제됐어요");
      router.back();
    } catch {
      showToast("삭제에 실패했어요", "error");
    }
  }

  const isBlend = record.beans.length > 1;
  const beanTotal = record.beans.reduce((sum, b) => sum + b.grams, 0);

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between"
        style={{ height: 52, paddingHorizontal: 16 }}
      >
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center -ml-2"
          >
            <ArrowLeft size={22} color="#2A1F18" />
          </Pressable>
          <Text className="text-[17px] font-pretendard-semibold text-text-primary">
            기록 상세
          </Text>
        </View>
        {isMine ? (
          <Pressable
            onPress={() => setActionsOpen(true)}
            className="w-10 h-10 items-center justify-center -mr-2"
          >
            <MoreHorizontal size={20} color="#7B6A5C" />
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header — memo as 24/700 + author meta */}
        <View
          className="gap-2"
          style={{
            paddingTop: 16,
            paddingHorizontal: 24,
            paddingBottom: 28,
          }}
        >
          {record.memo ? (
            <Text className="text-[24px] font-pretendard-bold text-text-primary">
              {record.memo}
            </Text>
          ) : (
            <Text className="text-[24px] font-pretendard-bold text-text-tertiary">
              메모 없음
            </Text>
          )}
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <MemberAvatar letter={initial} variant={variant} size={24} />
            <Text className="text-[13px] font-pretendard-medium text-text-secondary">
              {author}
            </Text>
            <Text className="text-[13px] font-pretendard text-text-tertiary">
              ·
            </Text>
            <Text className="text-[13px] font-pretendard text-text-secondary">
              {brewedAtLabel(record.brewedAt)}
            </Text>
            {!isMine ? (
              <Text className="text-[12px] font-pretendard text-text-tertiary">
                (다른 멤버)
              </Text>
            ) : null}
          </View>
        </View>

        <View
          className="gap-5"
          style={{ paddingHorizontal: 24, paddingBottom: 16 }}
        >
          {/* Bean card */}
          {isBlend ? (
            <View
              className="bg-bg-secondary"
              style={{ borderRadius: 16, padding: 18, gap: 12 }}
            >
              <Text className="text-[13px] font-pretendard-semibold text-accent">
                {record.beans.map((b) => b.beanName).join(" + ")} · 총{" "}
                {formatGrams(beanTotal)}
              </Text>
              <View className="gap-2">
                {record.beans.map((bean) => (
                  <View
                    key={bean.beanId}
                    className="flex-row items-center"
                    style={{ gap: 10 }}
                  >
                    <Coffee size={20} color={accentColor} strokeWidth={2.2} />
                    <Text className="text-[14px] font-pretendard-medium text-text-primary flex-1">
                      {bean.beanName}
                    </Text>
                    <Text className="text-[14px] font-pretendard-semibold text-text-secondary">
                      {formatGrams(bean.grams)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View
              className="bg-bg-secondary flex-row items-center"
              style={{ borderRadius: 16, padding: 18, gap: 14 }}
            >
              <Coffee size={32} color={accentColor} strokeWidth={2} />
              <View className="gap-1 flex-1">
                <Text
                  className="text-[15px] font-pretendard-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {record.beans[0]?.beanName ?? "—"}
                </Text>
                <Text className="text-[13px] font-pretendard text-text-secondary">
                  {formatGrams(record.beans[0]?.grams ?? 0)} 사용
                </Text>
              </View>
            </View>
          )}

          {/* Taste note */}
          {record.tasteNote?.text || record.tasteNote?.rating ? (
            <View
              className="bg-bg-secondary"
              style={{ borderRadius: 16, padding: 18, gap: 14 }}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
                  맛 노트
                </Text>
                {record.tasteNote.rating ? (
                  <View className="flex-row" style={{ gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((slot) => (
                      <Star
                        key={slot}
                        size={14}
                        color={
                          slot <= (record.tasteNote!.rating ?? 0)
                            ? "#3A2419"
                            : "#A89A8C"
                        }
                        fill={
                          slot <= (record.tasteNote!.rating ?? 0)
                            ? "#3A2419"
                            : "transparent"
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
              {tasteChips.length > 1 ? (
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {tasteChips.map((chip, idx) => (
                    <View
                      key={idx}
                      className="bg-bg-primary"
                      style={{
                        borderRadius: 36,
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text className="text-[13px] font-pretendard-medium text-text-primary">
                        {chip}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : record.tasteNote.text ? (
                <Text className="text-[14px] font-pretendard text-text-primary leading-5">
                  {record.tasteNote.text}
                </Text>
              ) : null}
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
            className="active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 4 }}
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
            className="active:opacity-80"
            style={{ paddingVertical: 14, paddingHorizontal: 4 }}
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


import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Coffee,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  StarHalf,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "../../src/components/BottomSheet";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { MemberAvatar } from "../../src/components/MemberAvatar";
import { RecipeChip } from "../../src/components/RecipeChip";
import { RecipeWizardSheet } from "../../src/components/sheets/RecipeWizardSheet";
import { RecordEditSheet } from "../../src/components/sheets/RecordEditSheet";
import { TasteNoteSheet } from "../../src/components/sheets/TasteNoteSheet";
import { useBeansList } from "../../src/lib/queries/beans";
import { useRecipes } from "../../src/lib/queries/recipes";
import {
  useDeleteRecord,
  useRecordDetail,
  useUpdateRecord,
} from "../../src/lib/queries/records";
import {
  formatMethodLabel,
  formatRecipePlaceholder,
  formatRecipeSummary,
} from "../../src/lib/recipe-format";
import { showSuccess } from "../../src/lib/stores/alert-store";
import { useAuthStore } from "../../src/lib/stores/auth-store";
import { showToast } from "../../src/lib/stores/toast-store";
import type { RecipeResponse, TasteNoteResponse } from "../../src/lib/types";
import { formatGrams, formatRelative } from "../../src/lib/format";

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

type SheetState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "update"; tasteNote: TasteNoteResponse };

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recordId = id ? Number(id) : null;
  const recordQuery = useRecordDetail(recordId);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const beansQuery = useBeansList(activeCafeId);
  const deleteMutation = useDeleteRecord();
  const updateMutation = useUpdateRecord(recordId);
  const recipesQuery = useRecipes(activeCafeId);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tasteSheet, setTasteSheet] = useState<SheetState>({ kind: "closed" });
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [recipeWizardOpen, setRecipeWizardOpen] = useState(false);

  async function applyRecipe(recipeId: number | null) {
    setRecipePickerOpen(false);
    try {
      await updateMutation.mutateAsync({ recipeId });
      showSuccess(
        recipeId === null ? "변경 완료" : "적용 완료",
        recipeId === null ? "레시피를 해제했어요" : "레시피를 적용했어요",
      );
    } catch {
      showToast("변경에 실패했어요", "error");
    }
  }

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
  const tasteNotes = record.tasteNotes ?? [];

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
        refreshControl={
          <RefreshControl
            refreshing={recordQuery.isFetching && !recordQuery.isLoading}
            onRefresh={() => recordQuery.refetch()}
          />
        }
      >
        {/* Header — author + 시각만 (memo 패턴 제거) */}
        <View
          className="gap-2"
          style={{
            paddingTop: 16,
            paddingHorizontal: 24,
            paddingBottom: 24,
          }}
        >
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <MemberAvatar letter={initial} variant={variant} size={36} />
            <View className="flex-1 gap-0.5">
              <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                {author}
                {!isMine ? (
                  <Text className="text-[12px] font-pretendard text-text-tertiary">
                    {"  "}(다른 멤버)
                  </Text>
                ) : null}
              </Text>
              <Text className="text-[13px] font-pretendard text-text-secondary">
                {brewedAtLabel(record.brewedAt)} ·{" "}
                {formatRelative(record.brewedAt)}
              </Text>
            </View>
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

          {/* Recipe card — body tap → R1 / "변경" link → selector */}
          {record.recipe ? (
            <RecipeBoundCard
              recipe={record.recipe}
              isMine={isMine}
              onTapBody={(recipeId) => router.push(`/recipes/${recipeId}`)}
              onTapChange={() => setRecipePickerOpen(true)}
            />
          ) : isMine ? (
            <RecipeChip
              recipe={null}
              onTap={() => setRecipePickerOpen(true)}
            />
          ) : null}

          {/* Taste notes section */}
          <View className="gap-3">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                맛 노트
              </Text>
              {tasteNotes.length > 0 ? (
                <Text className="text-[13px] font-pretendard text-text-tertiary">
                  {tasteNotes.length}
                </Text>
              ) : null}
            </View>

            {tasteNotes.length === 0 ? (
              <Pressable
                onPress={() => setTasteSheet({ kind: "create" })}
                className="bg-bg-secondary border border-divider items-center justify-center active:opacity-80"
                style={{
                  borderRadius: 16,
                  paddingVertical: 28,
                  borderStyle: "dashed",
                  gap: 6,
                }}
              >
                <Plus size={20} color="#7B6A5C" />
                <Text className="text-[14px] font-pretendard-medium text-text-secondary">
                  맛 노트 추가하기
                </Text>
                <Text className="text-[12px] font-pretendard text-text-tertiary">
                  마시고 난 뒤에 천천히 적어도 좋아요
                </Text>
              </Pressable>
            ) : (
              <View className="gap-2">
                {tasteNotes.map((note) => (
                  <TasteNoteRow
                    key={note.id}
                    note={note}
                    isMine={note.author.id === currentUserId}
                    onEdit={() =>
                      setTasteSheet({ kind: "update", tasteNote: note })
                    }
                  />
                ))}
              </View>
            )}

            {/* + 추가 버튼 (항상 노출) */}
            <Pressable
              onPress={() => setTasteSheet({ kind: "create" })}
              className="flex-row items-center justify-center bg-bg-secondary active:opacity-80"
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                gap: 6,
              }}
            >
              <Plus size={16} color="#3A2419" />
              <Text className="text-[14px] font-pretendard-semibold text-accent">
                맛 노트 추가
              </Text>
            </Pressable>
          </View>
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

      {tasteSheet.kind === "create" ? (
        <TasteNoteSheet
          visible
          onClose={() => setTasteSheet({ kind: "closed" })}
          cafeId={record.cafeId}
          mode="create"
          recordId={record.id}
        />
      ) : null}

      {tasteSheet.kind === "update" ? (
        <TasteNoteSheet
          visible
          onClose={() => setTasteSheet({ kind: "closed" })}
          cafeId={record.cafeId}
          mode="update"
          tasteNote={tasteSheet.tasteNote}
        />
      ) : null}

      <BottomSheet
        visible={recipePickerOpen}
        onClose={() => setRecipePickerOpen(false)}
        title="레시피 선택"
      >
        <View className="gap-2 pt-2 pb-4">
          {(recipesQuery.data ?? []).map((recipe: RecipeResponse) => {
            const isCurrent = record.recipe?.id === recipe.id;
            return (
              <Pressable
                key={recipe.id}
                onPress={() => applyRecipe(recipe.id)}
                className="bg-bg-secondary border border-divider active:opacity-80"
                style={{
                  borderRadius: 14,
                  padding: 14,
                  gap: 4,
                  backgroundColor: isCurrent ? "#EFE3D5" : undefined,
                }}
              >
                <Text
                  className="text-[14px] font-pretendard-semibold text-text-primary"
                  numberOfLines={1}
                >
                  {recipe.name?.trim() || formatRecipePlaceholder(recipe)}
                </Text>
                <Text
                  className="text-[12px] font-pretendard text-text-secondary"
                  numberOfLines={1}
                >
                  {formatMethodLabel(recipe.method)} ·{" "}
                  {formatRecipeSummary(recipe)}
                </Text>
              </Pressable>
            );
          })}

          {record.recipe ? (
            <Pressable
              onPress={() => applyRecipe(null)}
              className="active:opacity-80"
              style={{ paddingVertical: 12, paddingHorizontal: 4 }}
            >
              <Text className="text-[14px] font-pretendard-medium text-text-tertiary">
                선택 해제
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              setRecipePickerOpen(false);
              setRecipeWizardOpen(true);
            }}
            className="bg-bg-secondary items-center justify-center active:opacity-80"
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#A89A8C",
              paddingVertical: 14,
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Plus size={14} color="#3A2419" />
            <Text className="text-[13px] font-pretendard-semibold text-accent">
              새 레시피
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {activeCafeId !== null ? (
        <RecipeWizardSheet
          visible={recipeWizardOpen}
          onClose={() => setRecipeWizardOpen(false)}
          cafeId={activeCafeId}
          onSaved={(recipe) => {
            setRecipeWizardOpen(false);
            applyRecipe(recipe.id);
          }}
        />
      ) : null}

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

function RecipeBoundCard({
  recipe,
  isMine,
  onTapBody,
  onTapChange,
}: {
  recipe: RecipeResponse;
  isMine: boolean;
  onTapBody: (recipeId: number) => void;
  onTapChange: () => void;
}) {
  return (
    <View
      className="bg-accent flex-row items-center"
      style={{
        minHeight: 60,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <Pressable
        onPress={() => onTapBody(recipe.id)}
        className="flex-1 active:opacity-80"
        style={{ gap: 2 }}
      >
        <Text
          className="text-[15px] font-pretendard-bold text-text-on-dark"
          numberOfLines={1}
        >
          {recipe.name?.trim() || formatRecipePlaceholder(recipe)}
        </Text>
        <Text
          className="text-[11px] font-pretendard"
          style={{ color: "#D9C5B0" }}
          numberOfLines={1}
        >
          {formatRecipeSummary(recipe)}
        </Text>
      </Pressable>
      {isMine ? (
        <Pressable
          onPress={onTapChange}
          hitSlop={6}
          className="active:opacity-80"
          style={{ paddingHorizontal: 8, paddingVertical: 6 }}
        >
          <Text className="text-[12px] font-pretendard-semibold text-text-on-dark">
            변경
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TasteNoteRow({
  note,
  isMine,
  onEdit,
}: {
  note: TasteNoteResponse;
  isMine: boolean;
  onEdit: () => void;
}) {
  const author = note.author.displayName ?? note.author.email.split("@")[0];
  const initial =
    note.author.displayName?.charAt(0) ?? note.author.email.charAt(0);
  const variant: "self" | "wife" = isMine ? "self" : "wife";

  return (
    <View
      className="bg-bg-secondary flex-row"
      style={{ borderRadius: 16, padding: 16, gap: 12 }}
    >
      <MemberAvatar letter={initial} variant={variant} size={32} />
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Text className="text-[13px] font-pretendard-semibold text-text-primary">
            {author}
          </Text>
          <Text className="text-[12px] font-pretendard text-text-tertiary">
            · {formatRelative(note.createdAt)}
          </Text>
        </View>
        {note.rating !== null && note.rating > 0 ? (
          <ReadOnlyHalfStars value={note.rating} />
        ) : null}
        {note.memo ? (
          <Text className="text-[14px] font-pretendard text-text-primary leading-5">
            {note.memo}
          </Text>
        ) : null}
      </View>
      {isMine ? (
        <Pressable
          onPress={onEdit}
          hitSlop={6}
          className="w-8 h-8 items-center justify-center"
        >
          <Pencil size={16} color="#7B6A5C" />
        </Pressable>
      ) : null}
    </View>
  );
}

function ReadOnlyHalfStars({ value }: { value: number }) {
  return (
    <View className="flex-row items-center" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((slot) => {
        const full = value >= slot;
        const half = !full && value >= slot - 0.5;
        if (full) {
          return <Star key={slot} size={14} color="#3A2419" fill="#3A2419" />;
        }
        if (half) {
          return (
            <StarHalf key={slot} size={14} color="#3A2419" fill="#3A2419" />
          );
        }
        return (
          <Star key={slot} size={14} color="#A89A8C" fill="transparent" />
        );
      })}
      <Text className="text-[12px] font-pretendard-medium text-text-secondary ml-1">
        {value.toFixed(1)}
      </Text>
    </View>
  );
}

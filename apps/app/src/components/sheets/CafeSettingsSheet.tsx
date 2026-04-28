import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LogOut, UserPlus } from "lucide-react-native";

import { ApiError } from "../../lib/api";
import {
  useCafeDetail,
  useCreateInvitation,
  useLeaveCafe,
  useUpdateCafeName,
} from "../../lib/queries/cafe";
import { showToast } from "../../lib/stores/toast-store";
import type { Invitation } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { ConfirmDialog } from "../ConfirmDialog";
import { TextField } from "../form/TextField";
import { InvitationSheet } from "./InvitationSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  cafeId: number | null;
  currentUserId: number;
  /** 본인이 다른 카페 멤버라면 떠나기 후 다른 카페로 전환, 아니면 logout 호출 */
  onLeftCafe: () => void;
}

export function CafeSettingsSheet({
  visible,
  onClose,
  cafeId,
  currentUserId,
  onLeftCafe,
}: Props) {
  const cafeQuery = useCafeDetail(visible ? cafeId : null);
  const updateName = useUpdateCafeName(cafeId);
  const createInvitation = useCreateInvitation(cafeId);
  const leaveCafe = useLeaveCafe();

  const [name, setName] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cafeQuery.data) setName(cafeQuery.data.name);
  }, [cafeQuery.data]);

  if (!visible) return null;

  const cafe = cafeQuery.data;
  const myMembership = cafe?.members.find(
    (member) => member.userId === currentUserId,
  );
  const isAdmin = myMembership?.role === "admin";

  async function onBlurName() {
    if (!cafe || name.trim().length === 0 || name.trim() === cafe.name) return;
    if (!isAdmin) return;
    try {
      await updateName.mutateAsync(name.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "수정에 실패했어요");
    }
  }

  async function onCreateInvitation() {
    setError(null);
    try {
      const inv = await createInvitation.mutateAsync();
      setInvitation(inv);
    } catch (err) {
      setError(err instanceof ApiError ? err.body.message : "초대 발급에 실패했어요");
    }
  }

  async function onConfirmLeave() {
    if (!cafeId) return;
    setConfirmLeave(false);
    try {
      await leaveCafe.mutateAsync(cafeId);
      showToast("홈카페를 떠났어요");
      onClose();
      onLeftCafe();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.body.message : "떠나기에 실패했어요";
      showToast(message, "error");
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="홈카페 설정">
      <View className="gap-5 pt-2">
        {!cafe ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#3A2419" />
          </View>
        ) : (
          <>
            <View className="gap-1.5">
              <TextField
                label="홈카페 이름"
                value={name}
                onChangeText={setName}
                onBlur={onBlurName}
                editable={isAdmin}
              />
              {!isAdmin ? (
                <Text className="text-[11px] font-pretendard text-text-tertiary">
                  호스트만 이름을 변경할 수 있어요
                </Text>
              ) : null}
            </View>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-pretendard-medium text-text-secondary">
                  멤버 ({cafe.members.length}/2)
                </Text>
                {isAdmin ? (
                  <Pressable
                    onPress={onCreateInvitation}
                    className="flex-row items-center gap-1"
                    disabled={createInvitation.isPending}
                  >
                    <UserPlus size={14} color="#3A2419" />
                    <Text className="text-[13px] font-pretendard-medium text-accent">
                      {createInvitation.isPending ? "발급 중..." : "초대"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View className="gap-2">
                {cafe.members.map((member) => {
                  const isMe = member.userId === currentUserId;
                  const display =
                    member.displayName ?? member.email.split("@")[0];
                  return (
                    <View
                      key={member.userId}
                      className="bg-bg-secondary rounded-xl p-3 flex-row items-center justify-between border border-divider"
                    >
                      <View className="flex-1">
                        <Text className="text-[14px] font-pretendard-semibold text-text-primary">
                          {display}
                          {isMe ? " (나)" : ""}
                        </Text>
                        <Text className="text-[11px] font-pretendard text-text-tertiary">
                          {member.email}
                        </Text>
                      </View>
                      <Text
                        className={`text-[11px] font-pretendard-medium ${
                          member.role === "admin"
                            ? "text-accent"
                            : "text-text-secondary"
                        }`}
                      >
                        {member.role === "admin" ? "호스트" : "멤버"}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {error ? (
              <Text className="text-[13px] font-pretendard text-danger">
                {error}
              </Text>
            ) : null}

            <View className="gap-2 mt-2">
              <Text className="text-[12px] font-pretendard text-danger">
                위험 영역
              </Text>
              <Pressable
                onPress={() => setConfirmLeave(true)}
                className="rounded-lg p-4 flex-row items-center gap-2 border border-danger active:opacity-80"
              >
                <LogOut size={16} color="#B55C3E" />
                <Text className="text-[14px] font-pretendard-medium text-danger">
                  홈카페 떠나기
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <ConfirmDialog
        visible={confirmLeave}
        title="홈카페를 떠날까요?"
        message="이 홈카페의 기록·원두를 더 이상 볼 수 없어요. 마지막 호스트라면 다른 멤버에게 권한을 먼저 이전해주세요."
        confirmLabel="떠나기"
        danger
        onConfirm={onConfirmLeave}
        onCancel={() => setConfirmLeave(false)}
      />

      <InvitationSheet
        visible={invitation !== null}
        onClose={() => setInvitation(null)}
        invitation={invitation}
      />
    </BottomSheet>
  );
}

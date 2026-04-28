import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { Copy, Share2 } from "lucide-react-native";
import { Pressable, Share, Text, View } from "react-native";

import { showToast } from "../../lib/stores/toast-store";
import type { Invitation } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  invitation: Invitation | null;
}

function shortCode(uuid: string): string {
  return `BREW-${uuid.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function InvitationSheet({ visible, onClose, invitation }: Props) {
  if (!invitation) return null;
  const display = shortCode(invitation.code);
  const daysLeft = daysUntil(invitation.expiresAt);

  async function copyCode() {
    await Clipboard.setStringAsync(invitation!.code);
    showToast("복사됐어요");
  }

  async function shareCode() {
    const deepLink = Linking.createURL(`/invite/${invitation!.code}`);
    try {
      await Share.share({
        message: `홈카페에 함께 기록해요 ☕\n\n앱이 설치된 기기라면: ${deepLink}\n코드: ${invitation!.code}\n(${daysLeft}일 안에 입력해주세요)`,
      });
    } catch {
      // 공유 취소
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="가족 초대하기">
      <View className="gap-4 pt-2 pb-4">
        <Text className="text-[14px] font-pretendard text-text-secondary">
          초대 코드를 공유해 함께 기록해요
        </Text>

        <View className="bg-accent rounded-xl p-6 gap-2 items-center">
          <Text className="text-[12px] font-pretendard text-text-on-dark/70">
            초대 코드
          </Text>
          <Text
            className="text-[28px] font-pretendard-bold text-text-on-dark"
            style={{ letterSpacing: 4 }}
          >
            {display}
          </Text>
          <Text className="text-[11px] font-pretendard text-text-on-dark/70 mt-1">
            {daysLeft}일 후 만료
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={copyCode}
            className="flex-1 h-12 items-center justify-center rounded-lg bg-accent-cream flex-row gap-2 active:opacity-80"
          >
            <Copy size={16} color="#3A2419" />
            <Text className="text-[14px] font-pretendard-medium text-accent">
              코드 복사
            </Text>
          </Pressable>
          <Pressable
            onPress={shareCode}
            className="flex-1 h-12 items-center justify-center rounded-lg bg-accent flex-row gap-2 active:opacity-80"
          >
            <Share2 size={16} color="#FBF9F6" />
            <Text className="text-[14px] font-pretendard-medium text-text-on-dark">
              링크 공유
            </Text>
          </Pressable>
        </View>

        <Text className="text-[12px] font-pretendard text-text-tertiary leading-5">
          💡 초대 받은 사람이 가입 후 코드 입력 시 자동 합류
        </Text>
      </View>
    </BottomSheet>
  );
}

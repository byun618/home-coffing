import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useUpdateMe } from "../../lib/queries/me";
import { useAuthStore } from "../../lib/stores/auth-store";
import { showToast } from "../../lib/stores/toast-store";
import { BottomSheet } from "../BottomSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CafeSwitcherSheet({ visible, onClose }: Props) {
  const user = useAuthStore((state) => state.user);
  const activeCafeId = useAuthStore((state) => state.activeCafeId);
  const setActiveCafe = useAuthStore((state) => state.setActiveCafe);
  const updateMe = useUpdateMe();

  if (!user) return null;

  async function onPick(cafeId: number) {
    if (cafeId === activeCafeId) {
      onClose();
      return;
    }
    setActiveCafe(cafeId);
    try {
      await updateMe.mutateAsync({ defaultCafeId: cafeId });
      showToast("홈카페를 전환했어요");
    } catch {
      showToast("기본 홈카페 저장 실패", "error");
    }
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="홈카페 전환">
      <View className="gap-2 pt-2 pb-4">
        {user.memberships.map((membership) => {
          const isActive = membership.cafeId === activeCafeId;
          return (
            <Pressable
              key={membership.cafeId}
              onPress={() => onPick(membership.cafeId)}
              className={`bg-surface rounded-card p-4 flex-row items-center justify-between border active:opacity-80 ${
                isActive ? "border-primary" : "border-border"
              }`}
            >
              <View className="flex-1">
                <Text className="text-[15px] font-pretendard-semibold text-text-primary">
                  {membership.cafeName}
                </Text>
                <Text className="text-[11px] font-pretendard text-text-tertiary mt-0.5">
                  {membership.role === "admin" ? "호스트" : "멤버"}
                </Text>
              </View>
              {isActive ? <Check size={18} color="#5C3D2E" /> : null}
            </Pressable>
          );
        })}

        <Text className="text-[12px] font-pretendard text-text-tertiary mt-3 leading-5">
          💡 새 홈카페 추가는 다음 업데이트에서 지원될 예정이에요. 지금은
          초대 코드 입력으로만 추가할 수 있어요.
        </Text>
      </View>
    </BottomSheet>
  );
}

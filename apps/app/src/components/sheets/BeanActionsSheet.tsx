import { Archive, Pencil, Coffee, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import type { Bean } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  bean: Bean;
  onEdit: () => void;
  onMarkConsumed: () => void;
  onMarkDiscarded: () => void;
  onArchive: () => void;
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

function ActionRow({ icon, label, onPress, danger }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-2 py-3.5 rounded-btn active:bg-primary-subtle"
    >
      {icon}
      <Text
        className={`text-[15px] font-pretendard-medium ${
          danger ? "text-danger" : "text-text-primary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function BeanActionsSheet({
  visible,
  onClose,
  onEdit,
  onMarkConsumed,
  onMarkDiscarded,
  onArchive,
}: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="원두 관리">
      <View className="gap-1 pt-2 pb-4">
        <ActionRow
          icon={<Pencil size={18} color="#1A1A1A" />}
          label="수정"
          onPress={onEdit}
        />
        <ActionRow
          icon={<Coffee size={18} color="#1A1A1A" />}
          label="다 썼어요"
          onPress={onMarkConsumed}
        />
        <ActionRow
          icon={<Trash2 size={18} color="#E54D2E" />}
          label="버렸어요"
          onPress={onMarkDiscarded}
          danger
        />
        <ActionRow
          icon={<Archive size={18} color="#1A1A1A" />}
          label="보관함으로"
          onPress={onArchive}
        />
      </View>
    </BottomSheet>
  );
}

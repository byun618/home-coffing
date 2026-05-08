import { Check, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { useEquipments } from "../../lib/queries/equipments";
import type { EquipmentResponse, EquipmentType } from "../../lib/types";
import { BottomSheet } from "../BottomSheet";
import { EquipmentRegisterSheet } from "./EquipmentRegisterSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedIds: number[];
  onPick: (equipment: EquipmentResponse) => void;
}

type Filter = "all" | EquipmentType;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "전체" },
  { value: "grinder", label: "그라인더" },
  { value: "brewer", label: "드리퍼" },
  { value: "kettle", label: "케틀" },
  { value: "scale", label: "저울" },
];

function typeLabel(type: EquipmentType): string {
  switch (type) {
    case "grinder":
      return "그라인더";
    case "brewer":
      return "드리퍼";
    case "kettle":
      return "케틀";
    case "scale":
      return "저울";
  }
}

export function EquipmentPickerSheet({
  visible,
  onClose,
  selectedIds,
  onPick,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [registerOpen, setRegisterOpen] = useState(false);

  const equipmentsQuery = useEquipments(
    filter === "all" ? undefined : filter,
  );
  const equipments = equipmentsQuery.data ?? [];
  const selectedSet = new Set(selectedIds);

  const defaultRegisterType: EquipmentType =
    filter === "all" ? "brewer" : filter;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="장비 선택">
      <View className="gap-3 pt-2 pb-2">
        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
          {FILTERS.map((f) => {
            const selected = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => setFilter(f.value)}
                className={`active:opacity-80 ${
                  selected ? "bg-accent" : "bg-bg-secondary"
                }`}
                style={{
                  paddingHorizontal: 14,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  className={`text-[12px] font-pretendard-medium ${
                    selected ? "text-text-on-dark" : "text-text-secondary"
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-2">
          {equipments.length === 0 && !equipmentsQuery.isLoading ? (
            <Text className="text-[13px] font-pretendard text-text-tertiary py-4 text-center">
              등록된 장비가 없어요
            </Text>
          ) : null}
          {equipments.map((eq) => {
            const isSelected = selectedSet.has(eq.id);
            return (
              <Pressable
                key={eq.id}
                disabled={isSelected}
                onPress={() => {
                  onPick(eq);
                }}
                className={`bg-bg-secondary border border-divider flex-row items-center ${
                  isSelected ? "opacity-50" : "active:opacity-80"
                }`}
                style={{
                  borderRadius: 14,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View className="flex-1" style={{ gap: 2 }}>
                  <Text className="text-[14px] font-pretendard-semibold text-text-primary">
                    {eq.name}
                  </Text>
                  <Text className="text-[12px] font-pretendard text-text-secondary">
                    {typeLabel(eq.type)}
                    {eq.brand ? ` · ${eq.brand}` : ""}
                    {eq.model ? ` ${eq.model}` : ""}
                  </Text>
                </View>
                {isSelected ? (
                  <Check size={16} color="#3A2419" />
                ) : null}
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setRegisterOpen(true)}
            className="bg-bg-secondary items-center justify-center active:opacity-80"
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#A89A8C",
              paddingVertical: 16,
              flexDirection: "row",
              gap: 6,
            }}
          >
            <Plus size={16} color="#3A2419" />
            <Text className="text-[13px] font-pretendard-semibold text-accent">
              새 장비 등록
            </Text>
          </Pressable>
        </View>
      </View>

      <EquipmentRegisterSheet
        visible={registerOpen}
        onClose={() => setRegisterOpen(false)}
        defaultType={defaultRegisterType}
        onCreated={(equipment) => {
          setRegisterOpen(false);
          onPick(equipment);
        }}
      />
    </BottomSheet>
  );
}

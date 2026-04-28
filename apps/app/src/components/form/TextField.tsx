import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { forwardRef, useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

import { useInSheet } from "../BottomSheet";

interface Props extends Omit<TextInputProps, "className"> {
  label: string;
  hint?: string;
}

/**
 * TextField — design-system §6.2
 * - bg-bg-secondary, height 56, radius lg(14), padding [0, 18]
 * - 라벨 13/600 text-secondary 위쪽, gap 8
 * - focus 시 border accent 1px
 * - 시트 안에서는 BottomSheetTextInput 사용 (gorhom 키보드 핸들링)
 */
export const TextField = forwardRef<TextInput, Props>(
  ({ label, hint, multiline, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const inSheet = useInSheet();
    const InputComponent: typeof TextInput = inSheet
      ? (BottomSheetTextInput as unknown as typeof TextInput)
      : TextInput;

    return (
      <View style={{ gap: 8 }}>
        <Text className="text-[13px] font-pretendard-semibold text-text-secondary">
          {label}
        </Text>
        <View
          className="bg-bg-secondary"
          style={{
            borderRadius: 14,
            paddingHorizontal: 18,
            minHeight: 56,
            justifyContent: "center",
            paddingVertical: multiline ? 14 : 0,
            borderWidth: 1,
            borderColor: focused ? "#3A2419" : "transparent",
          }}
        >
          <InputComponent
            ref={ref}
            placeholderTextColor="#A89A8C"
            multiline={multiline}
            style={{
              fontFamily: "Pretendard-Regular",
              fontSize: 15,
              color: "#2A1F18",
              padding: 0,
              minHeight: multiline ? 60 : 24,
              textAlignVertical: multiline ? "top" : "center",
            }}
            {...rest}
            onFocus={(e) => {
              setFocused(true);
              rest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              rest.onBlur?.(e);
            }}
          />
        </View>
        {hint ? (
          <Text className="text-[11px] font-pretendard text-text-tertiary">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  },
);
TextField.displayName = "TextField";

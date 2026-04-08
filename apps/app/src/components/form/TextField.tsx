import { forwardRef, useState } from "react";
import { Text, TextInput, type TextInputProps, View } from "react-native";

interface Props extends Omit<TextInputProps, "className"> {
  label: string;
}

export const TextField = forwardRef<TextInput, Props>(
  ({ label, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <View className="gap-1.5">
        <Text className="text-[13px] font-pretendard-medium text-text-secondary">
          {label}
        </Text>
        <TextInput
          ref={ref}
          placeholderTextColor="#BBBBBB"
          className={`h-12 rounded-input px-3 text-[15px] font-pretendard text-text-primary border ${
            focused ? "border-primary" : "border-border"
          }`}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </View>
    );
  },
);
TextField.displayName = "TextField";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Background
        bg: {
          primary: "#FBF9F6",
          secondary: "#F5EFE7",
          tertiary: "#E8DFD2",
          overlay: "#1A0F08CC",
        },
        // Text
        text: {
          primary: "#2A1F18",
          secondary: "#7B6A5C",
          tertiary: "#A89A8C",
          "on-dark": "#FBF9F6",
        },
        // Accent
        accent: {
          DEFAULT: "#3A2419",
          light: "#8B6F5C",
          cream: "#D9C5B0",
        },
        // Status
        success: "#7A8B5F",
        warning: "#D49A6A",
        danger: "#B55C3E",
        info: "#8B6F5C",
        // Divider / Border
        divider: "#E8DFD2",
        // Member avatar palette
        member: {
          self: "#3A2419",
          wife: "#8B6F5C",
        },
      },
      fontFamily: {
        pretendard: ["Pretendard-Regular"],
        "pretendard-medium": ["Pretendard-Medium"],
        "pretendard-semibold": ["Pretendard-SemiBold"],
        "pretendard-bold": ["Pretendard-Bold"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "14px",
        xl: "16px",
        "2xl": "18px",
        "3xl": "20px",
        sheet: "24px",
        pill: "36px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#F2EDE8",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#5C3D2E",
          light: "#8B6F5E",
          subtle: "#F5F0EB",
        },
        text: {
          primary: "#1A1A1A",
          secondary: "#8C8C8C",
          tertiary: "#BBBBBB",
        },
        border: "#EEEEEE",
        danger: {
          DEFAULT: "#E54D2E",
          subtle: "#FFF0ED",
        },
        success: {
          DEFAULT: "#4A9E6B",
          subtle: "#EDF7F0",
        },
      },
      fontFamily: {
        pretendard: ["Pretendard-Regular"],
        "pretendard-medium": ["Pretendard-Medium"],
        "pretendard-semibold": ["Pretendard-SemiBold"],
        "pretendard-bold": ["Pretendard-Bold"],
      },
      borderRadius: {
        card: "16px",
        btn: "12px",
        input: "10px",
        pill: "20px",
        modal: "24px",
      },
    },
  },
  plugins: [],
};

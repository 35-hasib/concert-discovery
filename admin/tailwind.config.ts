import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#09090c",
          900: "#101014",
          850: "#15151b",
          800: "#1c1c24",
          700: "#2a2a35",
          600: "#3d3d4b",
        },
        ember: {
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#fec9aa",
          300: "#fd9f6f",
          400: "#fb6a32",
          500: "#f24a0c",
          600: "#e33a05",
          700: "#bc2a08",
          800: "#95230e",
          900: "#78200f",
        },
        sand: {
          50: "#faf8f5",
          100: "#f3efe8",
          200: "#e8e1d5",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(9,9,12,0.06), 0 12px 32px -12px rgba(9,9,12,0.25)",
        lift: "0 24px 60px -24px rgba(9,9,12,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [typography],
};

export default config;

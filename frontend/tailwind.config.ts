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
          50: "#eaf7fc",
          100: "#d1eff9",
          200: "#a8e1f3",
          300: "#6ecce9",
          400: "#38b4dc",
          500: "#1791c7",
          600: "#127794",
          700: "#11647f",
          800: "#12526a",
          900: "#12465b",
        },
        sand: {
          50: "#f7f7f7",
          100: "#f0f0f0",
          200: "#e5e5e5",
        },
      },
      fontFamily: {
        sans: ["var(--font-pt-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "ui-sans-serif", "system-ui", "sans-serif"],
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

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sena: {
          green: "#39a900",
          "green-light": "#4ade80",
          glow: "rgba(57, 169, 0, 0.35)",
        },
        surface: {
          DEFAULT: "#0c0e14",
          elevated: "#11131a",
          hover: "#181b24",
          active: "#1e2230",
          input: "#0a0c12",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.04)",
          DEFAULT: "rgba(255, 255, 255, 0.07)",
          hover: "rgba(255, 255, 255, 0.14)",
          accent: "rgba(74, 222, 128, 0.25)",
        },
      },
      fontFamily: {
        mono: ["SF Mono", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-glow": "pulse-glow 2.5s ease-in-out infinite",
        "gradient-shift": "gradient-shift 6s ease infinite",
        "scan-pulse": "scan-pulse 1.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out",
        "scale-in": "scale-in 0.35s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        float: "float 4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(57, 169, 0, 0.35)" },
          "50%": { boxShadow: "0 0 40px rgba(57, 169, 0, 0.35), 0 0 60px rgba(57, 169, 0, 0.35)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "scan-pulse": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

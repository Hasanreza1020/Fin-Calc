import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--c-ink)",
        char: "var(--c-char)",
        slate: "var(--c-slate)",
        surface: "var(--c-surface)",
        border: "var(--c-border)",
        muted: "var(--c-muted)",
        subtle: "var(--c-subtle)",
        secondary: "var(--c-secondary)",
        divider: "var(--c-divider)",
        paper: "var(--c-paper)",
        white: "var(--c-white)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06)",
        focus: "0 0 0 2px var(--c-white)",
      },
      borderRadius: {
        DEFAULT: "6px",
        lg: "10px",
        xl: "14px",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 120ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;

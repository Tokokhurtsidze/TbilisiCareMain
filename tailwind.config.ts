import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--surface-base)",
          elevated: "var(--surface-elevated)",
          subtle: "var(--surface-subtle)",
        },
        brand: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          soft: "var(--primary-soft)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        line: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--error)",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Georgian", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,20,38,0.04), 0 4px 12px rgba(11,20,38,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;

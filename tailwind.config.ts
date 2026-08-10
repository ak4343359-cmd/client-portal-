import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Hanken Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // New light design system
        "deep-navy": "#002147",
        "vibrant-blue": "#005EB8",
        "slate-gray": "#4A5568",
        background: "#f9f9f9",
        canvas: "#F2F8FD",
        surface: "#f9f9f9",
        "surface-bright": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f4",
        "surface-container": "#eeeeee",
        "surface-container-high": "#e8e8e8",
        "surface-variant": "#e2e2e2",
        "primary-container": "#002147",
        "on-primary": "#ffffff",
        "on-primary-container": "#708ab5",
        "on-primary-fixed-variant": "#2d476f",
        secondary: "#005db6",
        "on-secondary": "#ffffff",
        "outline-variant": "#c4c6cf",
        outline: "#74777f",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;

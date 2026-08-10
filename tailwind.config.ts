import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      colors: {
        ink: "#0b0f14",
        panel: "#121822",
        panel2: "#0f141c",
        edge: "#1e2733",
        brand: "#2dd4bf",
        brand2: "#22d3ee",
      },
    },
  },
  plugins: [],
};
export default config;

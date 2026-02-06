import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f8ff",
          100: "#d9ebff",
          200: "#b6d9ff",
          300: "#7dbdff",
          400: "#3ea1ff",
          500: "#1486ff",
          600: "#0066db",
          700: "#0151b0",
          800: "#06458f",
          900: "#0b3a76"
        }
      }
    }
  },
  plugins: []
};

export default config;

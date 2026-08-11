import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe9ff",
          200: "#b8d3ff",
          300: "#8ab7ff",
          400: "#5793ff",
          500: "#2f6bff",
          600: "#1c4cf5",
          700: "#1a3dd1",
          800: "#1a34a8",
          900: "#1a2f85",
        },
        ink: {
          50: "#eef1f8",
          100: "#dde2ee",
          200: "#b3bcd4",
          300: "#8590ac",
          400: "#5d6885",
          500: "#3d4763",
          600: "#2a3350",
          700: "#1c2440",
          800: "#131a30",
          850: "#101526",
          900: "#0b0f1e",
          950: "#070a14",
        },
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #2f6bff 0%, #22d3ee 100%)",
        "card-glow": "radial-gradient(120% 120% at 0% 0%, rgba(47,107,255,0.12) 0%, rgba(255,255,255,0) 60%)",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(47,107,255,0.4), 0 8px 24px -8px rgba(47,107,255,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;

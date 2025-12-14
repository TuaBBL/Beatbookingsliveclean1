import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neon-green": "#39ff14",
        "neon-red": "#ff2d2d",
        charcoal: "#1a1a1a",
      },

      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
        "marquee-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-right": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },

      animation: {
        wave: "wave 1.4s ease-in-out infinite",
        "marquee-left": "marquee-left 45s linear infinite",
        "marquee-right": "marquee-right 45s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

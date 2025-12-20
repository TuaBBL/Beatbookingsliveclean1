import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "neon-green": "#00ff88",
        "neon-red": "#ff2b2b",
        charcoal: "#1a1a1a",
      },

      boxShadow: {
        "neon-green": "0 0 30px rgba(0, 255, 136, 0.4)",
        "neon-green-lg": "0 0 50px rgba(0, 255, 136, 0.6)",
        "neon-red": "0 0 30px rgba(255, 43, 43, 0.4)",
        "neon-red-lg": "0 0 50px rgba(255, 43, 43, 0.6)",
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
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 136, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 255, 136, 0.6)" },
        },
      },

      animation: {
        wave: "wave 1.4s ease-in-out infinite",
        "marquee-left": "marquee-left 45s linear infinite",
        "marquee-right": "marquee-right 45s linear infinite",
        pulse: "pulse 2s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

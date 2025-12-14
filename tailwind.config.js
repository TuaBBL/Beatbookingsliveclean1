/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39ff14',
        'neon-red': '#ff2d2d',
        'charcoal': '#1a1a1a',
        @keyframes wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

.animate-wave {
  animation: wave 1.4s ease-in-out infinite;
}

@keyframes marquee-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes marquee-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

.animate-marquee-left {
  animation: marquee-left 45s linear infinite;
}

.animate-marquee-right {
  animation: marquee-right 45s linear infinite;
}
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39ff14',
        'neon-red': '#ff2d2d',
        'charcoal': '#1a1a1a',
      },
    },
  },
  plugins: [],
};

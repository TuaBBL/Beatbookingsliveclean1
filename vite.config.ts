import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [
        /supabase\/functions/,
      ],
    },
  },
  server: {
    fs: {
      deny: [
        '**/supabase/functions/**',
      ],
    },
  },
});

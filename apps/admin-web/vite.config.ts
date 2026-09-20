import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // 5173 mijoz ilovasiniki — panel unga xalaqit bermasligi kerak.
  server: { port: 5174, strictPort: true },
  preview: { port: 5174, strictPort: true },
});

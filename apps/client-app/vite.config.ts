import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      // Gradle build vaqtida android/ ichida minglab fayl o'zgaradi va
      // dev server sahifani beto'xtov qayta yuklaydi — kuzatuvdan chiqaramiz.
      ignored: ['**/android/**', '**/ios/**'],
    },
  },
});

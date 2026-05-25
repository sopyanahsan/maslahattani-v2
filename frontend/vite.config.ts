import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
  },

  preview: {
    port: 3000,
    host: '0.0.0.0',
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils-vendor': ['axios', '@vueuse/core', '@tanstack/vue-query'],
          'form-vendor': ['vee-validate', '@vee-validate/zod', 'zod'],
        },
      },
    },
  },
});

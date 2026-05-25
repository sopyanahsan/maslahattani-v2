import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

// Multi-entry build:
// - / (root)             → admin panel  → dist/index.html
// - /webapp/             → kasir webapp → dist/webapp/index.html
//
// Deployment via nginx:
//   admin.maslahattani.my.id → root /
//   maslahattani.my.id       → /webapp/index.html (try_files fallback)
//
// Both bundles share src/shared/* → split into common chunks for cache reuse.
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    host: '0.0.0.0',
    open: false,
  },

  preview: {
    port: 5173,
    host: '0.0.0.0',
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        // Admin panel entry — output: dist/index.html
        main: resolve(__dirname, 'index.html'),
        // Webapp kasir entry — output: dist/webapp/index.html
        webapp: resolve(__dirname, 'webapp/index.html'),
      },
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

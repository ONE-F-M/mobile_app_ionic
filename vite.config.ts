import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    // Only enable PWA in production builds
    ...(process.env.NODE_ENV === 'production' ? [VitePWA({ registerType: 'autoUpdate' })] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Suppress the "Some chunks are larger than 500 kB" warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate heavy vendor libraries into independently-cached chunks.
          // Note: We deliberately leave Ionic out of this so its internal lazy-loading doesn't break.
          'vendor': ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
          'v-calendar': ['v-calendar'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
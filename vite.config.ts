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
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate heavy vendor libraries into independently-cached chunks.
          // Each chunk is only re-downloaded when its specific dependency version changes.
          'ionic-core': ['@ionic/vue', '@ionic/vue-router'],
          'vendor': ['vue', 'vue-router', 'pinia', 'axios', 'dayjs'],
          // Note: firebase is already dynamically imported via await import() — no chunk needed
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

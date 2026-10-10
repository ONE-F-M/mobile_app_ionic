import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { rmSync } from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';

// Set by `yarn build:native`; --mode stays free to pick the .env file.
const isNative = process.env.CAP_NATIVE === '1' || process.env.CAP_NATIVE === 'true'

const WEB_ONLY_PUBLIC_FILES = ['firebase-messaging-sw.js', 'sw-env.js']

const removeWebOnlyAssets = () => ({
  name: 'remove-web-only-assets',
  apply: 'build' as const,
  closeBundle() {
    if (!isNative) return
    for (const file of WEB_ONLY_PUBLIC_FILES) {
      rmSync(path.resolve(__dirname, 'dist', file), { force: true })
    }
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy(),
    ...(process.env.NODE_ENV === 'production' && !isNative ? [VitePWA({ registerType: 'autoUpdate' })] : []),
    ...(isNative ? [removeWebOnlyAssets()] : [])
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

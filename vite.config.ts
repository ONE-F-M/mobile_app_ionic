import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import { readFileSync, rmSync } from 'fs'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa';
import { writeSwEnv } from './swEnvBuild.js';

// Set by `yarn build:native`; --mode stays free to pick the .env file.
const isNative = process.env.CAP_NATIVE === '1' || process.env.CAP_NATIVE === 'true'

const appVersion = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version
// Source maps are built and uploaded only in CI, where the Sentry token is set.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

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
    // Writes public/sw-env.js from .env.<mode> before the build.
    {
      name: 'sw-env-build',
      apply: 'build',
      config(_config, { mode }) {
        writeSwEnv(mode)
      },
    },
    vue(),
    legacy(),
    ...(process.env.NODE_ENV === 'production' && !isNative ? [VitePWA({ registerType: 'autoUpdate' })] : []),
    ...(isNative ? [removeWebOnlyAssets()] : []),
    sentryVitePlugin({
      org: 'one-fm',
      project: 'one-fm-mobile',
      url: 'https://de.sentry.io/',
      authToken: sentryAuthToken,
      disable: !sentryAuthToken,
      release: { name: `one-fm-mobile@${appVersion}` },
      sourcemaps: { filesToDeleteAfterUpload: ['dist/**/*.map'] },
      telemetry: false,
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  preview: {
    allowedHosts: ['mobile-staging.one-fm.com'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Suppress the "Some chunks are larger than 500 kB" warning
    chunkSizeWarningLimit: 1000,
    sourcemap: sentryAuthToken ? 'hidden' : false,
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

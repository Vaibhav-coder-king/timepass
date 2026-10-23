import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // ── Code splitting ─────────────────────────────────────────────────────────
    // Addresses Vite chunk-size warning (was 948KB monolith).
    // Each async import() in App.tsx becomes its own chunk automatically.
    // Manual chunks for large stable vendor libraries kept in long-lived cache.
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Recharts + d3 → separate vendor chunk (large, rarely changes)
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'vendor-charts';
          }
          // Framer Motion → separate chunk
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // React + react-dom + react-router → stable core chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          // Lucide icons → separate chunk (large icon set)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
    // Raise the warning threshold while code-splitting is in effect
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: true, // Listen on all network addresses for mobile Android testing
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: '/',
        name: 'COGNIVA — Cognitive Care & Memory Companion',
        short_name: 'COGNIVA',
        description: 'AI-Based Cognitive Gaming & Memory Assistance Platform for Elderly Dementia Patients in NER',
        theme_color: '#7C5CFC',
        background_color: '#FFF9F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?source=pwa',
        scope: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['medical', 'health', 'games'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Play Games',
            short_name: 'Games',
            description: 'Engage your mind with memory match & sequence games',
            url: '/games',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'Care Insights',
            short_name: 'Insights',
            description: 'View patient memory accuracy and response times',
            url: '/caregiver',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,json}'],
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})

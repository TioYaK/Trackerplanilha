import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'ads.txt', 'Instalar_Worker.ps1'],
      workbox: {
        importScripts: ['/custom-sw.js'],
        navigateFallbackDenylist: [/^\/ads\.txt/, /^\/Instalar_Worker/, /^\/api\/(v1|worker|check-maker|get-character|manage-user|reset-password|worker-config)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/ui-avatars\.com\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ui-avatars-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'image-assets-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Rubinot Tracker',
        short_name: 'RubinotTracker',
        description: 'Plataforma Global de Inteligência e Gestão de Guildas do Rubinot',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/');
          if (norm.includes('/node_modules/')) {
            if (
              norm.includes('/react/') ||
              norm.includes('/react-dom/') ||
              norm.includes('/react-is/') ||
              norm.includes('/scheduler/') ||
              norm.includes('/prop-types/')
            ) {
              return 'vendor-react';
            }
            if (norm.includes('/recharts/') || norm.includes('/victory-vendor/') || norm.includes('/d3-')) {
              return 'vendor-charts';
            }
            if (norm.includes('/@supabase/')) {
              return 'vendor-supabase';
            }
            if (norm.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (norm.includes('/jspdf/') || norm.includes('/html2canvas/')) {
              return 'vendor-pdf';
            }
            if (norm.includes('/date-fns/') || norm.includes('/canvas-confetti/')) {
              return 'vendor-utils';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 700
  }
})
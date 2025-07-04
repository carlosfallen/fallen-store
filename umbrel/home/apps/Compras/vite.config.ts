import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /.*\\.css$/,
            handler: 'StaleWhileRevalidate',
          },
          {
            urlPattern: /.*\\.js$/,
            handler: 'StaleWhileRevalidate',
          },
        ],
      },
      manifest: {
        name: 'Lista de Compras',
        short_name: 'Compras',
        description: 'Lista de compras',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/lsit.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    host: '10.0.0.146', // <- importante para aceitar conexões externas
    port: 5173, // ou outro de sua escolha
  },
});

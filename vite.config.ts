import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Minhas Finanças',
        short_name: 'Finanças',
        description: 'Controle financeiro pessoal criptografado e offline',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f1ea',
        theme_color: '#f5f1ea',
        orientation: 'portrait',
        icons: [
      { src: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png?v=3", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/icon.svg?v=3", sizes: "any", type: "image/svg+xml" }
    ]
      }
    })
  ]
});

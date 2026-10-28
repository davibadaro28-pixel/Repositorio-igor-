import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: import.meta.dirname,
  // logo, ícones e fotos ficam na pasta da loja (lojas/<loja>/public) e são servidos pelo servidor
  publicDir: false,
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
      '/img': { target: 'http://localhost:3000', changeOrigin: true },
      '/manifest.webmanifest': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});

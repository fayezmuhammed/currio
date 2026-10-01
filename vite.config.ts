import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Extension pages (popup, onboarding) and the background service worker.
 * The content script is built separately (vite.content.config.ts) because
 * Chrome loads content scripts as classic scripts, not ES modules.
 */
export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  publicDir: resolve(import.meta.dirname, 'public'),
  envDir: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    target: 'chrome116',
    modulePreload: { polyfill: false },
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'src/popup/index.html'),
        onboarding: resolve(import.meta.dirname, 'src/onboarding/index.html'),
        background: resolve(import.meta.dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
        chunkFileNames: 'assets/chunk-[hash].js',
        assetFileNames: (asset) => (asset.names[0]?.endsWith('.css') ? 'assets/app-[hash].css' : 'assets/[name]-[hash][extname]'),
      },
    },
  },
});

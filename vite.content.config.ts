import { resolve } from 'node:path';
import { defineConfig } from 'vite';

/**
 * Content script: one self-contained classic script (IIFE), no React, no
 * shared chunks. Runs after the main build, so it must not empty dist/.
 */
export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  envDir: import.meta.dirname,
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
    target: 'chrome116',
    copyPublicDir: false,
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/content/content.ts'),
      formats: ['iife'],
      name: 'CurrioContent',
      fileName: () => 'content.js',
    },
  },
});

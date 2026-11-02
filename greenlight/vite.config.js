import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5174, proxy: { '/api': 'http://localhost:3002' } },
  // "link" builds a single page that runs without a server (published as a claude.ai link).
  base: mode === 'link' ? './' : '/',
  build: mode === 'link'
    ? { outDir: 'dist-link', cssCodeSplit: false, assetsInlineLimit: 100000000, chunkSizeWarningLimit: 3000, rollupOptions: { output: { inlineDynamicImports: true } } }
    : { chunkSizeWarningLimit: 1500 },
}));

import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 5215, strictPort: true },
  preview: { host: '0.0.0.0', port: 4215, strictPort: true },
  build: { chunkSizeWarningLimit: 3000 },
});

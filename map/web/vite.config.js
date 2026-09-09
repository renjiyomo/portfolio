import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../../public/map',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
  }
});

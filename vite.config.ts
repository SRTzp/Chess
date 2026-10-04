import { defineConfig } from 'vite';
export default defineConfig({ root: 'shrine', base: '/shrine/', build: { outDir: '../dist/shrine', emptyOutDir: true }, server: { port: 4174, strictPort: true } });

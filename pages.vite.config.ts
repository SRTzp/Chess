import {defineConfig} from 'vite';

// Relative URLs support both username.github.io and repository subpaths.
export default defineConfig({
  root: 'chapter',
  base: './',
  build: {outDir: '../pages-dist', emptyOutDir: true},
});

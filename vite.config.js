import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
  outDir: 'dist/public',
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.js'),
      },
    },
  },
  publicDir: 'public',
});

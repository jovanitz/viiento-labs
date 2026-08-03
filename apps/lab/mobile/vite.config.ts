import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/lab-mobile',
  server: { port: 4400, host: 'localhost' },
  plugins: [react(), tsconfigPaths()],
  build: { outDir: '../../../dist/apps/lab-mobile', emptyOutDir: true },
});

/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/lab-client',
  server: { port: 4202, host: 'localhost' },
  plugins: [react(), tsconfigPaths()],
  build: { outDir: '../../../dist/apps/lab-client', emptyOutDir: true },
});

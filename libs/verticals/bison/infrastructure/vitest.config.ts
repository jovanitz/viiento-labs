import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    // Postgres specs share the one local database with every other lib's
    // postgres specs; the advisory lock serializes across processes, and
    // serial files avoid racing wipes within this project.
    fileParallelism: false,
  },
});

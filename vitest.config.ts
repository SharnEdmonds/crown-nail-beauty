import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    // Skip files that import 'server-only' — they're not unit-testable in isolation
    // because the package throws when imported outside Next's server context.
    // Wrap server-only code under tests by importing only the pure helpers.
  },
});

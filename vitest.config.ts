import { defineConfig } from 'vitest/config';
import packageJson from './package.json';

export default defineConfig({
  // Read from package.json like tsup does, so the version cannot drift between
  // the build and the tests after a release bump.
  define: { __FORGEDIALOG_VERSION__: JSON.stringify(packageJson.version) },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/*-entry.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 80,
      },
    },
  },
});

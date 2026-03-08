import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.js'],
    exclude: ['src/browser/_unused/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/browser/js/**/*.js'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.js',
        'src/**/index.ts',
        'src/browser/_unused/**',
      ],
    },
  },
});

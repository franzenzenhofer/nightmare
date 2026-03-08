import { defineConfig } from '@playwright/test';

const API_PORT = 6660;
const BASE_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.test.ts',
  timeout: 30_000,
  retries: 1,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: 'npx nw src/ --headless',
    port: API_PORT,
    timeout: 15_000,
    reuseExistingServer: !process.env['CI'],
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    actionTimeout: 15000,
    navigationTimeout: 15000,
  },
  webServer: [
    {
      command: 'npm run start --prefix server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        JWT_SECRET: process.env.JWT_SECRET ?? 'local-dev-secret',
        PORT: '3001',
      },
    },
    {
      command: 'npm run dev --prefix client',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

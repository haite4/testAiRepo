import { test, expect, request } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const USERNAME = 'test';
const PASSWORD = 'test1234';
const CHANNEL_DISPLAY_NAME = 'Playwright channel test';
const CHANNEL_ID = '@channelTestForTheFirstLink';
const BOT_TOKEN = process.env.TEST_BOT_TOKEN ?? '';

test('send message to Telegram channel', async ({ page }) => {
  test.skip(!BOT_TOKEN, 'TEST_BOT_TOKEN secret is not configured — skipping E2E test');

  // 1. Ensure test user exists (register; ignore "already exists" errors)
  const apiContext = await request.newContext();
  await apiContext.post(`${API_URL}/api/auth/register`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  await apiContext.dispose();

  // 2. Open login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // 3. Login if on login page
  if (page.url().includes('/login')) {
    await page.locator('input[placeholder="Enter username"]').fill(USERNAME);
    await page.locator('input[placeholder="Enter password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/dashboard`);
  }

  // 4. Connect a channel if none exist
  await expect(page.locator('h2', { hasText: 'Channels' })).toBeVisible();
  const channelList = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Remove' }) });
  const channelCount = await channelList.count();

  if (channelCount === 0) {
    await page.getByRole('button', { name: '+ Connect' }).click();
    await page.locator('input[placeholder="e.g. My News Channel"]').fill(CHANNEL_DISPLAY_NAME);
    await page.locator('input[placeholder="@mychannel or -1001234567890"]').fill(CHANNEL_ID);
    await page.locator('input[placeholder="123456789:ABC-DEF..."]').fill(BOT_TOKEN);
    await page.getByRole('button', { name: 'Connect Channel' }).click();
    await expect(channelList.first()).toBeVisible();
  }

  // 5. Select the first available channel
  await channelList.first().click();
  await expect(page.getByText(/\d+ channel selected/)).toBeVisible();

  // 6. Compose and send message
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  const message = `Playwright test ${randomNumber}`;
  await page.locator('textarea').fill(message);
  await page.getByRole('button', { name: /Send to \d+ channel/ }).click();

  // 7. Verify message was sent successfully
  await expect(page.getByText('Send Results')).toBeVisible();
  await expect(page.getByText(/Sent successfully/)).toBeVisible();
});

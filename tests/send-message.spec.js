import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const USERNAME = 'test';
const PASSWORD = 'test1234';
const CHANNEL_DISPLAY_NAME = 'Playwright channel test';
const CHANNEL_ID = '@channelTestForTheFirstLink';
const BOT_TOKEN = process.env.TEST_BOT_TOKEN ?? '';

test('send message to Telegram channel', async ({ page }) => {
  // 1. Open dashboard page — navigate directly to /login then redirect
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // 2. Login if on login page
  if (page.url().includes('/login')) {
    await page.locator('input[placeholder="Enter username"]').fill(USERNAME);
    await page.locator('input[placeholder="Enter password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${BASE_URL}/dashboard`);
  }

  // 3. Connect a channel if none exist
  await expect(page.locator('h2', { hasText: 'Channels' })).toBeVisible();
  const channelList = page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'Remove' }) });
  const channelCount = await channelList.count();

  if (channelCount === 0) {
    // 4–7. Connect new channel
    await page.getByRole('button', { name: '+ Connect' }).click();
    await page.locator('input[placeholder="e.g. My News Channel"]').fill(CHANNEL_DISPLAY_NAME);
    await page.locator('input[placeholder="@mychannel or -1001234567890"]').fill(CHANNEL_ID);
    await page.locator('input[placeholder="123456789:ABC-DEF..."]').fill(BOT_TOKEN);
    await page.getByRole('button', { name: 'Connect Channel' }).click();
    await expect(channelList.first()).toBeVisible();
  }

  // 8. Select the first available channel
  await channelList.first().click();
  await expect(page.getByText(/\d+ channel selected/)).toBeVisible();

  // Write "Playwright test <random number>" in Compose Message
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  const message = `Playwright test ${randomNumber}`;
  await page.locator('textarea').fill(message);

  // 9. Click Send to channel
  await page.getByRole('button', { name: /Send to \d+ channel/ }).click();

  // 10. Verify message was sent successfully
  await expect(page.getByText('Send Results')).toBeVisible();
  await expect(page.getByText(/Sent successfully/)).toBeVisible();
});

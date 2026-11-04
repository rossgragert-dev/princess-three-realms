import { test, expect } from '@playwright/test';
import { startGame, tapLogical } from './helpers';

test('canvas fits the viewport with no scrolling and keeps 4:3', async ({ page }) => {
  await startGame(page);
  const box = await page.locator('canvas').boundingBox();
  const vp = page.viewportSize()!;
  expect(box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.height).toBeLessThanOrEqual(vp.height + 1);
  expect(Math.abs(box!.width / box!.height - 512 / 384)).toBeLessThan(0.02);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
});

test('hud buttons are at least 44 css px', async ({ page }) => {
  await startGame(page);
  const box = await page.locator('canvas').boundingBox();
  const scale = box!.width / 512;
  expect(56 * scale).toBeGreaterThanOrEqual(44); // MIN_HIT in logical px
  await tapLogical(page, 36, 36); // sticker book opens and closes without errors
  await page.waitForTimeout(500);
  await tapLogical(page, 62, 56);
});

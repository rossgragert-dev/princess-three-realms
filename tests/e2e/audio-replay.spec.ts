import { test, expect } from '@playwright/test';
import { ptr, startGame, tapLogical } from './helpers';

/** Until recorded clips exist every line reports "missing"; this checks the replay button stays safe and the panel never auto-skips. */
test('replay button re-speaks and a missing clip waits for the arrow', async ({ page }) => {
  await startGame(page);
  await ptr(page, 'tapObject', 'pip');
  await page.waitForTimeout(2500);
  expect(await ptr<boolean>(page, 'modal')).toBe(true);
  await tapLogical(page, 424, 328); // replay
  await page.waitForTimeout(500);
  expect(await ptr<boolean>(page, 'modal')).toBe(true);
});

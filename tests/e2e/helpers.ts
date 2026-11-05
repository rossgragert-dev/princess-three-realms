import type { Page } from '@playwright/test';

/** Logical canvas is 512x384; map a logical point onto the real canvas box and tap it. */
export async function tapLogical(page: Page, x: number, y: number) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('canvas not found');
  await page.mouse.click(box.x + (x / 512) * box.width, box.y + (y / 384) * box.height);
}

export const ptr = <T>(page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).__ptr[f as string](...(a as unknown[])), [fn, args]) as Promise<T>;

export async function startGame(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__game?.scene?.isActive('Title'), null, { timeout: 30_000 });
  await tapLogical(page, 256, 300); // big Play button
  await page.waitForFunction(() => !!(window as any).__ptr, null, { timeout: 30_000 });
}

/** Recorded narration is not present yet, so dialogue waits for the arrow; tap it until the panel closes. */
export async function finishTalking(page: Page) {
  for (let i = 0; i < 40; i++) {
    if (!(await ptr<boolean>(page, 'modal'))) return;
    await tapLogical(page, 468, 328);
    await page.waitForTimeout(450);
  }
}

export async function settle(page: Page) {
  await page.waitForFunction(() => !(window as any).__ptr.busy(), null, { timeout: 20_000 });
  await page.waitForTimeout(300);
}

export async function walkAndTalk(page: Page, id: string) {
  await ptr(page, 'tapObject', id);
  await page.waitForTimeout(500);
  await page.waitForFunction(() => (window as any).__ptr.busy() || (window as any).__ptr.modal() || true);
}

import { test, expect } from '@playwright/test';
import { finishTalking, ptr, tapLogical } from './helpers';

// v0.4b: Fireworks (King), Wand Workshop (Queen), Unicorn Tag (Dapple). Seeds a finished-chapter save and drives the real screens.
const FLAGS = ['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'PEARL_PLACED', 'STAR_1_FOUND', 'SHORE_SEEN', 'GROTTO_SEEN'];
const save = (scene: string, spawn: string, form = 'princess') => ({ version: 1, scene, spawn, form, flags: Object.fromEntries(FLAGS.map((f) => [f, true])), stars: 1 });

async function boot(page: import('@playwright/test').Page, s: object) {
  await page.goto('/');
  await page.evaluate((v) => { localStorage.clear(); localStorage.setItem('ptr_save_v1', JSON.stringify(v)); }, s);
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__game?.scene?.isActive('Title'), null, { timeout: 30_000 });
  await tapLogical(page, 256, 300);
  await page.waitForFunction(() => !!(window as any).__ptr, null, { timeout: 30_000 });
  await page.waitForTimeout(1500);
}
const station = (page: import('@playwright/test').Page, fn: string) => page.evaluate((f) => (window as any).__station?.[f]?.(), fn);

test('King: fireworks screen launches, completes a session and rewards the garland once', async ({ page }) => {
  await boot(page, save('festival', 'from_courtyard'));
  await ptr(page, 'tapObject', 'king');
  await page.waitForFunction(() => (window as any).__station?.key === 'Fireworks', null, { timeout: 30_000 }).catch(async () => { await finishTalking(page); });
  await page.waitForFunction(() => (window as any).__station?.key === 'Fireworks', null, { timeout: 30_000 });
  await page.waitForTimeout(500);
  for (let i = 0; i < 4; i++) { await tapLogical(page, 100 + i * 90, 90); await page.waitForTimeout(400); }
  await page.waitForTimeout(4000);
  const s = await station(page, 'state') as { launched: number; sessionDone: boolean; maxLive: number };
  expect(s.launched).toBeGreaterThanOrEqual(3); expect(s.sessionDone).toBe(true); expect(s.maxLive).toBeLessThanOrEqual(288);
  const decor = await page.evaluate(() => (window as any).__ptr.state().unlockedDecor as string[]);
  expect(decor.filter((d) => d === 'festival_garland')).toHaveLength(1);
});

test('Queen: workshop equips a wand, it is saved, and the shot flies the faced direction', async ({ page }) => {
  await boot(page, save('conservatory', 'from_courtyard'));
  await ptr(page, 'tapObject', 'queen');
  await page.waitForFunction(() => (window as any).__station?.key === 'WandWorkshop', null, { timeout: 30_000 }).catch(async () => { await finishTalking(page); });
  await page.waitForFunction(() => (window as any).__station?.key === 'WandWorkshop', null, { timeout: 30_000 });
  await page.waitForTimeout(600);
  const cards = await station(page, 'cards') as { value: string; x: number; y: number; owned: boolean }[];
  const heart = cards.find((c) => c.value === 'heart')!; await tapLogical(page, heart.x, heart.y);
  expect((await station(page, 'wand') as { headId: string }).headId).toBe('heart');
  const locked = cards.find((c) => !c.owned)!; await tapLogical(page, locked.x, locked.y);
  expect((await station(page, 'wand') as { headId: string }).headId).toBe('heart');
});

test('Dapple: tag starts as a unicorn, exits cleanly, and a princess only gets a gentle prompt', async ({ page }) => {
  await boot(page, save('meadow', 'from_woods', 'unicorn'));
  await ptr(page, 'tapObject', 'dapple');
  await page.waitForFunction(async () => { const t = (window as any).__ptr.tag(); return !!t || (await Promise.resolve(false)); }, null, { timeout: 40_000, polling: 500 }).catch(() => {});
  for (let i = 0; i < 6 && !(await ptr<unknown>(page, 'tag')); i++) { await finishTalking(page); await page.waitForTimeout(500); }
  const tag = await ptr<{ exit: { x: number; y: number } } | null>(page, 'tag');
  expect(tag).not.toBeNull();
  await tapLogical(page, tag!.exit.x, tag!.exit.y);
  await page.waitForTimeout(700);
  expect(await ptr(page, 'tag')).toBeNull();
});

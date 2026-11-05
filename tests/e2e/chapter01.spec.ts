import { test, expect } from '@playwright/test';
import { finishTalking, ptr, settle, startGame, tapLogical } from './helpers';

/**
 * Full Chapter 1 acceptance walk-through (not runnable in the authoring sandbox; the same flow is covered by tools/local-verify/chapter.mjs in real Chrome). Written against window.__ptr (WorldScene.debugHook).
 * Wrong answers carry no penalty, so choice puzzles are solved by trying each card in turn.
 */
const flag = (page: any, f: string) => page.evaluate((k: string) => !!(window as any).__ptr.state().flags[k], f);
const until = (page: any, f: string, ms = 40_000) => page.waitForFunction((k: string) => !!(window as any).__ptr.state().flags[k], f, { timeout: ms });

async function talk(page: any, id: string) {
  await ptr(page, 'tapObject', id);
  // wait for either a dialogue/puzzle (modal) or the walk to finish
  await page.waitForTimeout(800);
  await finishTalking(page);
  await settle(page);
}

async function solveChoice(page: any, n: number) {
  const xs = Array.from({ length: n }, (_, i) => 256 + (i - (n - 1) / 2) * 124);
  for (const x of xs) {
    if (!(await ptr<boolean>(page, 'modal'))) return;
    await tapLogical(page, x, 214);
    await tapLogical(page, 256, 316);
    await page.waitForTimeout(1500);
  }
}

test('chapter 1: castle to bedroom lamp', async ({ page }) => {
  await startGame(page);
  expect(await ptr(page, 'scene')).toBe('courtyard');

  await talk(page, 'pip');
  await until(page, 'INTRO_DONE');
  for (const c of ['carrot_1', 'carrot_2', 'carrot_3']) { await ptr(page, 'tapObject', c); await page.waitForTimeout(2500); }
  await finishTalking(page);
  await until(page, 'PIP_CARROTS_DONE');

  await ptr(page, 'tapObject', 'warp_woods');
  await page.waitForFunction(() => (window as any).__ptr.scene() === 'woods', null, { timeout: 40_000 });

  await ptr(page, 'tapObject', 'tree');
  await page.waitForTimeout(3000);
  await finishTalking(page);
  await solveChoice(page, 3);
  await finishTalking(page);
  await until(page, 'TREE_GATE_OPEN');
  await until(page, 'WILLA_MET');

  await ptr(page, 'changeForm', 'unicorn');
  await settle(page);
  expect(await ptr(page, 'form')).toBe('unicorn');
  await ptr(page, 'tapObject', 'bridge_mark');
  await page.waitForTimeout(3000);
  await finishTalking(page);
  await tapLogical(page, 206, 252); // red
  await tapLogical(page, 306, 252); // blue
  await page.waitForTimeout(2500);
  await finishTalking(page);
  await until(page, 'RAINBOW_BRIDGE_OPEN');

  await ptr(page, 'tapObject', 'warp_shore');
  await page.waitForFunction(() => (window as any).__ptr.scene() === 'shore', null, { timeout: 60_000 });
  await ptr(page, 'tapObject', 'shimmer');
  await page.waitForFunction(() => (window as any).__ptr.form() === 'mermaid', null, { timeout: 30_000 });
  await settle(page);
  await ptr(page, 'tapObject', 'dive');
  await page.waitForFunction(() => (window as any).__ptr.scene() === 'grotto', null, { timeout: 40_000 });

  await talk(page, 'marina');
  for (const s of ['starfish_1', 'starfish_2', 'starfish_3']) { await ptr(page, 'tapObject', s); await page.waitForTimeout(3000); }
  await finishTalking(page);
  await until(page, 'MARINA_HELPED');

  for (let i = 0; i < 4; i++) { await ptr(page, 'tapObject', 'pearl'); await page.waitForTimeout(2500); await finishTalking(page); await settle(page); }
  await until(page, 'PEARL_PLACED');
  await talk(page, 'star_pedestal');
  await until(page, 'STAR_1_FOUND');

  await ptr(page, 'home');
  await page.waitForFunction(() => (window as any).__ptr.scene() === 'bedroom', null, { timeout: 40_000 });
  await page.waitForTimeout(1500);
  await finishTalking(page);
  // v0.4a.1: free decorating. Open Decorate Mode, pick the Star Lamp from the lights tab, tap a valid spot, accept, finish.
  await tapLogical(page, 156, 30);
  await page.waitForFunction(() => !!(window as any).__decor, null, { timeout: 15_000 });
  const D = <T>(f: string, ...a: unknown[]) => page.evaluate(([fn, args]) => (window as any).__decor[fn as string](...(args as unknown[])), [f, a]) as Promise<T>;
  const groups = await D<{ id: string; x: number; y: number }[]>('groups');
  const lights = groups.find((g) => g.id === 'lights')!;
  await tapLogical(page, lights.x, lights.y);
  const card = (await D<{ id: string; x: number; y: number }[]>('cards')).find((c) => c.id === 'star_lamp')!;
  await tapLogical(page, card.x, card.y);
  for (const [x, y] of [[17, 8], [16, 9], [18, 9], [14, 12], [8, 11]]) {
    const sc = await D<{ x: number; y: number }>('tileToScreen', x, y);
    await tapLogical(page, sc.x, sc.y);
    if ((await D<{ ok: boolean }>('status')).ok) break;
  }
  const btn = await D<Record<string, { x: number; y: number }>>('buttons');
  await tapLogical(page, btn.accept.x, btn.accept.y);
  await tapLogical(page, btn.done.x, btn.done.y);
  await page.waitForTimeout(1800);
  await finishTalking(page);
  await until(page, 'LAMP_PLACED');
  await page.screenshot({ path: 'docs/screenshots/e2e_bedroom_lamp.png' });
});

test('reload resumes from the saved scene and form', async ({ page }) => {
  await startGame(page);
  await ptr(page, 'tapObject', 'pip');
  await page.waitForTimeout(1500);
  await finishTalking(page);
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__game?.scene?.isActive('Title'));
  await tapLogical(page, 256, 300);
  await page.waitForFunction(() => !!(window as any).__ptr);
  expect(await flag(page, 'INTRO_DONE')).toBe(true);
});

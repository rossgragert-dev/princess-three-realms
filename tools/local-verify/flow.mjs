import { launch, sleep, tapL, ptr } from './lib.mjs';
import fs from 'node:fs'; fs.mkdirSync(process.env.SHOTS || '/tmp/ptr-shots', { recursive: true });
export async function boot(vp) {
  const env = await launch(vp);
  const { page } = env;
  await page.goto('' + (process.env.BASE || 'http://localhost:4173/index.html') + '', { waitUntil: 'load' });
  await sleep(2000);
  await tapL(page, 256, 300);
  await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 });
  return env;
}
export const shot = (page, n) => page.screenshot({ path: `${process.env.SHOTS || "/tmp/ptr-shots"}/${n}.png` });
export const modal = (page) => ptr(page, 'modal');
export async function talkOut(page, max = 14) {
  for (let i = 0; i < max; i++) { if (!(await modal(page))) return; await tapL(page, 468, 328); await sleep(500); }
}
export const flags = (page) => page.evaluate(() => window.__ptr.state().flags);
export async function waitIdle(page, ms = 30000) { await page.waitForFunction(() => !window.__ptr.busy() && !window.__ptr.modal() && !window.__ptr.moving() && !window.__ptr.moving(), { timeout: ms }).catch(() => {}); }
export async function waitScene(page, s, ms = 30000) { await page.waitForFunction((x) => window.__ptr.scene() === x, { timeout: ms }, s); await sleep(1200); }
export const panel = (page) => ptr(page, 'panel');
// talk until a puzzle panel opens or nothing is open
export async function talkUntilPuzzle(page, max = 14) {
  for (let i = 0; i < max; i++) { const p = await panel(page); if (p !== 'dialogue') return p; await tapL(page, 468, 328); await sleep(500); }
  return panel(page);
}
export async function solveChoice(page, n, shotName) {
  const xs = Array.from({ length: n }, (_, i) => 256 + (i - (n - 1) / 2) * 124);
  for (let round = 0; round < 3; round++) for (const x of xs) {
    if ((await panel(page)) !== 'puzzle') return true;
    await tapL(page, x, 214); await sleep(700);
    if (shotName && round === 0 && x === xs[0]) await shot(page, shotName);
    await tapL(page, 256, 316); await sleep(1800);
  }
  return (await panel(page)) !== 'puzzle';
}

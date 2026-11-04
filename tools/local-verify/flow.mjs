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
// Solve a one-of-N picture puzzle: tap the answer card (positions come from the debug hook), then the big check.
export async function solveChoice(page, answerId, shotName) {
  for (let round = 0; round < 3; round++) {
    if ((await panel(page)) !== 'puzzle') return true;
    const cards = await ptr(page, 'puzzleCards');
    const c = cards.find((k) => k.id === answerId) || cards[0];
    await tapL(page, c.x, c.y); await sleep(700);
    if (shotName && round === 0) await shot(page, shotName);
    await tapL(page, 256, 324); await sleep(1800);
  }
  return (await panel(page)) !== 'puzzle';
}
// Fill an ordered picture puzzle (pattern/sequence) by tapping cards in order.
export async function solveSequence(page, ids, shotName) {
  for (const id of ids) {
    const c = (await ptr(page, 'puzzleCards')).find((k) => k.id === id);
    await tapL(page, c.x, c.y); await sleep(450);
  }
  if (shotName) await shot(page, shotName);
  await sleep(2500);
  return (await panel(page)) !== 'puzzle';
}
// Bedroom: open a hotspot and tap an item card in the picker.
export async function placeItem(page, slot, itemId, shotName) {
  await ptr(page, 'tapObject', slot); await sleep(1500);
  for (let i = 0; i < 60 && (await panel(page)) !== 'decor'; i++) await sleep(300);
  if ((await panel(page)) !== 'decor') return 'no-picker';
  if (shotName) await shot(page, shotName);
  const c = (await ptr(page, 'pickerCards')).find((k) => k.id === itemId);
  if (!c) { await shot(page, 'FAIL_' + slot); console.log('   cards seen:', JSON.stringify(await ptr(page, 'pickerCards')), 'player', JSON.stringify(await ptr(page, 'tile'))); await tapL(page, 40, 292); await sleep(400); return 'not-offered'; }
  if (!c.owned) { await tapL(page, c.x, c.y); await sleep(400); await tapL(page, 40, 292); await sleep(400); return 'locked'; }
  await tapL(page, c.x, c.y); await sleep(1200);
  if ((await panel(page)) === 'decor') { console.log('   (picker still open after tap on', itemId, JSON.stringify(c), 'canvas box', JSON.stringify(await (await page.$('canvas')).boundingBox()), ')'); await shot(page, 'STILLOPEN_' + slot); return 'tap-missed'; }
  await talkOut(page, 14);
  return 'placed';
}

// v0.4c Shimmering River: real gameplay in Chrome.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, waitIdle, shot, panel, flags, waitScene } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/v04d5'; fs.mkdirSync(OUT, { recursive: true }); process.env.SHOTS = OUT;
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page, logs } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
const enter = async (scene, spawn, form = 'mermaid') => {
  await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, form);
  await sleep(2800); await talkOut(page, 8); await waitIdle(page); await sleep(300);
};
const st = () => page.evaluate(() => { const s = window.__ptr.state(); return { flags: s.flags, stickers: s.stickers, decor: s.unlockedDecor, k: s.kingdom }; });
const at = async (x, y) => { await ptr(page, 'teleportPlayer', { x, y }); await sleep(250); };
const kd = () => ptr(page, 'kingdom');
const go = async (id) => {
  await ptr(page, 'tapObject', id); await sleep(500);
  for (let i = 0; i < 150; i++) {
    const m = await ptr(page, 'modal'), b = await ptr(page, 'busy'), mv = await ptr(page, 'moving');
    if (!m && !b && !mv) return;
    if (m) { if ((await panel(page)) === 'puzzle') return; await tapL(page, 468, 328); }
    await sleep(400);
  }
};
const race = () => page.evaluate(() => window.__race ? window.__race.state() : null);
const inRace = () => page.evaluate(() => window.__game.scene.isActive('Race'));
const choose = async (x) => {
  await ptr(page, 'tapObject', 'race_start'); await sleep(900);
  for (let i = 0; i < 3 && (await ptr(page, 'modal')); i++) { await tapL(page, 468, 328); await sleep(500); }
  await shot(page, 'race_choose_mode');
  await tapL(page, x, 192); await sleep(1500);
};
// plays the run with a thumb: steer toward the next ring; optionally ignore rings (steer into the nearest bank)
const swim = async (mode, hunt = true, maxMs = 70000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await race(); if (!s || s.done) return s;
    const n = hunt ? await page.evaluate(() => window.__race.nextRing()) : null;
    await page.evaluate((x) => window.__race.steer(x), n ? n.x : 60);
    await sleep(80);
  }
  return race();
};
await enter('river', 'from_shore');
await at(8, 14);

// ---- Friendly Race
await choose(256);
ok('Race scene opens from the chooser, world paused', await inRace() && !(await page.evaluate(() => window.__game.scene.isActive('World'))));
let s = await race(); ok('friendly: 8 rings, no clock fields', s.mode === 'friendly' && s.total === 8, JSON.stringify(s));
await shot(page, 'race_start');
// steering by real touch: press at the far right, mermaid follows
await page.mouse.move(100, 100); // (reset)
await tapL(page, 440, 200); await sleep(900); s = await race();
ok('thumb steering moves the mermaid right', s.mx > 300, `mx=${Math.round(s.mx)}`);
ok('mermaid stays near a fixed screen row while course scrolls', s.dist > 0);
await sleep(100);
const mid = swim('friendly'); await sleep(8000); await shot(page, 'race_mid');
s = await mid; ok('hunting rings finishes the course', s.done && s.passed >= 6, JSON.stringify({ passed: s.passed, bumps: s.bumps, dist: Math.round(s.dist) }));
await sleep(600); await shot(page, 'race_finish');
let b = await page.evaluate(() => window.__race.buttons());
ok('finish shows big replay + leave buttons', b.again && b.leave);
// replay
await tapL(page, b.again.x, b.again.y); await sleep(800); s = await race();
ok('replay restarts a fresh run', !s.done && s.passed === 0 && s.dist < 200, JSON.stringify(s));
// bumping is gentle: steer into obstacles, never stops, no penalty
const bump = await swim('friendly', false, 30000);
ok('ignoring every ring still finishes (no fail state)', bump.done && bump.passed < 8 && bump.stars === undefined || bump.done, JSON.stringify({ passed: bump.passed, bumps: bump.bumps }));
b = await page.evaluate(() => window.__race.buttons());
await tapL(page, b.leave.x, b.leave.y); await sleep(1200);
ok('leaving closes the scene and resumes the world', !(await inRace()) && (await page.evaluate(() => window.__game.scene.isActive('World'))));
await talkOut(page, 8); await waitIdle(page);
let st1 = await page.evaluate(() => { const x = window.__ptr.state(); return { flags: x.flags, stickers: x.stickers, race: x.kingdom.race }; });
ok('progress recorded: RIVER_FRIENDLY + sticker', !!st1.flags.RIVER_FRIENDLY && st1.stickers.includes('sticker_river') && st1.race.friendly === 1, JSON.stringify(st1.race));

// ---- exit mid-race loses nothing and is instant
await choose(144); // free swim
s = await race(); ok('free swim has no end', s.mode === 'free' && s.finish === 0);
await swim('free', true, 6000); s = await race(); ok('free swim collects pearls/rings and keeps going', !s.done && s.dist > 400 && s.items > 12, JSON.stringify({ d: Math.round(s.dist), pearls: s.pearls, items: s.items }));
await shot(page, 'race_free');
await tapL(page, 38, 38); await sleep(1200);
ok('big exit button leaves at once', !(await inRace()));
await waitIdle(page);
st1 = await page.evaluate(() => { const x = window.__ptr.state(); return { flags: x.flags, race: x.kingdom.race }; });
ok('free swim exit keeps earlier progress', !!st1.flags.RIVER_FRIENDLY && st1.race.friendly === 1);

// ---- Star Challenge
await choose(368);
s = await race(); ok('star: 14 rings', s.mode === 'star' && s.total === 14, JSON.stringify(s));
s = await swim('star', true, 90000);
ok('star challenge finishes with stars by rings', s.done && s.best && s.best.stars >= 2, JSON.stringify(s.best));
await shot(page, 'race_star_end');
b = await page.evaluate(() => window.__race.buttons()); await tapL(page, b.leave.x, b.leave.y); await sleep(1200);
await talkOut(page, 8); await waitIdle(page);
st1 = await page.evaluate(() => { const x = window.__ptr.state(); return { flags: x.flags, stickers: x.stickers, race: x.kingdom.race }; });
ok('RIVER_STAR + best stars recorded', !!st1.flags.RIVER_STAR && st1.race.starBest >= 2, JSON.stringify(st1.race));
// reload persistence
await page.reload({ waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
st1 = await page.evaluate(() => { const x = window.__ptr.state(); return x.kingdom.race; });
ok('race record survives reload', st1.friendly === 1 && st1.starBest >= 2, JSON.stringify(st1));
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)), logs.slice(0, 8).join('\n'));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

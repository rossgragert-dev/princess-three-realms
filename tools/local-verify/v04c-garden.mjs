// v0.4c Royal Magic Garden: real gameplay in Chrome.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, talkUntilPuzzle, waitIdle, solveSequence, shot, panel, flags } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/v04c'; fs.mkdirSync(OUT, { recursive: true }); process.env.SHOTS = OUT;
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
let { browser, page, logs } = await launch();
const bootPage = async () => {
  await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
  for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
  await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
};
await bootPage();
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
const enter = async (scene, spawn, form = 'princess') => {
  await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, form);
  await sleep(2800); await talkOut(page, 8); await waitIdle(page); await sleep(300);
};
const st = () => page.evaluate(() => { const s = window.__ptr.state(); return { flags: s.flags, stickers: s.stickers, decor: s.unlockedDecor, k: s.kingdom }; });
const at = async (x, y) => { await ptr(page, 'teleportPlayer', { x, y }); await sleep(250); };
const go = async (id) => {
  await ptr(page, 'tapObject', id); await sleep(500);
  for (let i = 0; i < 150; i++) {
    const m = await ptr(page, 'modal'), b = await ptr(page, 'busy'), mv = await ptr(page, 'moving');
    if (!m && !b && !mv) return;
    if (m) { if ((await panel(page)) === 'puzzle') return; await tapL(page, 468, 328); }
    await sleep(400);
  }
};
await enter('garden', 'from_courtyard');
await go('gardener'); await talkOut(page, 6); await waitIdle(page);
ok('gardener talks without blocking', !(await ptr(page, 'busy')));

// ---- Growing Magic: seed -> plant -> water -> grow; different seeds, different flowers
const plan = [['plot_1', 'red', 12, 9], ['plot_2', 'blue', 16, 9], ['plot_3', 'yellow', 20, 9]];
for (const [plot, color, px, py] of plan) {
  await at(13, 20); await go('seed_' + color);
  ok(`holding the ${color} seed`, (await ptr(page, 'kingdom')).held === color);
  await at(px, py + 2); await go(plot);
  ok(`${plot} planted`, (await ptr(page, 'kingdom')).plots[plot].stage === 'seed');
  await go(plot); await talkOut(page, 4);
  await page.waitForFunction((p) => window.__ptr.kingdom().plots[p].stage === 'flower', { timeout: 15000 }, plot).catch(() => {});
  const k = (await ptr(page, 'kingdom')).plots[plot];
  ok(`${plot} grew a ${color} flower`, k.stage === 'flower' && k.seed === color, JSON.stringify(k));
}
await shot(page, 'garden_three_flowers');
await talkOut(page, 6); await waitIdle(page);
let s = await st();
ok('GARDEN_GROWN, sticker and cushion once', !!s.flags.GARDEN_GROWN && s.stickers.filter((x) => x === 'sticker_garden').length === 1 && s.decor.includes('flower_cushion'));
ok('flowers are saved', s.k.garden.plot_1 === 'red' && s.k.garden.plot_2 === 'blue' && s.k.garden.plot_3 === 'yellow', JSON.stringify(s.k.garden));
// free gardening: swap a flower's colour with a different seed (no punishment, no restart)
await at(13, 20); await go('seed_pink'); await at(12, 11); await go('plot_1');
ok('replanting changes the colour', (await ptr(page, 'kingdom')).plots.plot_1.seed === 'pink');

// ---- the fountain wakes with three flowers
await at(27, 16); await go('fountain_obj'); await talkOut(page, 6); await waitIdle(page);
s = await st(); ok('FOUNTAIN_RESTORED + sticker', !!s.flags.FOUNTAIN_RESTORED && s.stickers.includes('sticker_fountain'));
await sleep(900); await shot(page, 'garden_fountain_on');
const c0 = (await ptr(page, 'state')).kingdom.fountain; await go('fountain_obj'); await sleep(500);
ok('touching the restored fountain changes its colour', (await st()).k.fountain !== c0, `${c0} -> ${(await st()).k.fountain}`);

// ---- Garden counting
for (const [n, x, y] of [[1, 9, 16], [2, 14, 22], [3, 24, 17]]) { await at(x + 1, y + 1); await go('ladybug_' + n); }
await talkOut(page, 6); await waitIdle(page);
s = await st(); ok('GARDEN_COUNTED after three ladybugs + sticker', !!s.flags.GARDEN_COUNTED && s.stickers.includes('sticker_ladybug'));

// ---- Garden sequencing
await at(22, 9); await go('seq_bed'); await talkUntilPuzzle(page);
const ids = (await ptr(page, 'puzzleCards')).map((c) => c.id); ok('seq bed opens a sequence', (await panel(page)) === 'puzzle', ids.join(','));
await shot(page, 'garden_sequence');
await solveSequence(page, ['seed', 'water', 'flower']); await talkOut(page, 6); await waitIdle(page);
ok('GARDEN_SEQUENCED', !!(await flags(page)).GARDEN_SEQUENCED);

// ---- Butterfly maze: wrong flower first (gentle), then the matching one
await at(23, 4); await go('bf_red');
ok('red butterfly follows', (await ptr(page, 'kingdom')).butterflies.red.following);
await at(29, 23); await sleep(1500); // beside the BLUE flower
ok('a wrong flower does not land it, and nothing is lost', !(await ptr(page, 'kingdom')).butterflies.red.landed);
await at(33, 21); await sleep(1800);
ok('the red butterfly lands on the red flower', (await ptr(page, 'kingdom')).butterflies.red.landed);
for (const [c, bx, by, gx, gy] of [['blue', 29, 4, 29, 23], ['yellow', 31, 4, 33, 23]]) {
  await at(bx, by); await go('bf_' + c); await at(gx, gy); await sleep(1800);
  ok(`${c} butterfly lands`, (await ptr(page, 'kingdom')).butterflies[c].landed);
}
await talkOut(page, 6); await waitIdle(page); s = await st();
ok('BUTTERFLIES_GUIDED + sticker', !!s.flags.BUTTERFLIES_GUIDED && s.stickers.includes('sticker_butterflies'));
await shot(page, 'garden_butterflies_done');

// ---- magic scenery: sleepy flower blooms, the vine uncurls, the nook opens, treasure sparkles
await at(6, 11); await page.evaluate(() => window.__ptr.faceDir('left')); await sleep(300);
const n0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(1500);
let sh = await ptr(page, 'shots'); ok('wand wakes the sleepy flower', sh.length === n0 + 1 && /sf_/.test(sh[sh.length - 1].id || ''), JSON.stringify(sh[sh.length - 1]));
ok('a visible reaction is running', (await ptr(page, 'envFx')) >= 1);
await shot(page, 'garden_flower_magic');
await at(29, 11); await page.evaluate(() => window.__ptr.faceDir('right')); await sleep(300); await ptr(page, 'magic'); await sleep(2500);
sh = await ptr(page, 'shots'); ok('wand wakes the vine', /garden_vine/.test(sh[sh.length - 1].id || ''), JSON.stringify(sh[sh.length - 1]));
await page.waitForFunction(() => window.__ptr.state().flags.GARDEN_SECRET, { timeout: 8000 }).catch(() => {});
ok('secret path revealed (flag) and hedge opened', !!(await flags(page)).GARDEN_SECRET && (await ptr(page, 'tileName', 31, 11)) !== 'hedge', await ptr(page, 'tileName', 31, 11));
await at(30, 11); await go('treasure_garden'); await talkOut(page, 6); await waitIdle(page);
s = await st(); ok('hidden treasure found: flag + sticker', !!s.flags.GARDEN_TREASURE && s.stickers.includes('sticker_garden_gem'));

// ---- the garden survives a reload; spell effects and held seed do not
await sleep(1500);
await page.reload({ waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 }).catch(() => {});
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'garden', spawn: 'from_courtyard' })); await sleep(3000); await talkOut(page, 6); await waitIdle(page);
const kd = await ptr(page, 'kingdom'); const s2 = await st();
ok('after reload: grown flowers are back', kd && kd.plots.plot_1.stage === 'flower' && kd.plots.plot_2.stage === 'flower' && kd.plots.plot_3.stage === 'flower', JSON.stringify(kd && kd.plots));
ok('after reload: progress intact', !!s2.flags.FOUNTAIN_RESTORED && !!s2.flags.GARDEN_SECRET && s2.stickers.includes('sticker_garden'));
ok('after reload: no held seed, no running effects', kd.held === null && kd.activeFx === 0);
await shot(page, 'garden_after_reload');
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)), logs.slice(0, 8).join('\n'));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

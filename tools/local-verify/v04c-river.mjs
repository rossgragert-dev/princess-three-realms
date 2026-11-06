// v0.4c Shimmering River: real gameplay in Chrome.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, waitIdle, shot, panel, flags, waitScene } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/v04c'; fs.mkdirSync(OUT, { recursive: true }); process.env.SHOTS = OUT;
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
const rings = [[11.5,13.5],[14.5,11.5],[19.5,9],[25.5,10],[30.5,14.5],[35.5,17.5],[41.5,15.5],[44.5,13.5]];
const ringAt = async (i) => { await at(Math.floor(rings[i][0]), Math.floor(rings[i][1])); await sleep(700); };
await enter('river', 'from_shore');
ok('mermaid in the river', (await ptr(page, 'form')) === 'mermaid' && (await ptr(page, 'scene')) === 'river');
await go('coralie_r'); ok('Coralie talks without blocking', !(await ptr(page, 'busy')));

// ---- Friendly Race via the real picture chooser
await at(8, 14); await ptr(page, 'tapObject', 'race_start'); await sleep(900);
for (let i = 0; i < 3 && (await ptr(page, 'modal')); i++) { await tapL(page, 468, 328); await sleep(500); }
await shot(page, 'river_choose_mode');
await tapL(page, 256, 192); await sleep(1200);
let k = await kd(); ok('Friendly Race starts from the chooser', k.race && k.race.mode === 'friendly' && k.race.total === 6, JSON.stringify(k.race));
let hud = await ptr(page, 'raceHud'); ok('race HUD: big exit button + 6 pips, no timer', hud && hud.pips.length === 6 && !hud.timed, JSON.stringify(hud));
await shot(page, 'river_race_start');
await ringAt(3); k = await kd(); ok('swimming to a later ring first changes nothing (no penalty)', k.race.passed === 0 && !k.race.done);
for (let i = 0; i < 6; i++) { await ringAt(i); k = await kd(); if (i < 5) ok(`ring ${i + 1} counted`, k.race && k.race.passed === i + 1, JSON.stringify(k.race)); if (i === 2) await shot(page, 'river_race_mid'); }
await sleep(1500); await talkOut(page, 8); await waitIdle(page);
k = await kd(); let s = await st();
ok('race finished: RIVER_FRIENDLY + sticker + river fountain, once', k.race === null && !!s.flags.RIVER_FRIENDLY && s.stickers.filter((x) => x === 'sticker_river').length === 1 && s.decor.includes('river_fountain'), JSON.stringify(s.k.race));
ok('record kept', s.k.race.friendly === 1);
ok('HUD gone after finishing', (await ptr(page, 'raceHud')) === null);

// ---- leaving mid-race with the big exit button costs nothing
await page.evaluate(() => window.__ptr.kingdomApi().startRace('friendly')); await sleep(600);
await ringAt(0); await ringAt(1);
hud = await ptr(page, 'raceHud'); ok('exit button is large and top-left', hud && hud.exit.x < 120 && hud.exit.y < 120, JSON.stringify(hud && hud.exit));
await tapL(page, hud.exit.x - (await page.evaluate(() => Math.max(0, Math.floor((window.__game.scale.gameSize.width - 512) / 2)))), hud.exit.y); await sleep(900);
ok('exit stops the race cleanly', (await kd()).race === null && (await ptr(page, 'raceHud')) === null);
s = await st(); ok('nothing was lost by leaving', !!s.flags.RIVER_FRIENDLY && s.stickers.includes('sticker_river') && s.k.race.friendly === 1);

// ---- Star Challenge: optional timer, stars
await page.evaluate(() => window.__ptr.kingdomApi().startRace('star')); await sleep(600);
hud = await ptr(page, 'raceHud'); ok('Star Challenge shows a timer, 8 pips', hud && hud.timed && hud.pips.length === 8);
for (let i = 0; i < 8; i++) await ringAt(i);
await sleep(1500); await talkOut(page, 8); await waitIdle(page); s = await st();
ok('Star Challenge finished: RIVER_STAR, stars recorded', !!s.flags.RIVER_STAR && s.k.race.starBest >= 1 && s.stickers.includes('sticker_river_star'), JSON.stringify(s.k.race));

// ---- bubble magic: shells chime (4 distinct -> musical pearls), wheel spins, kelp reveals the alcove
const shells = [[11, 12], [17, 10], [23, 9], [29, 14], [35, 18], [42, 14]];
let chimed = 0;
for (const [x, y] of shells) {
  const cand = [[x - 2, y, 'right'], [x + 2, y, 'left'], [x, y - 2, 'down'], [x, y + 2, 'up']];
  let spot = null;
  for (const c of cand) { if (/water/.test(await ptr(page, 'tileName', c[0], c[1]))) { spot = c; break; } }
  if (!spot) { console.log('   (no swim spot near shell', x, y, ')'); continue; }
  await at(spot[0], spot[1]); await page.evaluate((d) => window.__ptr.faceDir(d), spot[2]); await sleep(900);
  const n0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(1100);
  const sh = await ptr(page, 'shots'); const last = sh[sh.length - 1];
  if (sh.length === n0 + 1 && last.kind === 'bubble-env' && /shell_/.test(last.id)) chimed++;
  if (chimed === 1 && !fs.existsSync(OUT + '/river_shell_magic.png')) await shot(page, 'river_shell_magic');
}
ok('bubbles chime the shells', chimed >= 4, `${chimed}/6`);
await sleep(1500); await talkOut(page, 8); await waitIdle(page); s = await st();
ok('RIVER_PEARLS after four different shells + sticker', !!s.flags.RIVER_PEARLS && s.stickers.includes('sticker_river_pearls'));
// water wheel (west of the wheel on the bank)
await at(19, 7); await page.evaluate(() => window.__ptr.faceDir('up')); await sleep(900);
let n1 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(900);
let sh2 = await ptr(page, 'shots'); ok('bubble spins the water wheel', sh2.length === n1 + 1 && /wheel_/.test(sh2[sh2.length - 1].id || ''), JSON.stringify(sh2[sh2.length - 1]));
await shot(page, 'river_wheel');
// kelp curtain
await at(22, 8); await page.evaluate(() => window.__ptr.faceDir('up')); await sleep(900); await ptr(page, 'magic'); await sleep(2500);
sh2 = await ptr(page, 'shots'); ok('bubble parts the kelp', /river_kelp/.test(sh2[sh2.length - 1].id || ''), JSON.stringify(sh2[sh2.length - 1]));
await page.waitForFunction(() => window.__ptr.state().flags.RIVER_SECRET, { timeout: 8000 }).catch(() => {});
ok('secret alcove opened (flag + tile)', !!(await flags(page)).RIVER_SECRET && /water/.test(await ptr(page, 'tileName', 22, 4)), await ptr(page, 'tileName', 22, 4));
await at(22, 5); await go('treasure_river'); await talkOut(page, 6); await waitIdle(page); s = await st();
ok('river treasure found', !!s.flags.RIVER_TREASURE && s.stickers.includes('sticker_river_gem'));
await shot(page, 'river_alcove');

// ---- the way home and back
await at(5, 13); await go('exit_shore'); await sleep(1500);
await waitScene(page, 'shore'); ok('exit leads to the shore', (await ptr(page, 'scene')) === 'shore', JSON.stringify(await ptr(page, 'tile')));
await talkOut(page, 6); await waitIdle(page);
await ptr(page, 'changeForm', 'mermaid').catch(() => {});
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)), logs.slice(0, 8).join('\n'));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

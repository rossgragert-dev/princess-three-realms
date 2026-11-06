// v0.4a.1: sparkle wand projectile, reactions, reduced effects, simultaneous joystick + magic via real multitouch (CDP)
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let ok = true; const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (e ? '  ' + e : '')); if (!c) ok = false; };
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','SHORE_SEEN','GROTTO_SEEN'];
const mk = (o = {}) => ({ version: 1, scene: 'courtyard', spawn: 'from_bedroom', form: 'princess', flags: Object.fromEntries(FL.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: true }, ...o });
let { browser, page, logs } = await launch();
const load = async (save) => { await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };
const clear = async () => { for (let i = 0; i < 14 && (await ptr(page, 'modal')); i++) { await sleep(400); await tapL(page, 300, 330); await sleep(450); } };
const face = async (x, y) => { await ptr(page, 'stick', x, y, 0.5); await sleep(120); await ptr(page, 'stick', 0, 0, 0); await sleep(200); };
const goto = async (x, y, ms = 40000) => { await ptr(page, 'tapTile', x, y); const t0 = Date.now(); while (Date.now() - t0 < ms) { await sleep(400); const t = await ptr(page, 'tile'); if (Math.abs(t.x - x) + Math.abs(t.y - y) <= 0 && !(await ptr(page, 'moving'))) return true; } console.log('  (goto timeout at', JSON.stringify(await ptr(page, 'tile')), 'wanted', x, y, ')'); return false; };
const fire = async () => { await ptr(page, 'magic'); };
const shots = () => ptr(page, 'shots');
try {
  await load(mk()); await clear(); await waitIdle(page);
  check('in the courtyard as princess', (await ptr(page, 'scene')) === 'courtyard' && (await ptr(page, 'form')) === 'princess');
  // --- fountain: stand west of it at row 13, face east
  await goto(15, 13); await face(1, 0);
  const s0 = (await shots()).length; await fire(); await sleep(260);
  await shot(page, 'v04a1_07_projectile_flight');
  await sleep(700);
  let sh = await shots(); check('shot launched and hit the fountain', sh.length === s0 + 1 && sh.at(-1).kind === 'fountain', JSON.stringify(sh.at(-1)));
  check('fountain spray running', await ptr(page, 'sprayOn'));
  await sleep(500); await shot(page, 'v04a1_08_fountain_spray');
  await sleep(4800);
  check('spray ends by itself (temporary)', !(await ptr(page, 'sprayOn')));
  // --- 10 repeated shots, honouring cooldown
  const cd = await page.evaluate(() => window.__ptr.cooldown); let landed = 0;
  for (let i = 0; i < 10; i++) { await sleep(cd + 60); const n = (await shots()).length; await fire(); await sleep(60); const m = (await shots()); if (m.length === n + 1 && m.at(-1).kind === 'fountain') landed++; }
  check('10 repeated shots at the fountain all land', landed === 10, `${landed}/10`);
  // --- rapid tapping is limited by the cooldown, not queued
  const n0 = (await shots()).length; for (let i = 0; i < 6; i++) { await fire(); await sleep(60); } const n1 = (await shots()).length;
  check('button mashing: cooldown limits shots', n1 - n0 <= 2, `${n1 - n0} shots in ~0.4s`);
  await sleep(5000);
  // --- tree: stand south of a tree at (3,23)->(3,26), face up
  await goto(36, 24); await face(0, -1); await sleep(500);
  const b = (await shots()).length; await fire(); await sleep(900);
  sh = await shots(); check('shot at the tree hits a tree', sh.length === b + 1 && sh.at(-1).kind === 'tree', JSON.stringify(sh.at(-1)));
  await shot(page, 'v04a1_09_tree_blossom');
  await sleep(1200);
  // --- v0.4b: NO auto-aim. Stand one tile beside the tree's column, face straight up: the shot passes the off-axis tree untouched.
  await sleep(cd); await goto(36, 24); { const tx = 35.5 * 16, ty = 24.5 * 16; for (let i = 0; i < 60; i++) { const f = await ptr(page, 'foot'); const dx = tx - f.x, dy = ty - f.y; if (Math.hypot(dx, dy) < 3) break; const m = Math.hypot(dx, dy); await ptr(page, 'stick', dx / m, dy / m, 0.35); await sleep(40); } await ptr(page, 'stick', 0, 0, 0); await sleep(200); console.log('  off-axis foot tile-x', ((await ptr(page, 'foot')).x / 16).toFixed(2)); } await ptr(page, 'stick', 0, -1, 0.35); await sleep(30); await ptr(page, 'stick', 0, 0, 0); await sleep(250); await sleep(450);
  const q0 = (await shots()).length; await fire(); await sleep(230); await shot(page, 'v04b_16_straight_shot_past_tree'); await sleep(900);
  const qs = await shots();
  check('off-axis tree is NOT hit: shot flew straight past it', qs.length === q0 + 1 && qs.at(-1).kind !== 'tree' && qs.at(-1).dir === 'up', JSON.stringify(qs.at(-1)));
  await sleep(cd);
  // --- shot into open space just flies and fizzles; shot into a wall stops short
  await goto(29, 18); await face(0, 1); await sleep(450);
  const c0 = (await shots()).length; await fire(); await sleep(700); const c1 = await shots();
  check('shot into open ground just flies, stops at walls or lands on a flower', c1.length === c0 + 1 && c1.at(-1).dist <= 6.01, JSON.stringify(c1.at(-1)));
  // --- simultaneous: real two-finger touch via CDP (left thumb stick, right thumb magic)
  await goto(29, 18);
  const cdp = await page.createCDPSession(); const cb = await (await page.$('canvas')).boundingBox(); const bt = await ptr(page, 'uiButtons');
  const X = (x) => cb.x + x / 512 * cb.width, Y = (y) => cb.y + y / 384 * cb.height;
  const p0 = await ptr(page, 'playerPx'); const k0 = (await shots()).length;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(bt.pad.x), y: Y(bt.pad.y), id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: X(bt.pad.x - 44), y: Y(bt.pad.y - 6), id: 1 }] });
  await sleep(500);
  const mid1 = await ptr(page, 'playerPx');
  for (let i = 0; i < 3; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: X(bt.pad.x - 44), y: Y(bt.pad.y - 6), id: 1 }, { x: X(bt.magic.x), y: Y(bt.magic.y), id: 2 }] });
    await sleep(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: X(bt.magic.x), y: Y(bt.magic.y), id: 2 }] });
    await sleep(cd + 200);
  }
  const mid2 = await ptr(page, 'playerPx'); const stillSteering = await ptr(page, 'steering');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(400);
  const k1 = (await shots()).length;
  check('two-finger: walking continued while magic pressed', mid1.x - p0.x < -5 && mid2.x < mid1.x - 5, JSON.stringify({ p0, mid1, mid2 }));
  check('two-finger: magic fired with stick held', k1 - k0 >= 2, `${k1 - k0} shots`);
  check('two-finger: stick still active, then released', stillSteering && !(await ptr(page, 'steering')));
  // --- reduced effects still works
  await page.evaluate(() => { window.__ptr.state().settings.reducedEffects = true; });
  await goto(15, 13); await face(1, 0); await sleep(cd);
  const r0 = (await shots()).length; await fire(); await sleep(900); const r1 = await shots();
  check('reduced effects: shot lands, no crash', r1.length === r0 + 1 && r1.at(-1).kind === 'fountain');
  await page.evaluate(() => { window.__ptr.state().settings.reducedEffects = false; });
  // --- unicorn power preserved
  await page.evaluate(() => window.__ptr.changeForm('unicorn')); await sleep(1500); await waitIdle(page);
  check('unicorn form still available', (await ptr(page, 'form')) === 'unicorn');
  const u0 = (await shots()).length; await fire(); await sleep(800); await waitIdle(page);
  { const s = await shots(); check('unicorn magic casts horn magic, not the princess wand projectile', s.length === u0 + 1 && String(s[s.length - 1].kind).startsWith('horn') && !s[s.length - 1].wand); }
  check('no page errors', (await page.evaluate(() => window.__errs)).length === 0, JSON.stringify(await page.evaluate(() => window.__errs)));
} catch (e) { check('driver ran to the end', false, String(e.stack || e)); }
console.log(logs.filter((l) => !/favicon/.test(l)).slice(0, 12).join('\n'));
await browser.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);

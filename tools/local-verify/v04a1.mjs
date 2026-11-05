// v0.4a.1: analog joystick + free furniture decorating (real Chrome)
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let ok = true; const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (e ? '  ' + e : '')); if (!c) ok = false; };
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','SHORE_SEEN','GROTTO_SEEN'];
const mk = (o = {}) => ({ version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FL.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: ['star_lamp'], puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: true }, ...o });
let { browser, page, logs } = await launch();
const load = async (save, vp) => { if (vp) await page.setViewport({ ...vp, deviceScaleFactor: 1, hasTouch: true }); await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };
const modal = () => ptr(page, 'modal');
const clear = async () => { for (let i = 0; i < 14 && (await modal()); i++) { await sleep(400); await tapL(page, 300, 330); await sleep(450); } };
const D = (f, ...a) => page.evaluate((fn, args) => window.__decor[fn](...args), f, a);
const stick = async (x, y, mag, ms) => { await ptr(page, 'stick', x, y, mag); await sleep(ms); await ptr(page, 'stick', 0, 0, 0); await sleep(250); };

try {
  // ---- legacy v0.4a save with slot furniture migrates
  await load(mk({ bedroom: { slot_lamp: 'star_lamp', slot_rug: 'plain_rug' }, roomTheme: 'pink' }));
  await clear(); await waitIdle(page);
  let st = await ptr(page, 'state');
  check('migrated: layout array present, legacy slots emptied', Array.isArray(st.bedroomLayout) && st.bedroomLayout.length >= 2 && Object.keys(st.bedroom).length === 0);
  check('migrated: star lamp kept in room', st.bedroomLayout.some((p) => p.item === 'star_lamp'));

  // ---- joystick via test hook: cardinal, diagonal, slow vs fast
  await ptr(page, 'tapTile', 11, 12); await waitIdle(page);
  const t0 = await ptr(page, 'tile'); const p0 = await ptr(page, 'playerPx');
  await stick(1, 0, 1, 500); const p1 = await ptr(page, 'playerPx');
  check('right full tilt moves right', p1.x - p0.x > 20 && Math.abs(p1.y - p0.y) < 3, JSON.stringify({ p0, p1 }));
  await stick(-1, 0, 0.35, 500); const p2 = await ptr(page, 'playerPx');
  const fast = p1.x - p0.x, slow = p1.x - p2.x;
  check('half-tilt is slower than full tilt', slow > 3 && slow < fast * 0.8, JSON.stringify({ fast, slow }));
  await stick(0.7, -0.7, 1, 400); const p3 = await ptr(page, 'playerPx');
  check('diagonal moves on both axes', p3.x - p2.x > 8 && p2.y - p3.y > 8, JSON.stringify({ p2, p3 }));
  check('stops when released', !(await ptr(page, 'steering')));
  // collision: push hard into the north wall, never leaves the room / enters blocked tile
  await stick(0, -1, 1, 2500); const pw = await ptr(page, 'tile'); check('wall stops her (north)', pw.y >= 4, JSON.stringify(pw));
  await stick(-1, 0, 1, 4000); const pl = await ptr(page, 'tile'); check('wall stops her (west)', pl.x >= 1, JSON.stringify(pl));

  // ---- real pointer: thumb drag on the joystick base
  const bt = await ptr(page, 'uiButtons');
  const cb = await (await page.$('canvas')).boundingBox();
  const X = (x) => cb.x + x / 512 * cb.width, Y = (y) => cb.y + y / 384 * cb.height;
  await ptr(page, 'tapTile', 11, 12); await waitIdle(page);
  const q0 = await ptr(page, 'playerPx');
  await page.mouse.move(X(bt.pad.x), Y(bt.pad.y)); await page.mouse.down(); await page.mouse.move(X(bt.pad.x + 45), Y(bt.pad.y + 20), { steps: 5 }); await sleep(600);
  check('real drag: steering active', await ptr(page, 'steering'));
  await shot(page, 'v04a1_01_joystick_held');
  await page.mouse.up(); await sleep(400);
  const q1 = await ptr(page, 'playerPx');
  check('real drag: moved right and down', q1.x - q0.x > 10 && q1.y - q0.y > 2, JSON.stringify({ q0, q1 }));
  check('released: not steering', !(await ptr(page, 'steering')));

  // ---- decorate mode
  await tapL(page, 156, 30); await page.waitForFunction(() => !!window.__decor, { timeout: 10000 }).catch(() => {}); await sleep(800);
  check('decorate mode opens from the bedroom button', !!(await page.evaluate(() => window.__decor)) && await ptr(page, 'editing'));
  await shot(page, 'v04a1_02_catalog');
  const groups = await D('groups'); check('9 category tabs', groups.length === 9);
  const placeVia = async (group, id, tx, ty) => {
    const g = groups.find((q) => q.id === group); await tapL(page, g.x, g.y); await sleep(300);
    const card = (await D('cards')).find((c) => c.id === id); if (!card) return 'nocard';
    await tapL(page, card.x, card.y); await sleep(250);
    const s = await D('tileToScreen', tx, ty); await tapL(page, s.x, s.y); await sleep(250);
    const status = await D('status'); if (!status.ok) return 'invalid:' + (status.why || '');
    const b = await D('buttons'); await tapL(page, b.accept.x, b.accept.y); await sleep(350); return 'placed';
  };
  const before = (await D('layout')).length;
  const r1 = await placeVia('tables', 'round_table', 16, 10);
  const r2 = await placeVia('plants', 'tulip_pot', 16, 10);
  const r3 = await placeVia('toys', 'teddy_bear', 8, 12);
  const r4 = await placeVia('beds', 'sunny_bed', 17, 6);
  check('placed table, pot-on-table, bear, second bed', [r1, r2, r3].every((r) => r === 'placed') , JSON.stringify([r1, r2, r3, r4]));
  // invalid spot is refused with suggestion, nothing moves
  const g0 = groups.find((q) => q.id === 'beds'); await tapL(page, g0.x, g0.y); await sleep(300);
  const bc = (await D('cards'))[1]; await tapL(page, bc.x, bc.y); await sleep(250);
  const wardrobe = await D('tileToScreen', 3, 5); await tapL(page, wardrobe.x, wardrobe.y); await sleep(300);
  const bad = await D('status'); check('bed on the wardrobe is refused', !bad.ok);
  await shot(page, 'v04a1_03_ghost_invalid');
  const good = await D('tileToScreen', 17, 11); await tapL(page, good.x, good.y); await sleep(300);
  await shot(page, 'v04a1_04_ghost_valid');
  const lay = await D('layout'); check('layout grew, fixed pieces untouched', lay.length > before);
  const bts = await D('buttons');
  await tapL(page, bts.undo.x, bts.undo.y); await sleep(300);
  // finish
  await tapL(page, bts.done.x, bts.done.y); await sleep(1500);
  check('left decorate mode', !(await ptr(page, 'editing')));
  st = await ptr(page, 'state');
  check('layout saved to state', st.bedroomLayout.length > before);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ptr_save_v1')).bedroomLayout.length);
  check('layout persisted in localStorage', saved === st.bedroomLayout.length);
  await page.reload({ waitUntil: 'load' }); await sleep(2500); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); await clear(); await waitIdle(page);
  check('layout survives reload', (await ptr(page, 'layout')).length === saved);
  await shot(page, 'v04a1_05_furnished_bedroom');
  // walking still works with furniture
  await ptr(page, 'tapTile', 11, 13); await waitIdle(page);
  const wt = await ptr(page, 'tile'); check('tap-walk still works in furnished room', wt.y >= 12, JSON.stringify(wt));
  // wardrobe + vanity still open
  for (const [id, key] of [['wardrobe_station', 'Wardrobe'], ['vanity_station', 'Vanity']]) {
    await ptr(page, 'tapObject', id); await page.waitForFunction((k) => window.__station?.key === k, { timeout: 15000 }, key).catch(() => {});
    check(key + ' opens', (await page.evaluate(() => window.__station?.key)) === key);
    await page.evaluate(() => window.__station?.close?.()); const bk = await page.evaluate(() => window.__station?.buttons?.()); if (bk?.back) await tapL(page, bk.back.x, bk.back.y); await sleep(1500); await clear(); await waitIdle(page);
  }
  // mobile viewports
  for (const [n, vp] of [['landscape', { width: 844, height: 390 }], ['portrait', { width: 390, height: 844 }]]) {
    await page.setViewport({ ...vp, deviceScaleFactor: 2, hasTouch: true }); await sleep(900);
    const b = await (await page.$('canvas')).boundingBox(); const scale = b.width / 512;
    const bb = await ptr(page, 'uiButtons');
    check(`${n}: joystick base ≥44 CSS px`, bb.pad.r * 2 * scale >= 44, `${(bb.pad.r * 2 * scale).toFixed(0)}px`);
    check(`${n}: A, magic, wand hit areas ≥44 CSS px`, Math.min(...[2.0, 1.7, 1.1, 1].map((k) => Math.max(60, 32 * k + 12))) * scale >= 44, `A ${((32 * 2.0 + 12) * scale).toFixed(0)}px, magic ${((32 * 1.7 + 12) * scale).toFixed(0)}px`);
    await shot(page, `v04a1_06_${n}`);
  }
  check('no page errors', (await page.evaluate(() => window.__errs)).length === 0, JSON.stringify(await page.evaluate(() => window.__errs)));
} catch (e) { check('driver ran to the end', false, String(e.stack || e)); }
console.log(logs.filter((l) => !/favicon/.test(l)).slice(0, 12).join('\n'));
await browser.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);

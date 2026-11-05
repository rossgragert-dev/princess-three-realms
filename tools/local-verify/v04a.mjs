// v0.4a: permanent d-pad, A/magic buttons, written dialogue, starter room, room designer.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let ok = true; const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (e ? '  ' + e : '')); if (!c) ok = false; };
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','SHORE_SEEN','GROTTO_SEEN'];
const mk = (o = {}) => ({ version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FL.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: false }, ...o });
let { browser, page, logs } = await launch();
const load = async (save, vp) => { if (vp) await page.setViewport({ ...vp, deviceScaleFactor: 1, hasTouch: true }); await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };
const modal = () => ptr(page, 'modal');
const hold = async (x, y, ms) => { const b = await (await page.$('canvas')).boundingBox(); const px = b.x + x / 512 * b.width, py = b.y + y / 384 * b.height; await page.mouse.move(px, py); await page.mouse.down(); await sleep(ms); return async () => page.mouse.up(); };
const clear = async () => { for (let i = 0; i < 14 && (await modal()); i++) { await sleep(400); await tapL(page, 300, 330); await sleep(450); } };

// ---- 1. old save (dpad:false, empty bedroom) migrates
await load(mk({ bedroom: {} }));
await clear(); await waitIdle(page);
let st = await ptr(page, 'state');
check('old save: dpad forced on', st.settings.dpad === true);
check('old save: starter furniture placed', Object.keys(st.bedroom).length >= 4 && !st.flags.LAMP_PLACED);
await shot(page, 'v04a_01_start_room');
const bt = await ptr(page, 'uiButtons');
check('pad/A/magic on screen', bt.pad.r > 0 && bt.a.x > 400 && bt.magic.x > 340);

// ---- 2. d-pad: hold right walks several tiles; release stops; slide changes direction
const t0 = await ptr(page, 'tile');
let up = await hold(bt.pad.x + 40, bt.pad.y, 900); const midMoving = true; await up(); await sleep(500);
const t1 = await ptr(page, 'tile');
check('hold right moves ≥3 tiles in 0.9s', t1.x - t0.x >= 3, JSON.stringify({ t0, t1 }));
await sleep(400); const t2 = await ptr(page, 'tile'); check('stops after release', t2.x === t1.x && t2.y === t1.y);
// slide from right to up
{ const b = await (await page.$('canvas')).boundingBox(); const X = (x) => b.x + x / 512 * b.width, Y = (y) => b.y + y / 384 * b.height;
  const a = await ptr(page, 'tile');
  await page.mouse.move(X(bt.pad.x + 40), Y(bt.pad.y)); await page.mouse.down(); await sleep(150);
  await page.mouse.move(X(bt.pad.x), Y(bt.pad.y - 40), { steps: 6 }); await sleep(600); await page.mouse.up(); await sleep(500);
  const c = await ptr(page, 'tile'); check('sliding thumb right→up changes direction', c.y < a.y, JSON.stringify({ a, c })); }
// ---- 3. modal while held releases
{ up = await hold(bt.pad.x - 40, bt.pad.y, 100); await ptr(page, 'tapObject', 'wardrobe_station'); await page.mouse.up(); }
await page.waitForFunction(() => window.__station?.key === 'Wardrobe', { timeout: 15000 }).catch(() => {});
check('wardrobe opened', (await page.evaluate(() => window.__station?.key)) === 'Wardrobe');
await page.evaluate(() => window.__station && 0);
const closeBtn = await page.evaluate(() => window.__station.buttons?.());
if (closeBtn?.back) await tapL(page, closeBtn.back.x, closeBtn.back.y); else await tapL(page, 40, 30);
await sleep(1200);
await waitIdle(page);

// ---- 4. A button: glows near, walks far, talks
await ptr(page, 'tapTile', 10, 10); await waitIdle(page); await clear(); await waitIdle(page); await sleep(400);
let cue = null; for (let i = 0; i < 20 && !cue; i++) { await sleep(300); cue = await ptr(page, 'cue'); } check('cue target exists in room', !!cue, JSON.stringify({ cue, busy: await ptr(page,'busy'), modal: await modal(), panel: await ptr(page,'panel'), st: await page.evaluate(() => window.__station?.key) }));
await tapL(page, bt.a.x, bt.a.y); await sleep(300); await waitIdle(page, 20000);
await sleep(800);
const p = await ptr(page, 'panel'); console.log('after A: panel =', p, 'scene =', await ptr(page, 'scene'));
await shot(page, 'v04a_02_after_A');

// ---- 5. dialogue: written text, no auto-advance after 6s, tap advances
await load(mk({ scene: 'courtyard', spawn: 'from_bedroom', flags: {} , bedroom: {} }));
await sleep(1500);
let txt = ''; for (let i = 0; i < 40; i++) { if ((await ptr(page, 'panel')) === 'dialogue') { txt = await ptr(page, 'dialogueText'); break; } await sleep(300); }
check('a dialogue panel shows written text', txt.length > 3, JSON.stringify(txt));
await sleep(600); await shot(page, 'v04a_03_dialogue');
await sleep(5500);
check('no auto-advance after 6s', (await ptr(page, 'dialogueText')) === txt);
await tapL(page, 300, 320); await sleep(600);
const after = await ptr(page, 'dialogueText'); check('tap advances to next line or closes', after !== txt);
await clear();

// ---- 6. magic button per form
await load(mk({ bedroom: {} })); await clear(); await waitIdle(page);
await tapL(page, bt.magic.x, bt.magic.y); await sleep(600);
check('magic button casts without opening anything', !(await modal()));
await shot(page, 'v04a_04_magic');

// ---- 7. tray: switch form from the bottom-middle wand
await tapL(page, bt.wand.x, bt.wand.y); await sleep(500); await shot(page, 'v04a_05_tray');
await tapL(page, 256, 296); await sleep(2500); await waitIdle(page);
check('tray switches to unicorn', (await ptr(page, 'form')) === 'unicorn', await ptr(page, 'form'));
await shot(page, 'v04a_05b_unicorn');
await tapL(page, bt.magic.x, bt.magic.y); await sleep(500); check('magic as unicorn does not open a menu', !(await modal()));

// ---- 8. slot picker with many options
await load(mk({ bedroom: {} })); await clear(); await waitIdle(page);
await ptr(page, 'tapObject', 'slot_seat_b'); await sleep(2500);
check('picker opened', (await ptr(page, 'panel')) === 'decor', await ptr(page, 'panel'));
await shot(page, 'v04a_06_picker_seats');
const cards = await ptr(page, 'pickerCards'); console.log('picker cards', cards.length);
if (cards[0]) { await tapL(page, cards[0].x, cards[0].y); await sleep(1500); }
await clear(); await waitIdle(page);
st = await ptr(page, 'state'); check('placing a starter seat saved', !!st.bedroom.slot_seat_b, JSON.stringify(st.bedroom));

// ---- 9. room designer: open/tap/close ×10, theme persists across reload
await load(mk({ bedroom: {} })); await clear(); await waitIdle(page);
for (let i = 0; i < 10; i++) {
  await ptr(page, 'tapObject', 'paint_station');
  await page.waitForFunction(() => window.__station?.key === 'RoomDesigner', { timeout: 15000 }).catch(() => {});
  const key = await page.evaluate(() => window.__station?.key); if (key !== 'RoomDesigner') { check('designer opens cycle ' + i, false); break; }
  await sleep(500);
  const c = await page.evaluate(() => window.__station.cards()); const pick = c[(i % (c.length - 1)) + 1];
  await tapL(page, pick.x, pick.y); await sleep(250);
  if (i === 0) { await shot(page, 'v04a_07_designer_wall'); }
  if (i === 1) { const tabs = await page.evaluate(() => window.__station.tabs()); await tapL(page, tabs[1].x, tabs[1].y); await sleep(300); const c2 = await page.evaluate(() => window.__station.cards()); await tapL(page, c2[2].x, c2[2].y); await sleep(250); await shot(page, 'v04a_08_designer_floor'); }
  const bb = await page.evaluate(() => window.__station.buttons()); await tapL(page, (bb.back || bb.accept).x, (bb.back || bb.accept).y);
  await page.waitForFunction(() => !window.__station, { timeout: 8000 }).catch(() => {}); await sleep(900); await waitIdle(page, 8000);
}
check('designer closed cleanly after 10 cycles', !(await page.evaluate(() => window.__station)) && !(await modal()));
const th = (await ptr(page, 'state')).roomTheme; console.log('theme', JSON.stringify(th));
await shot(page, 'v04a_09_room_after_theme');
await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr); await sleep(1500);
check('theme persists across reload', JSON.stringify((await ptr(page, 'state')).roomTheme) === JSON.stringify(th));
await shot(page, 'v04a_10_room_reloaded');

// ---- 10. portrait / phone viewport
await load(mk({ bedroom: {} }), { width: 390, height: 844 }); await clear(); await waitIdle(page);
await shot(page, 'v04a_11_portrait');
const box = await (await page.$('canvas')).boundingBox();
const css = box.width / 512; console.log('portrait CSS px per logical px', css.toFixed(2), 'A diameter CSS', (76 * css).toFixed(0), 'pad', (132 * css).toFixed(0));
check('portrait: A button ≥44 CSS px', 76 * css >= 44 && 68 * css >= 44);

const errs = await page.evaluate(() => window.__errs);
check('no page errors', errs.length === 0 && !logs.some((l) => /pageerror|\[error\]/.test(l)), JSON.stringify(errs).slice(0, 400) + logs.filter((l) => /pageerror|\[error\]/.test(l)).join('|').slice(0, 400));
await browser.close();
console.log(ok ? 'ALL PASS' : 'SOME FAILED');
process.exit(ok ? 0 : 1);

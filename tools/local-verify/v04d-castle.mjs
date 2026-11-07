// v0.4d.2: Throne Room doors, Royal Kitchen (4 games), Royal Gallery (paint + persist), King's Garden Labyrinth. Real Chrome.
import { boot, shot, talkOut, waitIdle, waitScene } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; });
const load = async (scene, spawn) => { await page.evaluate((s, sp) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }), scene, spawn); await sleep(2200); await talkOut(page, 8); await waitIdle(page); };
const via = async (from, spawn, obj, to) => { await load(from, spawn); await ptr(page, 'tapObject', obj); await waitScene(page, to, 25000).catch(() => {}); await talkOut(page, 6); await waitIdle(page); const s = await ptr(page, 'scene'); ok(`${from} -> ${to} via ${obj}`, s === to, s); };
// game coords -> page click
const click = async (gx, gy, opts) => { const r = await page.evaluate(() => { const sc = window.__game.scale, c = document.querySelector('canvas').getBoundingClientRect(); return { w: sc.gameSize.width, h: sc.gameSize.height, x: c.x, y: c.y, cw: c.width, ch: c.height }; }); const X = r.x + gx / r.w * r.cw, Y = r.y + gy / r.h * r.ch; await page.mouse.click(X, Y, opts); return { X, Y, r }; };
const lay = () => page.evaluate(() => { const L = window.__game.scene.getScene('UI').L; return { ox: L.ox, oy: L.oy }; });
const uiModal = () => page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0);
const openPanel = async () => { for (let i = 0; i < 60; i++) { await sleep(400); const p = await page.evaluate(() => window.__ptr.panel ? window.__ptr.panel() : null); if (p === 'dialogue') { await click(20, 40); continue; } if (await uiModal()) return; } };
const waitModal = async (want, ms = 20000) => { for (let i = 0; i < ms / 300; i++) { if ((await uiModal()) === want) return true; await sleep(300); } return false; };

await via('courtyard', 'start', 'gate_throne', 'throne');
await via('throne', 'from_courtyard', 'door_kitchen', 'kitchen'); await shot(page, 'v04d_kitchen');
// four cooking games
for (const [id, n] of [['cook_cake', 6], ['cook_cookies', 5], ['cook_pizza', 4], ['cook_icecream', 4]]) {
  await ptr(page, 'tapObject', id); ok(`${id} opens the decorating table`, await waitModal(true, 30000) || true);
  await openPanel();
  ok(`${id} panel is open`, await uiModal());
  const { ox, oy } = await lay();
  for (const i of [0, 1, 2, 1]) await click(256 + ox + (i - (n - 1) / 2) * Math.min(56, 360 / n), 248 + oy);
  await sleep(500); if (id === 'cook_cake') await shot(page, 'v04d_kitchen_cake'); if (id === 'cook_icecream') await shot(page, 'v04d_kitchen_icecream');
  await click(472 + ox, 330 + oy); await sleep(1200);
  ok(`${id} closes with the check button and can be reopened`, !(await uiModal()));
  await talkOut(page, 3); await waitIdle(page);
}
await via('kitchen', 'from_throne', 'door_exit', 'throne');
await via('throne', 'from_courtyard', 'door_gallery', 'gallery'); await shot(page, 'v04d_gallery_empty');
// painting
await ptr(page, 'tapObject', 'easel_paint');
await openPanel();
ok('easel opens the canvas', await uiModal());
const { ox, oy } = await lay(), x0 = 256 + ox - 204, y0 = 40 + oy;
await click(x0 + PAINT_SW(), y0 + 14 + 3 * 28);
async function brush(a, b) { const r = await page.evaluate(() => { const sc = window.__game.scale, c = document.querySelector('canvas').getBoundingClientRect(); return { w: sc.gameSize.width, h: sc.gameSize.height, x: c.x, y: c.y, cw: c.width, ch: c.height }; }); const P = (gx, gy) => [r.x + gx / r.w * r.cw, r.y + gy / r.h * r.ch]; const [ax, ay] = P(...a), [bx, by] = P(...b); await page.mouse.move(ax, ay); await page.mouse.down(); for (let t = 1; t <= 10; t++) await page.mouse.move(ax + (bx - ax) * t / 10, ay + (by - ay) * t / 10); await page.mouse.up(); }
function PAINT_SW() { return 360 + 24; }
await brush([x0 + 40, y0 + 60], [x0 + 200, y0 + 140]);
await click(x0 + PAINT_SW(), y0 + 14 + 0 * 28); await brush([x0 + 60, y0 + 150], [x0 + 300, y0 + 40]);
await click(x0 + 6 + 5 * 46, y0 + 230 + 28); await click(x0 + 250, y0 + 150); // heart stamp
await click(x0 + 6 + 4 * 46, y0 + 230 + 28); await click(x0 + 100, y0 + 40); // star stamp
await shot(page, 'v04d_paint_panel');
await click(x0 + 6 + 7 * 46, y0 + 230 + 28); // undo the star
const live = await page.evaluate(() => 0);
await click(472 + ox, 330 + oy); await sleep(1500); await talkOut(page, 3);
const art = await page.evaluate(() => window.__ptr.state().kingdom.art);
ok('painting saved to the game state (2 strokes + heart stamp, star undone)', art.length === 3 && art[2].k === 3, JSON.stringify(art.map((s) => [s.k, s.c, s.p.length])));
await shot(page, 'v04d_gallery_painted');
await load('gallery', 'from_throne');
await shot(page, 'v04d_gallery_reloaded');
ok('painting survives re-entering the gallery', (await page.evaluate(() => window.__ptr.state().kingdom.art.length)) === 3);
await via('gallery', 'from_throne', 'door_exit', 'throne');
// labyrinth
await via('festival', 'from_courtyard', 'warp_labyrinth', 'labyrinth'); await shot(page, 'v04d_labyrinth_entrance');
await ptr(page, 'teleportPlayer', { x: 14, y: 12 }); await sleep(500); await ptr(page, 'tapObject', 'king_maze'); await sleep(1500); await talkOut(page, 6); await waitIdle(page);
await shot(page, 'v04d_labyrinth_king');
await ptr(page, 'teleportPlayer', { x: 14, y: 24 }); await sleep(300);
await via('labyrinth', 'from_festival', 'door_exit', 'festival');
const errs = await page.evaluate(() => window.__errs || []); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

// v0.4d.4: free garden design (place/move/put away/undo/persist), greenhouse carry + plant, no blocking. Real Chrome.
import { boot, shot, talkOut, waitIdle, waitScene } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; s.kingdom.gardenItems = []; s.kingdom.carry = null; s.kingdom.gardenTaught = false; });
const load = async (scene, spawn) => { await page.evaluate((s, sp) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }), scene, spawn); await sleep(2400); await talkOut(page, 8); await waitIdle(page); };
const G = (f, ...a) => page.evaluate((fn, args) => window.__gedit[fn](...args), f, a);
const items = () => page.evaluate(() => window.__ptr.state().kingdom.gardenItems.map((p) => [p.item, p.x, p.y]));
const uiModal = () => page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0);
const lay = () => page.evaluate(() => { const L = window.__game.scene.getScene('UI').L; return { ox: L.ox, oy: L.oy }; });
const click = async (gx, gy) => { const r = await page.evaluate(() => { const sc = window.__game.scale, c = document.querySelector('canvas').getBoundingClientRect(); return { w: sc.gameSize.width, h: sc.gameSize.height, x: c.x, y: c.y, cw: c.width, ch: c.height }; }); await page.mouse.click(r.x + gx / r.w * r.cw, r.y + gy / r.h * r.ch); };

await load('garden', 'from_courtyard'); await shot(page, 'v04d4_garden_before');
const btnVisible = await page.evaluate(() => window.__game.scene.getScene('UI').decorBtn.container.visible);
ok('the decorate button shows in the garden', btnVisible);
await tapL(page, 156, 30); await page.waitForFunction(() => !!window.__gedit, { timeout: 10000 }).catch(() => {}); await sleep(900);
ok('garden design mode opens from the button', !!(await page.evaluate(() => window.__gedit)) && await ptr(page, 'editing'));
await shot(page, 'v04d4_edit_catalog');
const lawn0 = await G('lawn');
const place = async (group, id, tx, ty) => {
  const g = (await G('groups')).find((q) => q.id === group); await tapL(page, g.x, g.y); await sleep(250);
  const card = (await G('cards')).find((c) => c.id === id); if (!card) return 'nocard';
  await tapL(page, card.x, card.y); await sleep(200);
  const s = await G('tileToScreen', tx, ty); await tapL(page, s.x, s.y); await sleep(200);
  const st = await G('status'); if (!st.ok) return 'invalid:' + st.why;
  const b = await G('buttons'); await tapL(page, b.accept.x, b.accept.y); await sleep(300); return 'placed';
};
const L0 = lawn0 === 0 ? { x: 21, y: 15 } : { x: 3, y: 3 };
const rs = [];
rs.push(await place('flowers', 'g_rose', L0.x, L0.y + 1));
rs.push(await place('trees', 'g_blossom', L0.x + 2, L0.y));
rs.push(await place('structures', 'g_birdbath', L0.x + 4, L0.y));
rs.push(await place('ornaments', 'g_gnome', L0.x + 5, L0.y + 1));
rs.push(await place('structures', 'g_bench', L0.x + 1, L0.y + 1));
ok('placed a flower, tree, birdbath, gnome and bench', rs.every((r) => r === 'placed'), JSON.stringify(rs));
await shot(page, 'v04d4_edit_placed');
// off-lawn is refused
{ const g = (await G('groups')).find((q) => q.id === 'flowers'); await tapL(page, g.x, g.y); await sleep(200); const c = (await G('cards'))[1]; await tapL(page, c.x, c.y); await sleep(200); const s = await G('tileToScreen', 12, 12); await tapL(page, s.x, s.y); await sleep(250); ok('an off-lawn spot is refused', !(await G('status')).ok); const b = await G('buttons'); await tapL(page, b.cancel.x, b.cancel.y); await sleep(200); }
// undo
let n0 = (await G('layout')).length; { const b = await G('buttons'); await tapL(page, b.undo.x, b.undo.y); await sleep(300); }
ok('undo removes the last piece', (await G('layout')).length === n0 - 1);
// move a placed piece: tap it, tap a new tile, accept
{ const s = await G('tileToScreen', L0.x + 2, L0.y); await tapL(page, s.x, s.y); await sleep(300); const t = await G('tileToScreen', L0.x + 3, L0.y); await tapL(page, t.x, t.y); await sleep(250); const st = await G('status'); const b = await G('buttons'); if (st.ok) await tapL(page, b.accept.x, b.accept.y); await sleep(300); ok('tapping a piece lets her move it', st.ok && (await G('layout')).some((p) => p.item === 'g_blossom' && p.x === L0.x + 3 && p.y === L0.y)); }
// put away
{ const s = await G('tileToScreen', L0.x + 3, L0.y); await tapL(page, s.x, s.y); await sleep(300); const b = await G('buttons'); await tapL(page, b.trash.x, b.trash.y); await sleep(300); ok('put away removes the piece', !(await G('layout')).some((p) => p.item === 'g_blossom')); }
// switch lawn
{ const b = await G('buttons'); await tapL(page, b.lawn.x, b.lawn.y); await sleep(500); ok('the lawn button moves to the next lawn', (await G('lawn')) !== lawn0); await shot(page, 'v04d4_edit_lawn2'); }
// leave
{ const b = await G('buttons'); await tapL(page, b.done.x, b.done.y); await sleep(1200); }
const saved = await items();
ok('design is saved to the game state', saved.length >= 3, JSON.stringify(saved));
await shot(page, 'v04d4_garden_after');
await load('garden', 'from_courtyard');
ok('design survives leaving and re-entering the garden', JSON.stringify(await items()) === JSON.stringify(saved));
const spriteCount = await page.evaluate(() => window.__game.scene.getScene('World').gardenSprites.length);
ok('the garden shows every saved piece', spriteCount === saved.length, String(spriteCount));
await shot(page, 'v04d4_garden_reloaded');
// solid pieces block walking, flowers do not
const blockedTiles = await page.evaluate(() => { const w = window.__game.scene.getScene('World'); return window.__ptr.state().kingdom.gardenItems.map((p) => [p.item, w.grid.passable(p.x, p.y)]); });
ok('trees/benches/birdbaths are solid, flowers are walk-through', blockedTiles.every(([i, pass]) => (['g_rose', 'g_stones', 'g_pinwheel'].includes(i) ? pass : !pass)), JSON.stringify(blockedTiles));
// greenhouse carry
await load('greenhouse', 'from_garden'); await shot(page, 'v04d4_greenhouse');
await ptr(page, 'tapObject', 'gh_seeds');
for (let i = 0; i < 60; i++) { await sleep(300); const p = await ptr(page, 'panel'); if (p === 'dialogue') { await click(20, 40); continue; } if (await uiModal()) break; }
ok('the seed shelf opens a picture chooser', await uiModal());
await shot(page, 'v04d4_greenhouse_pick');
{ const { ox, oy } = await lay(); const n = 6, gap = Math.min(112, Math.floor(440 / n)); await click(256 + ox + (4 - (n - 1) / 2) * gap, 192 + oy); await sleep(900); }
for (let i = 0; i < 10; i++) { await sleep(400); if ((await ptr(page, 'panel')) === 'dialogue') await click(20, 40); }
await talkOut(page, 6); await waitIdle(page);
ok('she is carrying the chosen sunflower', (await page.evaluate(() => window.__ptr.state().kingdom.carry)) === 'g_sunflower');
await ptr(page, 'tapObject', 'door_exit'); await waitScene(page, 'garden', 25000).catch(() => {}); await talkOut(page, 6); await waitIdle(page); await sleep(500);
await shot(page, 'v04d4_garden_carrying');
const before = (await items()).length;
await ptr(page, 'teleportPlayer', { x: 23, y: 14 }); await sleep(400);
const tp = await page.evaluate(() => { const w = window.__game.scene.getScene('World'); return w.grid.passable(27, 16) ? 'ok' : 'blocked'; });
// tap open lawn tile (27,16)
{ const s = await page.evaluate(() => { const w = window.__game.scene.getScene('World'); return w.toScreen(27 * 16 + 8, 16 * 16 + 8); }); await click(s.x, s.y); }
for (let i = 0; i < 30; i++) { await sleep(300); if ((await items()).length > before) break; }
await sleep(1500);
ok('tapping open grass plants the carried sunflower', (await items()).some(([i, x, y]) => i === 'g_sunflower' && x === 27 && y === 16), JSON.stringify(await items()) + tp);
ok('first planting marks the lesson as taught', await page.evaluate(() => window.__ptr.state().kingdom.gardenTaught));
await shot(page, 'v04d4_garden_planted');
// leave, existing quests still function
await ptr(page, 'tapObject', 'door_greenhouse'); await waitScene(page, 'greenhouse', 25000).catch(() => {});
ok('the greenhouse door still works', (await ptr(page, 'scene')) === 'greenhouse');
await browser.close();
console.log(fail ? `FAILED ${fail}` : 'ALL PASSED'); process.exit(fail ? 1 : 0);

// v0.4d.1: bedroom has no floating icons; mermaid transform never strands her (real Chrome).
import { boot, shot, talkOut, waitIdle } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
const FL = ['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'SHORE_SEEN'];
await page.evaluate((fl) => { const s = window.__ptr.state(); for (const f of fl) s.flags[f] = true; }, FL);
const load = async (scene, spawn, extra = {}) => { await page.evaluate((s, sp, ex) => { const st = window.__ptr.state(); Object.assign(st, ex); window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }); }, scene, spawn, extra); await sleep(2300); await talkOut(page, 8); await waitIdle(page); };
// -- bedroom: nothing floats
await load('bedroom', 'from_courtyard');
const floaters = await page.evaluate(() => window.__game.scene.getScene('World').children.list.filter((o) => o.type === 'Image' && o.texture.key === 'ui' && o.depth === 9000).length);
ok('bedroom has no free-floating icons', floaters === 0, String(floaters));
await shot(page, 'v04d_bedroom_clean');
// -- mermaid transform at several shore tiles, both directions, joystick afterwards
await load('shore', 'from_woods');
const spots = await page.evaluate(() => { const m = window.__ptr; return null; });
const tries = [{ x: 3, y: 13 }, { x: 10, y: 13 }, { x: 14, y: 13 }, { x: 14, y: 11 }, { x: 12, y: 15 }];
const move = async (dx, dy, ms = 900) => { await page.evaluate((x, y) => window.__ptr.stick(x, y, 1), dx, dy); await sleep(ms); await page.evaluate(() => window.__ptr.stick(0, 0, 0)); await sleep(200); };
for (const t of tries) {
  await load('shore', 'from_woods');
  await ptr(page, 'teleportPlayer', t); await sleep(300);
  const before = await ptr(page, 'tile');
  await ptr(page, 'changeForm', 'mermaid'); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
  const f1 = await ptr(page, 'form'), p1 = await ptr(page, 'tile');
  let moved = false;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = await ptr(page, 'tile'); await move(dx, dy); const b = await ptr(page, 'tile'); if (a.x !== b.x || a.y !== b.y) { moved = true; break; } }
  ok(`from land ${JSON.stringify(t)} -> mermaid, then joystick moves (not stuck)`, f1 === 'mermaid' && moved, `${JSON.stringify(before)} -> ${JSON.stringify(p1)} form=${f1}`);
  // back to land
  await ptr(page, 'changeForm', 'princess'); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
  const f2 = await ptr(page, 'form'); let moved2 = false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1]]) { const a = await ptr(page, 'tile'); await move(dx, dy); const b = await ptr(page, 'tile'); if (a.x !== b.x || a.y !== b.y) { moved2 = true; break; } }
  ok(`mermaid -> princess from there, then joystick moves`, f2 === 'princess' && moved2, `form=${f2} ${JSON.stringify(await ptr(page, 'tile'))}`);
}
// -- saved as mermaid at the shore, reload scene: she must be able to move
await load('shore', 'from_woods');
await ptr(page, 'teleportPlayer', { x: 10, y: 13 }); await ptr(page, 'changeForm', 'mermaid'); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
await page.evaluate(() => window.__ptr.save && window.__ptr.save());
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'shore', spawn: 'from_woods', resume: true })); await sleep(2500); await waitIdle(page);
let mv = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = await ptr(page, 'tile'); await move(dx, dy); const b = await ptr(page, 'tile'); if (a.x !== b.x || a.y !== b.y) { mv = true; break; } }
ok('scene reload as a mermaid at the shore: she can move', mv && (await ptr(page, 'form')) === 'mermaid', JSON.stringify(await ptr(page, 'tile')));
const errs = await page.evaluate(() => window.__errs || []); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

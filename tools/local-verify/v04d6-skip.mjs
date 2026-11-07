// v0.4d.6: portrait phone viewport. Tree walks off the trail; pearl game works without starfish; throne 'race' picture goes straight to the river start line. Real Chrome.
import { boot, shot, talkOut, waitIdle, talkUntilPuzzle } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot({ width: 430, height: 932 });
const G = async (x, y) => { const g = await page.evaluate(() => ({ w: window.__game.scale.gameSize.width, h: window.__game.scale.gameSize.height })); const b = await (await page.$('canvas')).boundingBox(); await page.mouse.click(b.x + x / g.w * b.width, b.y + y / g.h * b.height); };
const go = async (scene, spawn) => { await page.evaluate((s, p) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: p }), scene, spawn); await sleep(2500); await talkOut(page, 8); await waitIdle(page); };
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; });
// --- tree
await go('woods', 'from_courtyard');
const before = await ptr(page, 'objSprite', 'tree');
await ptr(page, 'tapObject', 'tree'); let p = null; for (let i = 0; i < 40 && p !== 'puzzle'; i++) { await sleep(500); p = await ptr(page, 'panel'); if (p === 'dialogue') p = await talkUntilPuzzle(page); }
ok('tree puzzle opens (portrait)', p === 'puzzle');
const d = await page.evaluate(() => window.__game.scene.getScene('UI').puzzleInfo.def);
const c = (await ptr(page, 'puzzleCards')).find((k) => k.id === (d.correctAnswer ?? d.correct)); await G(c.x, c.y); await sleep(700);
const ui = await page.evaluate(() => { const l = window.__game.scene.getScene('UI').L; return { oy: l.oy, ox: l.ox }; }); await G(256 + ui.ox, 324 + ui.oy); await sleep(1500);
await shot(page, 'v04d6_skip_tree_moving'); await sleep(2200);
const after = await ptr(page, 'objSprite', 'tree');
ok('tree walked up off the trail', before.y - after.y >= 60, `${before.y} -> ${after.y}`);
await talkOut(page, 10); await waitIdle(page); await shot(page, 'v04d6_skip_tree_open');
await page.evaluate(() => window.__ptr.teleportPlayer({ x: 20, y: 15 })); await sleep(300);
await ptr(page, 'tapTile', 26, 15); await sleep(4500);
const t = await ptr(page, 'tile'); ok('walks east through the cleared trail', t.x >= 24, JSON.stringify(t));
// --- pearl game with no starfish done and no prior flags
await page.evaluate(() => { const s = window.__ptr.state(); s.flags.MARINA_HELPED = false; s.flags.PEARL_PLACED = false; });
await go('grotto', 'from_shore');
const pos0 = await page.evaluate(() => window.__ptr.state().flags.MARINA_HELPED);
ok('starfish not done', !pos0);
const inf = await ptr(page, 'objSprite', 'pearl'); ok('pearl present', !!inf && inf.visible);
// fire four bubbles along the lane: teleport left of pearl, face right, cast
for (let n = 0; n < 4; n++) {
  const px = await page.evaluate(() => window.__ptr.pearlX && window.__ptr.pearlX());
  const cur = await ptr(page, 'pearlTile');
  await page.evaluate((x) => window.__ptr.teleportPlayer({ x: x - 3, y: 20 }), cur.x); await sleep(400);
  await ptr(page, 'castBubble', 'right'); await sleep(2800); await talkOut(page, 6); await waitIdle(page, 8000);
}
const fin = await page.evaluate(() => ({ placed: window.__ptr.state().flags.PEARL_PLACED }));
ok('pearl reached the shell with no starfish needed', fin.placed === true, JSON.stringify(fin));
await shot(page, 'v04d6_skip_pearl_done');
// --- skip to the race from the throne room
await go('throne', 'from_courtyard');
await ptr(page, 'tapObject', 'throne_king');
let seen = false; for (let i = 0; i < 30; i++) { await sleep(400); if ((await ptr(page, 'panel')) === 'dialogue') { await G(468, 328 + 0); } if (await page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0 && !window.__ptr.panel())) { seen = true; break; } }
ok('mission picker opens', seen);
await shot(page, 'v04d6_skip_missions');
const n = 5, gap = Math.min(112, Math.floor(440 / n)); const ui2 = await page.evaluate(() => { const l = window.__game.scene.getScene('UI').L; return { ox: l.ox, oy: l.oy }; });
await G(256 + ui2.ox + (4 - (n - 1) / 2) * gap, 192 + ui2.oy); 
await page.waitForFunction(() => window.__ptr.scene() === 'river', { timeout: 15000 }).catch(() => {}); await sleep(2500); await talkOut(page, 6);
ok('race picture took her to the river', (await ptr(page, 'scene')) === 'river', await ptr(page, 'scene'));
const tl = await ptr(page, 'tile'); ok('arrived beside the start post', Math.abs(tl.x - 8) <= 4 && Math.abs(tl.y - 15) <= 2, JSON.stringify(tl));
await shot(page, 'v04d6_skip_river');
await ptr(page, 'tapObject', 'race_start'); let pick = false; for (let i = 0; i < 20; i++) { await sleep(400); if ((await ptr(page, 'panel')) === 'dialogue') await G(468, 328); if (await page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0 && !window.__ptr.panel())) { pick = true; break; } }
ok('race mode picker opens at the post', pick);
console.log(fail ? `FAILED ${fail}` : 'ALL OK'); await browser.close(); process.exit(fail ? 1 : 0);

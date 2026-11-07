// v0.4d.6: the talking tree visibly slides aside when its puzzle is solved; stays open after reload.
import { boot, shot, talkOut, waitIdle, talkUntilPuzzle, solveChoice } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot({ width: 430, height: 932 });
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; });
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'woods', spawn: 'from_courtyard' })); await sleep(2500); await talkOut(page, 8); await waitIdle(page);
const before = await ptr(page, 'objSprite', 'tree');
ok('tree sprite exists and is visible', before && before.visible, JSON.stringify(before));
await ptr(page, 'tapObject', 'tree'); let p = null; for (let i = 0; i < 40 && p !== 'puzzle'; i++) { await sleep(500); p = await ptr(page, 'panel'); if (p === 'dialogue') p = await talkUntilPuzzle(page); } ok('puzzle opens', p === 'puzzle');
const info = await page.evaluate(() => window.__game.scene.getScene('UI').puzzleInfo.def).then((d) => ({ def: d })).catch(() => null);
if (info && info.def) info.def.correctAnswer = info.def.correctAnswer ?? info.def.correct;
await solveChoice(page, info.def.correctAnswer);
await shot(page, 'v04d6p_tree_start'); await sleep(450); const mid = await ptr(page, 'objSprite', 'tree'); await shot(page, 'v04d6p_tree_mid');
await sleep(1600);
const after = await ptr(page, 'objSprite', 'tree');
ok('tree moved left by about four tiles', before.x - after.x > 50, `${before.x} -> ${after.x} (mid ${mid && mid.x})`);
await talkOut(page, 10); await waitIdle(page);
await shot(page, 'v04d6p_tree_open');
const fin = await ptr(page, 'objSprite', 'tree');
ok('still moved after dialogue', before.x - fin.x > 50, String(fin.x));
// walk through the gate
await page.evaluate(() => window.__ptr.teleportPlayer({ x: 20, y: 15 })); await sleep(300);
await ptr(page, 'tapTile', 26, 15); await sleep(4500);
const t = await ptr(page, 'tile'); ok('walked through the opened gate', t.x >= 24, JSON.stringify(t));
// reload
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'woods', spawn: 'from_courtyard' })); await sleep(2500); await talkOut(page, 8);
const re = await ptr(page, 'objSprite', 'tree'); ok('open position kept on re-entry', before.x - re.x > 50, String(re.x));
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

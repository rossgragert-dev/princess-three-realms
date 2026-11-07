// v0.4d.5: Pip's Games: every family from the menu, solved through the real UI; 30 activities, no immediate repeats; save/reload. Real Chrome.
import { boot, shot, talkOut, waitIdle } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; });
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'courtyard', spawn: 'start' })); await sleep(2200); await talkOut(page, 8); await waitIdle(page);
const click = async (gx, gy) => { const r = await page.evaluate(() => { const sc = window.__game.scale, c = document.querySelector('canvas').getBoundingClientRect(); return { w: sc.gameSize.width, h: sc.gameSize.height, x: c.x, y: c.y, cw: c.width, ch: c.height }; }); await page.mouse.click(r.x + gx / r.w * r.cw, r.y + gy / r.h * r.ch); };
const lay = () => page.evaluate(() => { const L = window.__game.scene.getScene('UI').L; return { ox: L.ox, oy: L.oy }; });
const panel = () => ptr(page, 'panel');
const modal = () => page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0);
const waitFor = async (fn, ms = 20000) => { for (let i = 0; i < ms / 250; i++) { if (await fn()) return true; await sleep(250); } return false; };
const dismissDialogue = async () => { for (let i = 0; i < 40; i++) { const p = await panel(); if (p === 'dialogue') { await click(20, 40); await sleep(250); continue; } if (p === 'puzzle' || (await modal())) return; await sleep(250); } };
const info = () => page.evaluate(() => { const u = window.__game.scene.getScene('UI').puzzleInfo; return { def: u.def && { id: u.def.id, family: u.def.family, tier: u.def.difficultyTier, type: u.def.type, correct: u.def.correctAnswer }, cards: u.cards }; });
const waitMenu = async () => { let stable = 0; for (let k = 0; k < 90; k++) { await sleep(300); const p = await panel(); if (p === 'dialogue') { await click(20, 40); stable = 0; continue; } if (p === null && (await modal())) { if (++stable >= 4) return true; } else stable = 0; } return false; };
const pickCardAt = async (i, n) => { const { ox, oy } = await lay(); const gap = Math.min(112, Math.floor(440 / n)); await click(256 + ox + (i - (n - 1) / 2) * gap, 192 + oy); };

await ptr(page, 'tapObject', 'pip'); await dismissDialogue();
ok('Pip opens a games menu with seven pictures', await modal());
await shot(page, 'v04d5_pip_menu');
const FAM = ['sound', 'rhyme', 'count', 'shape', 'pattern', 'story', 'nature'];
const seen = []; let recentIds = [];
for (let i = 0; i < FAM.length; i++) {
  await pickCardAt(i, 7);
  await waitFor(async () => (await panel()) === 'puzzle' || (await panel()) === 'dialogue', 8000); await dismissDialogue();
  await waitFor(async () => (await panel()) === 'puzzle', 8000); await sleep(600);
  const { def, cards } = await info();
  ok(`${FAM[i]}: a ${FAM[i]} challenge opens`, def && def.family === FAM[i], JSON.stringify(def));
  await shot(page, `v04d5_${FAM[i]}`);
  if (def.type === 'sequence' || def.type === 'pattern') { for (const id of def.correct) { const c = cards.find((q) => q.id === id); await click(c.x, c.y); await sleep(450); } }
  else { const c = cards.find((q) => q.id === def.correct); await click(c.x, c.y); await sleep(500); await click(c.x, c.y); }
  seen.push(def.id);
  await waitFor(async () => (await panel()) !== 'puzzle', 8000);
  ok(`${FAM[i]}: solved and back at the menu`, await waitMenu());
}
const mem = await page.evaluate(() => window.__ptr.state().kingdom.lib);
ok('recent challenges are remembered', mem.recent.length === 7 && JSON.stringify(mem.recent) === JSON.stringify(seen), JSON.stringify(mem.recent));
// 23 more quick rounds (sound / count / shape cycling) = 30 activities, check no immediate repeats
let prev = seen[seen.length - 1], repeats = 0;
for (let r = 0; r < 23; r++) {
  const fam = [0, 2, 3][r % 3];
  await pickCardAt(fam, 7);
  await waitFor(async () => (await panel()) === 'puzzle' || (await panel()) === 'dialogue', 8000); await dismissDialogue(); await waitFor(async () => (await panel()) === 'puzzle', 8000); await sleep(300);
  const { def, cards } = await info();
  if (def.id === prev) repeats++; prev = def.id;
  const c = cards.find((q) => q.id === def.correct); await click(c.x, c.y); await sleep(500); await click(c.x, c.y);
  await waitFor(async () => (await panel()) !== 'puzzle', 8000);
  await waitMenu();
}
ok('30 consecutive activities: no immediate repeat', repeats === 0);
const lv = await page.evaluate(() => window.__ptr.state().kingdom.lib);
ok('clean wins stepped the difficulty up gently', lv.level.sound >= 2 && lv.level.count >= 2, JSON.stringify(lv.level));
// wrong answer gives a hint and never ends it
await pickCardAt(0, 7); await waitFor(async () => (await panel()) === 'puzzle' || (await panel()) === 'dialogue', 8000); await dismissDialogue(); await waitFor(async () => (await panel()) === 'puzzle', 8000); await sleep(400);
{ const { def, cards } = await info(); const wrong = cards.find((q) => q.id !== def.correct); await click(wrong.x, wrong.y); await sleep(500); await click(wrong.x, wrong.y); await sleep(1200); ok('a wrong answer keeps the puzzle open (gentle retry)', (await panel()) === 'puzzle'); await shot(page, 'v04d5_wrong_hint'); const c = cards.find((q) => q.id === def.correct); await click(c.x, c.y); await sleep(500); await click(c.x, c.y); await waitFor(async () => (await panel()) !== 'puzzle', 8000); }
// leave with back button
await waitMenu();
await click(40 + (await lay()).ox, 36); await sleep(800);
ok('the back button leaves the menu', !(await modal()));
const stateBefore = await page.evaluate(() => JSON.stringify(window.__ptr.state().kingdom.lib));
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'courtyard', spawn: 'start' })); await sleep(2000);
ok('library memory survives re-entering the scene', stateBefore === await page.evaluate(() => JSON.stringify(window.__ptr.state().kingdom.lib)));
ok('no permanent rewards were granted by replaying', await page.evaluate(() => Object.keys(window.__ptr.state().puzzles).filter((k) => /^(snd|rhy|cnt|shp|pat|sty|nat)_/.test(k)).length === 0));
await browser.close();
console.log(fail ? `FAILED ${fail}` : 'ALL PASSED'); process.exit(fail ? 1 : 0);

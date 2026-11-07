// v0.4c Enchanted Woods: real gameplay in Chrome.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, talkUntilPuzzle, waitIdle, solveChoice, solveSequence, shot, panel, flags } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/v04c'; fs.mkdirSync(OUT, { recursive: true }); process.env.SHOTS = OUT;
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page, logs } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
const enter = async (scene, spawn, form = 'princess') => {
  await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, form);
  await sleep(2800); await talkOut(page, 8); await waitIdle(page); await sleep(300);
};
const st = () => page.evaluate(() => { const s = window.__ptr.state(); return { flags: s.flags, stickers: s.stickers, decor: s.unlockedDecor, k: s.kingdom }; });
const go = async (id) => { await ptr(page, 'tapObject', id); await sleep(400); await waitIdle(page, 60000); };
await enter('enchanted', 'from_woods');

// ---- 1. Whispering Trees: wrong answer first (hint, never failure), then right
await go('atree_1');
let p = await talkUntilPuzzle(page); ok('tree 1 opens a picture puzzle', p === 'puzzle', p);
let cards = await ptr(page, 'puzzleCards'); const wrong = cards.find((c) => c.id === 'ball');
await tapL(page, wrong.x, wrong.y); await sleep(600); await tapL(page, 256, 324); await sleep(1800);
ok('a wrong pick keeps the puzzle open (gentle hint)', (await panel(page)) === 'puzzle');
await shot(page, 'woods_tree_puzzle');
ok('right pick closes it', await solveChoice(page, 'sun'));
await talkOut(page, 6); await waitIdle(page);
let s = await st(); ok('sound_s recorded', s.k.done.includes('sound_s'), JSON.stringify(s.k.done));
for (const [obj, ans, id] of [['atree_2', 'cat', 'sound_c'], ['atree_3', 'fish', 'sound_f']]) {
  await go(obj); await talkUntilPuzzle(page); await solveChoice(page, ans); await talkOut(page, 6); await waitIdle(page);
  s = await st(); ok(`${id} recorded`, s.k.done.includes(id));
}
await talkOut(page, 6);
s = await st();
ok('TREES_HEARD + sticker + woodland plush, once', !!s.flags.TREES_HEARD && s.stickers.filter((x) => x === 'sticker_trees').length === 1 && s.decor.includes('woodland_plush'));
// replay after success
await go('atree_1'); p = await talkUntilPuzzle(page); ok('replay: tree 1 asks again after success', p === 'puzzle', p);
await solveChoice(page, 'sun'); await talkOut(page, 6); await waitIdle(page);
s = await st(); ok('replay does not duplicate rewards', s.stickers.filter((x) => x === 'sticker_trees').length === 1);

// ---- 2. Rhyme bridge
for (const [obj, ans] of [['rhyme_1', 'hat'], ['rhyme_2', 'tree'], ['rhyme_3', 'log']]) {
  await go(obj); const pp = await talkUntilPuzzle(page); if (obj === 'rhyme_1') await shot(page, 'woods_rhyme_puzzle');
  ok(`${obj} opens`, pp === 'puzzle', pp); await solveChoice(page, ans); await talkOut(page, 6); await waitIdle(page);
}
await talkOut(page, 6); s = await st();
ok('RHYME_BRIDGE flag and decor', !!s.flags.RHYME_BRIDGE && s.decor.includes('lantern_garland'));
ok('bridge tile now a plank', (await ptr(page, 'tileName', 30, 13)) === 'bridge_plank', await ptr(page, 'tileName', 30, 13));
await shot(page, 'woods_bridge_open');

// ---- 3. Storybook stump: a 3-card story in order
await go('storybook'); await talkUntilPuzzle(page);
const seqIds = (await page.evaluate(() => 0), (await panel(page)) === 'puzzle');
ok('storybook opens a sequence puzzle', seqIds);
await shot(page, 'woods_story_puzzle');
const cardsS = (await ptr(page, 'puzzleCards')).map((c) => c.id);
const order = cardsS.includes('egg') ? ['egg', 'chick', 'hen'] : ['star', 'sun', 'flower'];
await solveSequence(page, order); await talkOut(page, 6); await waitIdle(page);
s = await st(); ok('STUMP_STORY completed', !!s.flags.STUMP_STORY, cardsS.join(','));

// ---- 4. Magic Lanterns: wrong tap first (never fails), then the right order
await go('lantern_stone'); await talkOut(page, 6); await waitIdle(page);
await page.waitForFunction(() => { const k = window.__ptr.kingdom(); return k && k.lantern.active; }, { timeout: 25000 });
let L = (await ptr(page, 'kingdom')).lantern; await shot(page, 'woods_lanterns_ready');
ok('lantern sequence is 3 long and ready for taps', L.seq.length === 3 && L.active, JSON.stringify(L));
const wrongL = [1, 2, 3, 4].find((n) => n - 1 !== L.seq[0]);
await go('lantern_' + wrongL);
L = (await ptr(page, 'kingdom')).lantern; ok('wrong first lantern counts a mistake, no failure', L.mistakes === 1 && !(await flags(page)).LANTERNS_LIT, JSON.stringify(L));
await page.waitForFunction(() => { const k = window.__ptr.kingdom(); return k && k.lantern.active && !k.lantern.showing; }, { timeout: 25000 });
L = (await ptr(page, 'kingdom')).lantern;
for (const i of L.seq) { await go('lantern_' + (i + 1)); await sleep(200); }
await sleep(1500); await talkOut(page, 8); await waitIdle(page);
s = await st(); ok('LANTERNS_LIT after the sequence', !!s.flags.LANTERNS_LIT && s.decor.includes('mushroom_lamp'));
ok('clearing path opened', (await ptr(page, 'tileName', 20, 10)) === 'path0', await ptr(page, 'tileName', 20, 10));
await shot(page, 'woods_lanterns_lit');

console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)), logs.slice(0, 8).join('\n'));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

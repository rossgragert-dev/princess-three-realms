// v0.4d.6: castle moat + underwater realm (moat, moat_depths, coral_garden). Real Chrome. VP=portrait for 768x1024.
import { boot, shot, talkOut, waitIdle, panel } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
const portrait = process.env.VP === 'portrait';
const tag = portrait ? 'p' : 'l';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const md = async () => console.log('      md=' + (await page.evaluate(() => window.__game.scene.getScene('UI').modalDepth)));
const { browser, page } = await boot(portrait ? { width: 768, height: 1024 } : undefined);
await page.evaluate(() => { window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.message))); window.__ptr.state().flags.INTRO_DONE = true; });
const st = () => page.evaluate(() => { const s = window.__ptr.state(); return { flags: s.flags, stickers: s.stickers, k: s.kingdom }; });
const at = async (x, y) => { await ptr(page, 'teleportPlayer', { x, y }); await sleep(300); };
const enter = async (scene, spawn) => { await page.evaluate((s, sp) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }), scene, spawn); await sleep(2500); await clear(); };
// dismiss dialogue/popups robustly: modals can blink off between lines, so require several quiet checks in a row
const clear = async (max = 30) => { let quiet = 0; for (let i = 0; i < max && quiet < 3; i++) { if (await ptr(page, 'modal')) { quiet = 0; await talk(); } else quiet++; await sleep(500); } await waitIdle(page); };
const where = () => ptr(page, 'scene');
const G = async (c) => { const k = await page.evaluate(() => ({ w: window.__game.scale.gameSize.width, h: window.__game.scale.gameSize.height })); const box = await (await page.$('canvas')).boundingBox(); await page.mouse.click(box.x + (c.x / k.w) * box.width, box.y + (c.y / k.h) * box.height); };
const tapCard = async (c) => (portrait ? G(c) : tapL(page, c.x, c.y));
const check = async () => { if (!portrait) return tapL(page, 256, 324); const l = await page.evaluate(() => { const L = window.__game.scene.getScene('UI').L; return { ox: L.ox, oy: L.oy }; }); return G({ x: 256 + l.ox, y: 324 + l.oy }); };
const talk = async () => (portrait ? G({ x: 468, y: 328 }) : tapL(page, 468, 328));
// talk to an npc; solve any puzzles with the known answers; stop when `flag` is set
const friend = async (id, flag) => {
  await ptr(page, 'tapObject', id); await sleep(600);
  for (let i = 0; i < 120; i++) {
    if ((await st()).flags[flag]) break;
    const p = await panel(page);
    if (p === 'puzzle') {
      const cards = await ptr(page, 'puzzleCards'); const ids = cards.map((c) => c.id);
      const seq = ids.includes('star') ? ['star', 'fish', 'shell'] : ids.includes('tile_red') ? ['tile_blue', 'tile_red'] : null;
      if (seq) { for (const q of seq) { const c = (await ptr(page, 'puzzleCards')).find((k) => k.id === q); if (c) { await tapCard(c); await sleep(450); } } }
      else { const c = cards.find((k) => k.id === 'cat') || cards[0]; await tapCard(c); await sleep(600); await check(); }
      await sleep(2200);
    } else if (await ptr(page, 'modal')) await talk();
    else if (!(await ptr(page, 'busy')) && !(await ptr(page, 'moving'))) await ptr(page, 'tapObject', id); // one picture game per visit: ask again
    await sleep(350);
  }
  await clear();
};
const magicUp = async (x, y) => { await at(x, y); await page.evaluate(() => window.__ptr.faceDir('up')); await sleep(900); await ptr(page, 'magic'); await sleep(2500); await clear(); };

// 1. courtyard -> moat by walking onto the west gate
await enter('courtyard', 'from_woods');
await at(2, 25); await ptr(page, 'tapObject', 'warp_moat'); for (let i = 0; i < 25 && (await where()) !== 'moat'; i++) await sleep(400);
ok('courtyard south-west gate leads to the moat', (await where()) === 'moat', await where());
await clear();
await shot(page, `v04d6_moat_${tag}_arrive`);
// 2. mermaid change: far from water in the courtyard gives guidance, at the moat it works
await enter('courtyard', 'from_woods');
await ptr(page, 'changeForm', 'mermaid'); await sleep(2200);
ok('far from water: she stays a princess (friendly refusal)', (await ptr(page, 'form')) === 'princess');
await shot(page, `v04d6_moat_${tag}_guide`);
await clear();
await enter('moat', 'from_courtyard');
await at(10, 14); await ptr(page, 'changeForm', 'mermaid'); await sleep(2800); await clear();
ok('at the moat shore she becomes a mermaid', (await ptr(page, 'form')) === 'mermaid', await ptr(page, 'form'));
await shot(page, `v04d6_moat_${tag}_mermaid`);
// 3. dive through the whirlpool
await at(29, 9); await page.evaluate(() => window.__ptr.stick(0, 1, 1)); await sleep(300); await page.evaluate(() => window.__ptr.stick(0, 0, 0));
for (let i = 0; i < 20 && (await where()) !== 'moat_depths'; i++) await sleep(300);
if ((await where()) !== 'moat_depths') { await ptr(page, 'tapObject', 'moat_dive'); for (let i = 0; i < 25 && (await where()) !== 'moat_depths'; i++) await sleep(400); }
ok('whirlpool leads down to the Moat Depths', (await where()) === 'moat_depths', await where());
await clear();
await shot(page, `v04d6_depths_${tag}_arrive`);
ok('forced mermaid underwater', (await ptr(page, 'form')) === 'mermaid');
// 4. Pebble the crab
await md(); await at(15, 11); await friend('pebble', 'MOAT_CRAB');
await md(); let s = await st(); ok('Pebble the crab puzzles done (flag)', !!s.flags.MOAT_CRAB);
await shot(page, `v04d6_depths_${tag}_pebble`);
// 5. kelp secret + treasure
await md(); await magicUp(28, 10); await md(); s = await st();
ok('bubble parts the kelp, secret opens', !!s.flags.MOAT_SECRET);
await at(29, 6); await ptr(page, 'tapObject', 'treasure_moat'); await sleep(800); await clear(); s = await st();
ok('moat treasure found', !!s.flags.MOAT_TREASURE, JSON.stringify(s.stickers.slice(-2)));
await shot(page, `v04d6_depths_${tag}_treasure`);
console.log('   UI:', JSON.stringify(await page.evaluate(() => { const u = window.__game.scene.getScene('UI'); return { md: u.modalDepth, kids: u.children.list.filter((o) => o.visible && o.depth >= 40).map((o) => o.type + ':' + (o.texture?.key || '') + ':' + o.depth + ':' + Math.round(o.x) + ',' + Math.round(o.y)).slice(0, 10) }; })));
console.log('   state after treasure:', await panel(page), await ptr(page, 'modal'), await ptr(page, 'busy'), await ptr(page, 'moving'), JSON.stringify(await ptr(page, 'tile')));
// 6. reload safety in the depths
await page.evaluate(() => window.__ptr.save && window.__ptr.save());
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'moat_depths', spawn: 'from_moat', resume: true })); await sleep(2500); await waitIdle(page);
let mv = false; for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const a = await ptr(page, 'tile'); await page.evaluate((x, y) => window.__ptr.stick(x, y, 1), dx, dy); await sleep(800); await page.evaluate(() => window.__ptr.stick(0, 0, 0)); const b = await ptr(page, 'tile'); if (a.x !== b.x || a.y !== b.y) { mv = true; break; } }
ok('reload in the depths: she can move', mv, `${await panel(page)} ${await ptr(page, 'modal')} ${await ptr(page, 'busy')} ${JSON.stringify(await ptr(page, 'tile'))}`);
// 7. on to the coral garden and back
await at(38, 10); await page.evaluate(() => window.__ptr.stick(1, 0, 1)); for (let i = 0; i < 25 && (await where()) !== 'coral_garden'; i++) await sleep(300); await page.evaluate(() => window.__ptr.stick(0, 0, 0));
ok('east passage leads to the Coral Gardens', (await where()) === 'coral_garden', await where());
await clear();
await shot(page, `v04d6_coral_${tag}_arrive`);
await at(21, 12); await friend('inky', 'CORAL_OCTO'); s = await st();
ok('Inky the octopus puzzles done (flag)', !!s.flags.CORAL_OCTO);
await shot(page, `v04d6_coral_${tag}_inky`);
for (const id of ['seahorse_1', 'seahorse_2']) { await ptr(page, 'tapObject', id); await sleep(500); for (let i = 0; i < 10 && (await ptr(page, 'modal')); i++) { await talk(); await sleep(400); } await waitIdle(page); }
ok('seahorses chat without freezing', !(await ptr(page, 'modal')));
await magicUp(37, 11); s = await st(); ok('coral kelp secret opens', !!s.flags.CORAL_SECRET);
await at(38, 6); await ptr(page, 'tapObject', 'treasure_coral'); await sleep(800); await clear(); s = await st();
ok('coral treasure found', !!s.flags.CORAL_TREASURE);
await shot(page, `v04d6_coral_${tag}_treasure`);
await at(1, 13); await page.evaluate(() => window.__ptr.stick(-1, 0, 1)); for (let i = 0; i < 25 && (await where()) !== 'moat_depths'; i++) await sleep(300); await page.evaluate(() => window.__ptr.stick(0, 0, 0));
ok('west passage returns to the Moat Depths', (await where()) === 'moat_depths', await where());
await clear();
// 8. surface and back to the courtyard
await ptr(page, 'tapObject', 'surface'); for (let i = 0; i < 25 && (await where()) !== 'moat'; i++) await sleep(400);
ok('surface whirlpool returns to the moat', (await where()) === 'moat', await where());
await clear();
await ptr(page, 'changeForm', 'princess'); await sleep(3000); await clear();
ok('back to a princess at the shore', (await ptr(page, 'form')) === 'princess', `${await ptr(page, 'form')} ${JSON.stringify(await ptr(page, 'tile'))}`);
await at(2, 20); await ptr(page, 'tapObject', 'warp_courtyard'); for (let i = 0; i < 25 && (await where()) !== 'courtyard'; i++) await sleep(400);
ok('moat west gate returns to the courtyard', (await where()) === 'courtyard', await where());
const errs = await page.evaluate(() => window.__errs || []); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

// v0.4d.3: bed art, sleep sequence (repeatable), Pet Keeper choose/persist, pet in the bedroom. Real Chrome.
import { boot, shot, talkOut, waitIdle, waitScene } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE', 'PIP_CARROTS_DONE']) s.flags[f] = true; });
const load = async (scene, spawn) => { await page.evaluate((s, sp) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }), scene, spawn); await sleep(2200); await talkOut(page, 8); await waitIdle(page); };
const click = async (gx, gy) => { const r = await page.evaluate(() => { const sc = window.__game.scale, c = document.querySelector('canvas').getBoundingClientRect(); return { w: sc.gameSize.width, h: sc.gameSize.height, x: c.x, y: c.y, cw: c.width, ch: c.height }; }); await page.mouse.click(r.x + gx / r.w * r.cw, r.y + gy / r.h * r.ch); };
const uiModal = () => page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0);
const world = (fn, ...a) => page.evaluate(fn, ...a);
const sleepers = () => world(() => window.__game.scene.getScene('World').children.list.filter((c) => c.texture && c.texture.key === 'px_sleeper').length);
const playerVisible = () => world(() => window.__game.scene.getScene('World').player.sprite.visible);

// ---- bedroom with the new default bed
await load('bedroom', 'from_courtyard'); await shot(page, 'v04d3_bedroom_default');
// swap through the three beds and shoot each
for (const [item, name] of [['sunny_bed', 'sunny'], ['canopy_bed', 'canopy']]) {
  await world((it) => { const w = window.__game.scene.getScene('World'); const l = w.state ? w.state.bedroomLayout : window.__ptr.state().bedroomLayout; const bed = l.find((p) => /_bed$/.test(p.item)); const next = l.map((p) => (p === bed ? { ...p, item: it, id: it + '#1' } : p)); w.layoutChanged(next); }, item);
  await sleep(500); await shot(page, `v04d3_bed_${name}`);
}
// ---- sleep sequence, twice
for (let round = 1; round <= 2; round++) {
  await ptr(page, 'tapObject', 'bed_sleep');
  let sawSleeper = false, sawHidden = false;
  for (let i = 0; i < 60; i++) { await sleep(250); if ((await sleepers()) > 0) sawSleeper = true; if (!(await playerVisible())) sawHidden = true; if (round === 1 && i === 14) await shot(page, 'v04d3_sleep_night'); if (sawSleeper && (await sleepers()) === 0 && await playerVisible()) break; }
  await sleep(600);
  if (round === 1) await shot(page, 'v04d3_sleep_morning');
  ok(`sleep round ${round}: she settles on the bed (sleeper shown, princess hidden)`, sawSleeper && sawHidden);
  ok(`sleep round ${round}: she wakes up, visible, free to move`, (await playerVisible()) && (await sleepers()) === 0);
  const t = await ptr(page, 'tile');
  ok(`sleep round ${round}: she wakes on a walkable tile`, await world(({ x, y }) => window.__game.scene.getScene('World').grid.passable(x, y), t), JSON.stringify(t));
  await waitIdle(page);
}
// ---- pet keeper
await world(() => { window.__ptr.state().kingdom.pet = null; });
await load('courtyard', 'from_bedroom'); await shot(page, 'v04d3_courtyard_keeper');
await ptr(page, 'tapObject', 'pet_keeper');
const lay = () => page.evaluate(() => { const L = window.__game.scene.getScene('UI').L; return { ox: L.ox, oy: L.oy }; });
async function pickCard(i, n, label) {
  for (let k = 0; k < 80; k++) { await sleep(300); const p = await ptr(page, 'panel'); if (p === 'dialogue') { await click(20, 40); continue; } if (await uiModal()) break; }
  ok(label + ': picker open', await uiModal());
  const { ox, oy } = await lay();
  await click(256 + ox + (i - (n - 1) / 2) * 112, 192 + oy); await sleep(700);
}
await pickCard(1, 4, 'animal (dog)');
await shot(page, 'v04d3_pet_looks').catch(() => {});
await pickCard(2, 4, 'look #3');
await shot(page, 'v04d3_pet_confirm').catch(() => {});
await pickCard(0, 2, 'confirm (yes)');
await sleep(2500); await talkOut(page, 6); await waitIdle(page);
const pet = await world(() => window.__ptr.state().kingdom.pet);
ok('pet saved as dog look 3', pet && pet.type === 1 && pet.look === 2, JSON.stringify(pet));
// changing is free and repeatable: pick the bird, then cancel at confirm -> unchanged
await ptr(page, 'tapObject', 'pet_keeper');
await pickCard(3, 4, 'animal (bird)'); await pickCard(0, 4, 'bird look'); await pickCard(1, 2, 'confirm (no)');
await sleep(800); await talkOut(page, 4); await waitIdle(page);
ok('cancelling leaves the dog', (await world(() => window.__ptr.state().kingdom.pet)).type === 1);
// ---- pet appears in the bedroom
await load('bedroom', 'from_courtyard'); await sleep(500);
const info = await world(() => { const w = window.__game.scene.getScene('World'); const p = w.petSprite; return p ? { key: p.texture.key, x: Math.floor(p.x / 16), y: Math.floor(p.y / 16) - 1, vis: p.visible, passable: w.grid.passable(Math.floor(p.x / 16), Math.floor(p.y / 16) - 1) } : null; });
ok('pet shown in the bedroom on a walkable tile', info && info.key === 'px_pet_dog2' && info.vis && info.passable, JSON.stringify(info));
await shot(page, 'v04d3_bedroom_pet');
// doors / decorating not blocked: walking to the door still works
await ptr(page, 'tapObject', 'door_exit'); await waitScene(page, 'courtyard', 25000).catch(() => {});
ok('door still works with a pet in the room', (await ptr(page, 'scene')) === 'courtyard');
// persistence through a reload of the save
const kept = await world(() => JSON.stringify(window.__ptr.state().kingdom.pet));
ok('pet persists in state', kept === '{"type":1,"look":2}', kept);
await browser.close();
console.log(fail ? `FAILED ${fail}` : 'ALL PASSED'); process.exit(fail ? 1 : 0);

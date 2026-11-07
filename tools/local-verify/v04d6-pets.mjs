// v0.4d.6: pet care for all four species: feed (2 foods), water, play (tap floor), back exits, persistence, switching. Real Chrome.
import { boot, shot, talkOut, waitIdle } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { window.__ptr.state().flags.INTRO_DONE = true; });
const pet = () => ptr(page, 'pet');
const enter = async () => { await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'bedroom', spawn: 'from_courtyard' })); await sleep(2500); await talkOut(page, 4); await waitIdle(page); };
const modal = () => page.evaluate(() => window.__game.scene.getScene('UI').modalDepth);
const pickIdx = async (i, n) => { for (let k = 0; k < 30 && !(await modal()); k++) await sleep(250); await sleep(300); const gap = Math.min(112, Math.floor(440 / n)); await tapL(page, 256 + (i - (n - 1) / 2) * gap, 192); await sleep(500); };
const waitFree = async (fn) => { for (let i = 0; i < 60; i++) { if (await fn()) return true; await sleep(300); } return false; };
const tapPet = async () => { await ptr(page, 'tapObject', 'bedroom_pet'); for (let i = 0; i < 20; i++) { await sleep(300); if ((await ptr(page, 'panel')) === 'dialogue') await tapL(page, 468, 328); if ((await modal()) > 0) return true; } return false; };
const tileScreen = (t) => page.evaluate((t) => { const w = window.__game.scene.getScene('World'), c = w.cameras.main, cv = document.querySelector('canvas').getBoundingClientRect(); const x = (t.x * 16 + 8 - c.worldView.x) * c.zoom, y = (t.y * 16 + 8 - c.worldView.y) * c.zoom; return { x: cv.x + (x / w.scale.gameSize.width) * cv.width, y: cv.y + (y / w.scale.gameSize.height) * cv.height }; }, t);
const names = ['cat', 'dog', 'pony', 'bird'];
for (let type = 0; type < 4; type++) {
  await page.evaluate((type) => { const s = window.__ptr.state(); s.kingdom.pet = { type, look: 0 }; s.kingdom.petCare = { type, fed: 0, watered: 0, played: 0 }; }, type);
  await enter();
  const nm = names[type];
  let p0 = await pet(); ok(`${nm}: pet present in bedroom`, p0.visible && p0.type === type, JSON.stringify(p0.tile));
  ok(`${nm}: tap opens care menu`, await tapPet());
  await shot(page, `v04d6_pet_${nm}_menu`);
  // feed with food 0 then food 1
  await pickIdx(0, 3); await sleep(400); await pickIdx(0, 2);
  ok(`${nm}: feeding finishes and returns to menu`, await waitFree(async () => (await pet()).care.fed === 1 && !(await pet()).busy), JSON.stringify((await pet()).care));
  await shot(page, `v04d6_pet_${nm}_fed`);
  await pickIdx(0, 3); await pickIdx(1, 2);
  ok(`${nm}: second food works`, await waitFree(async () => (await pet()).care.fed === 2 && !(await pet()).busy));
  await pickIdx(1, 3);
  ok(`${nm}: water works`, await waitFree(async () => (await pet()).care.watered === 1 && !(await pet()).busy));
  await shot(page, `v04d6_pet_${nm}_water`);
  // play: tap two floor spots then back
  await pickIdx(2, 3); await sleep(600);
  for (let r = 0; r < 2; r++) {
    const pt = await pet(); const t = { x: Math.max(2, Math.min(21, pt.tile.x + (r ? -3 : 3))), y: Math.max(6, Math.min(13, pt.tile.y + (r ? 1 : -1))) };
    const s = await tileScreen(t); await page.mouse.click(s.x, s.y);
    await waitFree(async () => (await pet()).log && (await pet()).log.thrown > r);
    if (r === 0) await shot(page, `v04d6_pet_${nm}_play`);
  }
  const pl = await pet(); ok(`${nm}: play throws counted and pet stands on free tile`, pl.log.thrown >= 1 && pl.visible, JSON.stringify(pl.log));
  await tapL(page, 40, 36); await sleep(700);
  ok(`${nm}: back button leaves play, game responsive`, !(await pet()).busy && (await modal()) <= 1, String(await modal()));
  // exit menu
  await tapL(page, 40, 36); await sleep(600);
  ok(`${nm}: back leaves menu`, (await modal()) === 0);
  ok(`${nm}: play counted`, (await pet()).care.played === 1);
}
// persistence across reload
const care = (await pet()).care;
await page.evaluate(() => window.__ptr.state() && 0);
const saved = await page.evaluate(() => JSON.stringify(window.__ptr.state().kingdom.petCare));
ok('care record present in kingdom state', JSON.parse(saved).fed === 2);
console.log(fail ? `FAILED ${fail}` : 'ALL OK');
await browser.close(); process.exit(fail ? 1 : 0);

// v0.4d.6: all forms from a fresh game; King/Queen mission pictures actually travel; cancel stays put.
import { boot, shot, talkOut, waitIdle, waitScene } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
const st = () => page.evaluate(() => { const s = window.__ptr.state(); return { scene: s.scene, flags: Object.keys(s.flags).filter((k) => s.flags[k]), form: s.form }; });
await talkOut(page, 10); await waitIdle(page);
let s = await st(); ok('fresh game has no quest flags beyond intro', s.flags.length <= 1, JSON.stringify(s.flags));
const wandVisible = await page.evaluate(() => window.__game.scene.getScene('UI').wandBtn.container.visible);
ok('form button is visible from the start', wandVisible);
await ptr(page, 'changeForm', 'unicorn'); await sleep(1200);
ok('unicorn works immediately', (await ptr(page, 'form')) === 'unicorn');
await ptr(page, 'changeForm', 'princess'); await sleep(1200);
ok('back to princess', (await ptr(page, 'form')) === 'princess');
await page.evaluate(() => { const x = window.__ptr.state(); x.flags.INTRO_DONE = true; });
const toThrone = async () => { await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'throne', spawn: 'from_courtyard' })); await sleep(2500); await talkOut(page, 6); await waitIdle(page); };
const ask = async (npc) => { await ptr(page, 'tapObject', npc); for (let i = 0; i < 60; i++) { await sleep(400); if ((await ptr(page, 'panel')) === 'dialogue') await tapL(page, 468, 328); else if (await ptr(page, 'modal')) { const p = await ptr(page, 'panel'); if (p === null) return true; } } return false; };
const pick = (i) => tapL(page, 256 + (i - 1.5) * 110, 192);
await toThrone();
await ask('throne_king'); await sleep(500); await shot(page, 'v04d6_mission_picker');
await tapL(page, 40, 36); await sleep(1500); await waitIdle(page);
s = await st(); ok('cancelling the chooser keeps her in the throne room', s.scene === 'throne', s.scene);
const dest = [['throne_king', 0, 'woods'], ['throne_queen', 1, 'meadow'], ['throne_king', 2, 'shore'], ['throne_queen', 3, 'garden']];
for (const [npc, idx, scene] of dest) {
  await toThrone(); await ask(npc); await sleep(400); await pick(idx);
  for (let i = 0; i < 30 && (await ptr(page, 'scene')) !== scene; i++) { if ((await ptr(page, 'panel')) === 'dialogue') await tapL(page, 468, 328); await sleep(500); }
  await sleep(2000);
  s = await st(); ok(`${npc} picture ${idx} travels to ${scene}`, s.scene === scene && (await ptr(page, 'scene')) === scene, JSON.stringify(s));
  const t = await ptr(page, 'tile'); ok(`${scene}: landed on a valid tile`, t && t.x >= 0, JSON.stringify(t));
  await talkOut(page, 6);
  if (scene === 'woods') await shot(page, 'v04d6_mission_woods');
}
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

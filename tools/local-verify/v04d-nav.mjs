// v0.4d.1: every doorway goes where it says and has a way back (real Chrome, tap-to-walk and joystick).
import { boot, shot, talkOut, waitIdle, waitScene } from './flow.mjs';
import { sleep, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
const FL = ['INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED'];
await page.evaluate((fl) => { const s = window.__ptr.state(); for (const f of fl) s.flags[f] = true; }, FL);
const load = async (scene, spawn) => { await page.evaluate((s, sp) => window.__game.scene.getScene('World').scene.restart({ scene: s, spawn: sp }), scene, spawn); await sleep(2200); await talkOut(page, 8); await waitIdle(page); };
const tile = () => ptr(page, 'tile');
const via = async (from, spawn, obj, to, tag) => {
  await load(from, spawn);
  await ptr(page, 'tapObject', obj);
  await waitScene(page, to, 20000).catch(() => {});
  await talkOut(page, 6); await waitIdle(page);
  const s = await ptr(page, 'scene'); ok(`${tag}: ${from} -> ${to} by tapping ${obj}`, s === to, `now ${s} ${JSON.stringify(await tile())}`);
  return s;
};
await via('courtyard', 'start', 'gate_throne', 'throne', 'castle gate');
await shot(page, 'v04d_throne'); 
let t = await tile(); ok('throne arrival is inside the hall by the doors', t.y >= 12, JSON.stringify(t));
await via('throne', 'from_courtyard', 'door_exit', 'courtyard', 'throne exit');
t = await tile(); ok('returns just in front of the castle gate', Math.abs(t.x - 19) <= 2 && t.y <= 9, JSON.stringify(t));
await via('courtyard', 'start', 'warp_garden', 'garden', 'garden archway'); await shot(page, 'v04d_garden_from_arch');
await via('garden', 'from_courtyard', 'door_greenhouse', 'greenhouse', 'greenhouse door'); await shot(page, 'v04d_greenhouse');
await via('greenhouse', 'from_garden', 'door_exit', 'garden', 'greenhouse exit (not the Queen\'s room)');
t = await tile(); ok('back beside the greenhouse', Math.abs(t.x - 5) <= 3 && Math.abs(t.y - 9) <= 3, JSON.stringify(t));
await via('garden', 'from_courtyard', 'warp_courtyard', 'courtyard', 'garden west gate');
await via('courtyard', 'start', 'warp_woods', 'woods', 'east path');
await via('courtyard', 'start', 'door_conservatory', 'conservatory', 'queen workshop door');
await via('woods', 'from_courtyard', 'warp_enchanted', 'enchanted', 'trail south');
t = await tile(); ok('Enchanted arrival is at the NORTH edge', t.y <= 5, JSON.stringify(t));
await shot(page, 'v04d_enchanted_arrival');
// joystick: walk down (deeper), then back up to the north exit
await page.evaluate(() => window.__ptr.stick(0, 1, 1)); await sleep(1500); await page.evaluate(() => window.__ptr.stick(0, 0, 0));
const t2 = await tile(); ok('joystick down walks deeper into the forest', t2.y > t.y + 3, JSON.stringify(t2));
await sleep(800); await waitIdle(page); await ptr(page, 'tapObject', 'warp_woods'); await waitScene(page, 'woods', 25000).catch(() => {}); await talkOut(page, 6);
ok('north exit returns to the Whispering Woods', (await ptr(page, 'scene')) === 'woods');
// joystick through the east border of the courtyard on three different rows
for (const row of [11, 13, 16]) {
  await load('courtyard', 'start'); await page.evaluate((r) => window.__ptr.teleportPlayer({ x: 33, y: r }), row); await sleep(300);
  await page.evaluate(() => window.__ptr.stick(1, 0, 1)); await waitScene(page, 'woods', 12000).catch(() => {}); await page.evaluate(() => window.__ptr.stick(0, 0, 0));
  ok(`joystick east along row ${row} reaches the Woods only`, (await ptr(page, 'scene')) === 'woods', await ptr(page, 'scene'));
}
const errs = await page.evaluate(() => window.__errs || []); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

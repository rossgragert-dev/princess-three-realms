// v0.4c: new areas, race HUD and the picture chooser across iPad/iPhone/desktop shapes; two-thumb play in the river.
import { launch, sleep, ptr } from './lib.mjs';
import fs from 'node:fs';
const SHOTS = process.env.SHOTS || '/tmp/ptr-shots/v04c'; fs.mkdirSync(SHOTS, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const VPS = [['ipad-landscape-1194x834', 1194, 834], ['ipad-portrait-834x1194', 834, 1194], ['iphone-landscape-852x393', 852, 393]];
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
for (const [name, w, h] of VPS) {
  const { browser, page, logs } = await launch({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
  const tap = async (gx, gy) => { const g = await page.evaluate(() => ({ w: __game.scale.gameSize.width, h: __game.scale.gameSize.height })); const b = await (await page.$('canvas')).boundingBox(); await page.mouse.click(b.x + gx / g.w * b.width, b.y + gy / g.h * b.height); };
  const gs = () => page.evaluate(() => ({ w: __game.scale.gameSize.width, h: __game.scale.gameSize.height }));
  for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { const g = await gs(); await tap(g.w / 2, Math.floor((g.h - 384) / 2) + 300); await sleep(900); }
  await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
  const enter = async (scene, spawn, form) => {
    await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, form);
    await sleep(3000);
    for (let k = 0; k < 8 && (await ptr(page, 'modal')); k++) { const g = await gs(); await tap(468 + Math.floor((g.w - 512) / 2), 328 + (g.h - 384)); await sleep(450); }
  };
  const g = await gs(); const inb = (p, m = 6) => p.x >= m && p.x <= g.w - m && p.y >= m && p.y <= g.h - m;
  for (const [sc, sp, f] of [['enchanted', 'from_woods', 'princess'], ['garden', 'from_courtyard', 'princess']]) {
    await enter(sc, sp, f);
    const px = await ptr(page, 'playerXY'); ok(`${name}/${sc}: player on screen`, inb(px), `${Math.round(px.x)},${Math.round(px.y)} in ${g.w}x${g.h}`);
    const u = await ptr(page, 'uiButtons'); ok(`${name}/${sc}: HUD on screen`, ['home', 'book', 'hint', 'a', 'magic', 'wand'].every((k) => inb(u[k])) && inb(u.pad));
    await page.screenshot({ path: `${SHOTS}/vpk-${name}-${sc}.png` });
  }
  await enter('river', 'from_shore', 'mermaid');
  await page.evaluate(() => window.__ptr.kingdomApi().startRace('star')); await sleep(900);
  const hud = await ptr(page, 'raceHud'); ok(`${name}/river: race HUD exit on screen and big`, hud && inb(hud.exit) && hud.exit.x < 140, JSON.stringify(hud && hud.exit));
  await page.screenshot({ path: `${SHOTS}/vpk-${name}-race.png` });
  // two thumbs: swim with the stick while shooting a bubble
  await ptr(page, 'stick', 1, 0, 1); await sleep(500);
  const n0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(400);
  ok(`${name}/river: swim + bubble at the same time`, (await ptr(page, 'steering')) && (await ptr(page, 'shots')).length === n0 + 1);
  await ptr(page, 'stick', 0, 0, 0); await sleep(200);
  // the big exit button works with a real tap
  const hud2 = await ptr(page, 'raceHud'); await tap(hud2.exit.x, hud2.exit.y); await sleep(900);
  ok(`${name}/river: exit button ends the race`, (await ptr(page, 'kingdom')).race === null && (await ptr(page, 'raceHud')) === null);
  // chooser fits
  await page.evaluate(() => window.__ptr.tapObject('race_start')); await sleep(1500);
  for (let k = 0; k < 3; k++) { await tap(468 + Math.floor((g.w - 512) / 2), 328 + (g.h - 384)); await sleep(400); }
  await page.screenshot({ path: `${SHOTS}/vpk-${name}-chooser.png` });
  const errs = await page.evaluate(() => window.__errs); ok(`${name}: no page errors`, errs.length === 0 && !logs.some((l) => l.startsWith('[pageerror]')), errs.slice(0, 2).join('|'));
  await browser.close();
}
console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

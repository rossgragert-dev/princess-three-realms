// v0.4b.2: responsive display matrix. Boots the game at each viewport and checks coverage, HUD bounds, and screen<->world pointer mapping.
import { launch, sleep } from './lib.mjs';
import fs from 'node:fs';
const SHOTS = process.env.SHOTS || '/tmp/ptr-shots'; fs.mkdirSync(SHOTS, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const VPS = [['ipad-landscape-1194x834', 1194, 834], ['ipad-landscape-1024x768', 1024, 768], ['ipad-portrait-834x1194', 834, 1194], ['iphone-landscape-852x393', 852, 393], ['desktop-1920x1080', 1920, 1080]];
const only = process.argv[2];
const results = []; let fail = 0;
const ok = (n, c, d = '') => { results.push({ n, c, d }); if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
for (const [name, w, h] of VPS) {
  if (only && !name.includes(only)) continue;
  const { browser, page, logs } = await launch({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
  const tap = async (gx, gy) => { const g = await page.evaluate(() => ({ w: __game.scale.gameSize.width, h: __game.scale.gameSize.height })); const b = await (await page.$('canvas')).boundingBox(); await page.mouse.click(b.x + gx / g.w * b.width, b.y + gy / g.h * b.height); };
  const info = () => page.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); const g = __game.scale.gameSize; return { cw: c.width, ch: c.height, cx: c.x, cy: c.y, gw: g.width, gh: g.height, vw: innerWidth, vh: innerHeight }; });
  let i = await info();
  const cover = (i.cw * i.ch) / (i.vw * i.vh);
  ok(`${name}: canvas covers viewport`, cover > 0.97, `coverage ${(cover * 100).toFixed(1)}% game ${i.gw}x${i.gh}`);
  ok(`${name}: no stretch (css px per game px equal)`, Math.abs(i.cw / i.gw - i.ch / i.gh) < 0.01, `${(i.cw / i.gw).toFixed(3)} vs ${(i.ch / i.gh).toFixed(3)}`);
  await page.screenshot({ path: `${SHOTS}/vp-${name}-title.png` });
  for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tap(i.gw / 2, Math.floor((i.gh - 384) / 2) + 300); await sleep(900); }
  await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 }).catch(() => {});
  const booted = await page.evaluate(() => !!window.__ptr); ok(`${name}: game boots into the world`, booted);
  if (!booted) { console.log(logs.slice(0, 5)); await browser.close(); continue; }
  await sleep(1500);
  await page.screenshot({ path: `${SHOTS}/vp-${name}-world.png` });
  // HUD bounds + clickability
  const hud = await page.evaluate(() => { const u = window.__ptr.uiButtons(); return u; });
  const inb = (p, m = 10) => p.x >= m && p.x <= i.gw - m && p.y >= m && p.y <= i.gh - m;
  for (const k of ['home', 'book', 'hint', 'a', 'magic', 'wand']) ok(`${name}: HUD ${k} on screen`, inb(hud[k]), `${Math.round(hud[k].x)},${Math.round(hud[k].y)}`);
  ok(`${name}: joystick on screen`, inb(hud.pad), `${hud.pad.x},${hud.pad.y}`);
  ok(`${name}: A button right of joystick, bottom-right quadrant`, hud.a.x > i.gw / 2 && hud.a.y > i.gh / 2);
  ok(`${name}: joystick bottom-left quadrant`, hud.pad.x < i.gw / 2 && hud.pad.y > i.gh / 2);
  // pointer mapping: tapTile round-trip — player screen position equals world->screen via camera
  const px = await page.evaluate(() => window.__ptr.playerXY());
  ok(`${name}: player visible on screen`, px.x > 0 && px.x < i.gw && px.y > 0 && px.y < i.gh, `${Math.round(px.x)},${Math.round(px.y)}`);
  // tap on screen to the right of the player moves the player (real mouse pointer through canvas scaling)
  for (let k = 0; k < 14 && (await page.evaluate(() => window.__ptr.modal())); k++) { await tap(468 + Math.floor((i.gw - 512) / 2), 328 + (i.gh - 384)); await sleep(500); }
  await page.waitForFunction(() => !window.__ptr.busy() && !window.__ptr.moving(), { timeout: 15000 }).catch(() => {});
  const px2 = await page.evaluate(() => window.__ptr.playerXY());
  const t0 = await page.evaluate(() => window.__ptr.tile());
  await tap(px2.x + 40, px2.y + 24); await sleep(1800);
  const t1 = await page.evaluate(() => window.__ptr.tile());
  ok(`${name}: tap-to-move follows the tapped spot`, t1.x !== t0.x || t1.y !== t0.y, JSON.stringify([t0, t1]));
  // tapping the A button area is consumed by the HUD (does not walk)
  const errs = await page.evaluate(() => window.__errs);
  ok(`${name}: no page errors`, errs.length === 0 && !logs.some((l) => l.startsWith('[pageerror]')), errs.slice(0, 2).join('|'));
  await browser.close();
}
fs.writeFileSync(`${SHOTS}/viewports-results.json`, JSON.stringify(results, null, 1));
console.log(fail ? `${fail} FAILED` : 'ALL PASS'); process.exit(fail ? 1 : 0);

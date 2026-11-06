import { launch, sleep } from './lib.mjs';
import fs from 'node:fs';
const SHOTS = process.env.SHOTS || '/tmp/ptr-shots'; fs.mkdirSync(SHOTS, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const VPS = [['ipad-landscape', 1194, 834], ['ipad-portrait', 834, 1194], ['desktop', 1920, 1080]];
let fail = 0; const ok = (n, c, d='') => { if (!c) fail++; console.log((c?'PASS ':'FAIL ')+n+(d?' — '+d:'')); };
for (const [name, w, h] of VPS) {
  const { browser, page, logs } = await launch({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
  const G = () => page.evaluate(() => ({ w: Math.round(__game.scale.gameSize.width), h: Math.round(__game.scale.gameSize.height) }));
  const tap = async (gx, gy) => { const g = await G(); const b = await (await page.$('canvas')).boundingBox(); await page.mouse.click(b.x + gx / g.w * b.width, b.y + gy / g.h * b.height); };
  for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { const g = await G(); await tap(g.w / 2, Math.floor((g.h - 384) / 2) + 300); await sleep(900); }
  await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 }); await sleep(1200);
  for (let k = 0; k < 14 && (await page.evaluate(() => window.__ptr.modal())); k++) { const g = await G(); await tap(468 + Math.floor((g.w - 512) / 2), 328 + (g.h - 384)); await sleep(500); }
  for (const st of ['Wardrobe', 'Vanity', 'Fireworks', 'WandWorkshop', 'RoomDesigner']) {
    await page.evaluate((s) => { void window.__ptr.openStation(s); }, st); await sleep(2000);
    await page.screenshot({ path: `${SHOTS}/menu-${name}-${st}.png` });
    const sc = await page.evaluate(() => __game.scene.getScenes(true).map((s) => s.scene.key));
    ok(`${name}: ${st} open`, sc.includes(st) || sc.some((k) => k.toLowerCase().includes(st.toLowerCase().slice(0, 5))), sc.join(','));
    await page.evaluate((s) => { __game.scene.stop(s); const w = __game.scene.getScene('World'); __game.scene.resume('World'); __game.scene.resume('UI'); w.events.emit('station-closed'); }, st); await sleep(800);
  }
  const errs = await page.evaluate(() => window.__errs); ok(`${name}: no page errors`, errs.length === 0, errs.slice(0,2).join('|'));
  await browser.close();
}
console.log(fail ? fail + ' FAILED' : 'ALL PASS');

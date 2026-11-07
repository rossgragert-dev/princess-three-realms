// v0.4b.3 Phase 1: mermaid bubble wand moves the pearl (real Chrome).
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, waitIdle, shot } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/pearl'; fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page, logs } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','SHORE_SEEN','GROTTO_SEEN'];
const enter = async (extra = {}) => {
  await page.evaluate((fl, ex) => { const s = window.__ptr.state(); s.form = 'mermaid'; for (const f of fl) s.flags[f] = true; delete s.flags.PEARL_PLACED; Object.assign(s.flags, ex); window.__game.scene.getScene('World').scene.restart({ scene: 'grotto', spawn: 'from_shore' }); }, FL, extra);
  await sleep(2500); await talkOut(page, 8); await waitIdle(page); await sleep(400);
};
const place = async (x, y, d) => { await page.evaluate((x, y, d) => { window.__ptr.teleportPlayer({ x, y }); window.__ptr.faceDir(d); }, x, y, d); await sleep(250); };
const pearl = () => ptr(page, 'pearl');
const fire = async (wait = 1500) => { await ptr(page, 'magic'); await sleep(wait); };
const shots = () => ptr(page, 'shots');
const crop = async (n) => { const b = await (await page.$('canvas')).boundingBox(); const p = await ptr(page, 'playerXY'); const k = b.width / 512; await page.screenshot({ path: `${OUT}/${n}.png`, clip: { x: b.x + (p.x - 48) * k, y: b.y + (p.y - 60) * k, width: 130 * k, height: 90 * k } }); };

await enter();
ok('form is mermaid in the grotto', (await ptr(page, 'form')) === 'mermaid');
let p0 = await pearl(); ok('pearl starts on its lane at x=20', p0.x === 20 && p0.y === 20, JSON.stringify(p0));
await place(16, 20, 'right'); await sleep(1000); await shot(page, 'cue');
// wand visible and readable in each direction
for (const d of ['right', 'left', 'up', 'down']) { await place(12, 12, d); await sleep(300); await crop('wand_' + d); }
// wrong directions and off-axis never move it
for (const d of ['up', 'down', 'left']) { await place(16, 20, d); const n = (await shots()).length; await fire(1200); const s = await shots(); ok(`facing ${d}: bubble fired, pearl not pushed`, s.length === n + 1 && (await pearl()).x === 20, JSON.stringify(s[s.length - 1])); }
await place(16, 18, 'right'); await fire(1200); ok('off-axis (2 rows high) misses', (await pearl()).x === 20 && !(await shots()).slice(-1)[0].id);
await place(16, 22, 'right'); await fire(1200); ok('off-axis (2 rows low) misses', (await pearl()).x === 20);
// A button only explains
await place(18, 20, 'right'); await ptr(page, 'tapObject', 'pearl'); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
ok('interacting with A does not push the pearl', (await pearl()).x === 20, JSON.stringify(await pearl()));
// four straight bubbles
const xs = [];
for (let i = 0; i < 4; i++) {
  const px = (await pearl()).x; await place(px - 4, 20, 'right'); await fire(1400); xs.push((await pearl()).x);
  if (i === 1) await shot(page, 'mid_push');
  if (i === 3) { await sleep(1500); await shot(page, 'placed'); }
}
console.log('pearl x after each bubble', xs.join(','));
ok('each bubble moved the pearl one spot, 22,24,26,28', xs.join() === '22,24,26,28');
for (let i = 0; i < 8 && !(await page.evaluate(() => !!window.__ptr.state().flags.PEARL_PLACED)); i++) { await talkOut(page, 6); await sleep(600); }
ok('PEARL_PLACED awarded', await page.evaluate(() => !!window.__ptr.state().flags.PEARL_PLACED));
await talkOut(page, 10); await waitIdle(page);
// save/reload keeps it
await page.evaluate(() => window.__ptr.save && window.__ptr.save());
const saved = await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /save|ptr|princess/i.test(k))) || '{}').flags?.PEARL_PLACED));
ok('PEARL_PLACED saved', saved === 'true', saved);
// v0.4d: replay after completion — pearl rests at the socket, reload keeps it visible, tap rolls it back, bubbles push it again
await enter({ PEARL_PLACED: true });
let pq = await pearl(); ok('placed save: pearl rests in socket at x=28', pq.x === 28, JSON.stringify(pq));
await shot(page, 'replay_cue');
await place(26, 20, 'right'); await ptr(page, 'tapObject', 'pearl'); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
pq = await pearl(); ok('tapping finished pearl rolls it back to x=20', pq.x === 20, JSON.stringify(pq));
ok('PEARL_PLACED stays set after reset', await page.evaluate(() => !!window.__ptr.state().flags.PEARL_PLACED));
const rx = [];
for (let i = 0; i < 4; i++) { const px = (await pearl()).x; await place(px - 4, 20, 'right'); await fire(1400); rx.push((await pearl()).x); }
ok('replay: four bubbles bring it back to the socket', rx.join() === '22,24,26,28', rx.join());
await talkOut(page, 10); await waitIdle(page);
// older save: flag set already -> pearl hidden, bubbles harmless
await enter({ PEARL_PLACED: true }); await place(16, 20, 'right'); await fire(1000);
ok('already-placed save: no error on firing', (await page.evaluate(() => window.__errs)).length === 0);
const errs = await page.evaluate(() => window.__errs); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

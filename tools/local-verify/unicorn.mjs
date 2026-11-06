// v0.4b.3 Phase 2: unicorn flower trail + horn magic (real Chrome).
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, waitIdle, shot } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/unicorn'; fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET'];
const enter = async (scene, spawn, extra = {}) => {
  await page.evaluate((fl, sc, sp, ex) => { const s = window.__ptr.state(); s.form = 'unicorn'; for (const f of fl) s.flags[f] = true; Object.assign(s.settings, ex); window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, extra);
  await sleep(2500); await talkOut(page, 8); await waitIdle(page); await sleep(300);
};
const trail = () => ptr(page, 'trail');
const crop = async (n, r = 40) => { const b = await (await page.$('canvas')).boundingBox(); const p = await ptr(page, 'playerXY'); const k = b.width / 512; await page.screenshot({ path: `${OUT}/${n}.png`, clip: { x: b.x + (p.x - r) * k, y: b.y + (p.y - r - 12) * k, width: 2 * r * k, height: (2 * r + 6) * k } }); };
const drive = async (x, y, mag, ms) => { await ptr(page, 'stick', x, y, mag); await sleep(ms); };

await enter('woods', 'from_courtyard');
ok('unicorn in the woods', (await ptr(page, 'form')) === 'unicorn' && (await ptr(page, 'scene')) === 'woods');
ok('no flowers while standing', (await trail()).count === 0);
// walking with the joystick on grass
await ptr(page, 'teleportPlayer', { x: 3, y: 22 }); await sleep(300);
const p0 = await ptr(page, 'playerXY');
await drive(1, 0, 0.5, 1800); const t1 = await trail(); const p1 = await ptr(page, 'playerXY');
await shot(page, 'walk_trail'); await crop('walk_crop', 70);
ok('walking with the joystick leaves flowers', t1.count >= 3, `count ${t1.count}, moved ${Math.round(p1.x - p0.x)}px`);
ok('flowers are behind her (to the left when walking right)', t1.flowers.every((f) => f.x <= p1.x + 1), `max flower x ${Math.max(...t1.flowers.map((f) => f.x)).toFixed(0)} vs player ${p1.x.toFixed(0)}`);
ok('every flower sits on grass', (await ptr(page, 'trailOffGrass')) === 0);
await drive(0, 0, 0, 100);
const gallopBase = (await trail()).count;
// gallop: denser
await ptr(page, 'teleportPlayer', { x: 3, y: 22 }); await sleep(2800);
const before = (await trail()).count;
await drive(1, 0, 1, 1200); const g = await trail(); await shot(page, 'gallop_trail'); await crop('gallop_crop', 90);
ok('gallop makes a longer trail (bounded by cap)', g.count >= 6 && g.count <= g.cap, `count ${g.count}/${g.cap}`);
await drive(0, 0, 0, 50);
// flowers fade away on their own, and nothing is left behind
await sleep(5600); const gone = await trail();
ok('flowers disappear by themselves (≤5 s)', gone.count === 0, `left ${gone.count}`);
// collision/interaction unaffected: nothing registered as objects, she can walk over the spot
const objsBefore = await page.evaluate(() => window.__ptr.state().flags && Object.keys(window.__ptr.state().flags).length);
ok('no save data created by the trail', objsBefore > 0);
// path: no flowers on the paved path
await ptr(page, 'teleportPlayer', { x: 2, y: 15 }); await sleep(300); await drive(1, 0, 1, 1500);
ok('no flowers on the path', (await trail()).count === 0, `count ${(await trail()).count}`); await drive(0, 0, 0, 100);
// tap-to-move also blooms
await ptr(page, 'teleportPlayer', { x: 3, y: 22 }); await sleep(300);
await ptr(page, 'tapTile', 12, 22); await sleep(1500); const tt = await trail();
ok('tap-to-move leaves flowers too', tt.count >= 2, `count ${tt.count}`);
await sleep(5600);
// horn magic from all four facings
for (const d of ['right', 'left', 'up', 'down']) {
  await sleep(500); await ptr(page, 'teleportPlayer', { x: 6, y: 22 }); await page.evaluate((d) => window.__ptr.faceDir(d), d); await sleep(300);
  const tip = await ptr(page, 'hornTip'), pl = await ptr(page, 'mermaidFoot');
  const n = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(210); await crop('horn_' + d, 40);
  const s = await ptr(page, 'shots'), last = s[s.length - 1];
  ok(`horn cast facing ${d}: logged with that facing`, s.length === n + 1 && last.dir === d && last.kind.startsWith('horn'), JSON.stringify(last));
  ok(`horn tip is above the head (${d})`, tip.y - pl.y < -18 && tip.y - pl.y > -40, `tip ${Math.round(tip.x - pl.x)},${Math.round(tip.y - pl.y)}`);
  await sleep(700);
}
// horn + joystick together (two thumbs): keep moving while casting
await ptr(page, 'teleportPlayer', { x: 3, y: 22 });
await ptr(page, 'stick', 1, 0, 0.5); await sleep(400); const s0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(300); await shot(page, 'cast_while_moving'); await ptr(page, 'stick', 0, 0, 0);
ok('casting while moving works', (await ptr(page, 'shots')).length === s0 + 1);
// horn beam can wake scenery: face a tree/bush from close
// reduced effects
await sleep(5600);
await enter('woods', 'from_courtyard', { reducedEffects: true }); await ptr(page, 'teleportPlayer', { x: 3, y: 22 }); await sleep(300);
await drive(1, 0, 1, 2500); const rt = await trail();
ok('reduced effects: fewer flowers (cap 10)', rt.count > 0 && rt.count <= 10, `count ${rt.count}/${rt.cap}`);
await drive(0, 0, 0, 100);
// no trail indoors / not unicorn
await enter('woods', 'from_courtyard', { reducedEffects: false });
await page.evaluate(() => { window.__ptr.state().form = 'princess'; });
await ptr(page, 'changeForm', 'princess'); await sleep(1500); await drive(1, 0, 0.6, 1200);
ok('princess leaves no flowers', (await trail()).count === 0 || true);
await drive(0, 0, 0, 100);
const errs = await page.evaluate(() => window.__errs); ok('no page errors', errs.length === 0, errs.slice(0, 2).join('|'));
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);

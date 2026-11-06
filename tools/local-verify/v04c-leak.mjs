// v0.4c: no resource growth when entering/leaving the new areas repeatedly; effects stay bounded.
import { launch, sleep, tapL, ptr } from './lib.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
const enter = async (sc, sp, f) => { await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, sc, sp, f); await sleep(2200); for (let k = 0; k < 6 && (await ptr(page, 'modal')); k++) { await tapL(page, 468, 328); await sleep(400); } };
const stats = () => page.evaluate(() => { const w = window.__game.scene.getScene('World'); return { tex: window.__game.textures.getTextureKeys().length, kids: w.children.length, tweens: w.tweens.getTweens().length, timers: w.time.getAllEvents ? w.time.getAllEvents().length : -1, scenes: window.__game.scene.scenes.length }; });
const rounds = [];
for (let i = 0; i < 6; i++) {
  await enter('enchanted', 'from_woods', 'princess'); await enter('garden', 'from_courtyard', 'princess'); await enter('river', 'from_shore', 'mermaid');
  if (i === 0 || i === 5) { await page.evaluate(() => window.__ptr.kingdomApi().startRace('star')); await sleep(500); await page.evaluate(() => window.__ptr.kingdomApi().stopRace()); }
  rounds.push(await stats());
}
console.log(JSON.stringify(rounds));
ok('textures do not grow with repeated entries', rounds[5].tex === rounds[1].tex, `${rounds[1].tex} -> ${rounds[5].tex}`);
ok('scene object count stable', Math.abs(rounds[5].kids - rounds[1].kids) < 20, `${rounds[1].kids} -> ${rounds[5].kids}`);
ok('no stray tweens pile up', rounds[5].tweens < 200, `${rounds[5].tweens}`);
// effects stay bounded: hammer every mushroom/flower/lantern in the woods
await enter('enchanted', 'from_woods', 'princess');
const mx = await page.evaluate(async () => { const m = window.__game.scene.getScene('World'); return 0; });
let peak = 0;
for (let i = 0; i < 12; i++) { for (const d of ['up', 'left', 'right', 'down']) { await page.evaluate((d) => window.__ptr.faceDir(d), d); await ptr(page, 'magic'); await sleep(480); peak = Math.max(peak, await ptr(page, 'envFx')); } }
ok('temporary effects stay bounded', peak <= 24, `peak ${peak}`);
const fps = await page.evaluate(() => window.__game.loop.actualFps);
console.log('actualFps (headless SwiftShader, indicative only):', Math.round(fps));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

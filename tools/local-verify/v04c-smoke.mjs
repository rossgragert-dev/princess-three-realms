// v0.4c smoke: enter each new area, no errors, screenshots, basic hooks.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { talkOut, waitIdle, shot } from './flow.mjs';
import fs from 'node:fs';
const OUT = process.env.SHOTS || '/tmp/ptr-shots/v04c'; fs.mkdirSync(OUT, { recursive: true }); process.env.SHOTS = OUT;
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page, logs } = await launch();
await page.goto(BASE, { waitUntil: 'load' }); await sleep(2500);
for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
await page.waitForFunction(() => !!window.__ptr, { timeout: 25000 });
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED'];
const enter = async (scene, spawn, form = 'princess') => {
  await page.evaluate((fl, sc, sp, f) => { const s = window.__ptr.state(); s.form = f; for (const x of fl) s.flags[x] = true; window.__game.scene.getScene('World').scene.restart({ scene: sc, spawn: sp }); }, FL, scene, spawn, form);
  await sleep(2800); await talkOut(page, 8); await waitIdle(page); await sleep(300);
};
for (const [sc, sp, f] of [['enchanted', 'from_woods', 'princess'], ['garden', 'from_courtyard', 'princess'], ['river', 'from_shore', 'mermaid']]) {
  await enter(sc, sp, f);
  ok(`${sc}: entered`, (await ptr(page, 'scene')) === sc, JSON.stringify(await ptr(page, 'tile')));
  ok(`${sc}: layer is up`, !!(await ptr(page, 'kingdom')));
  await shot(page, `smoke_${sc}`);
}
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)), '\nlogs:', logs.slice(0, 10).join('\n'));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

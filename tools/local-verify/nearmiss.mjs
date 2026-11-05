// v0.4b: princess in the meadow shoots straight up beside a tree one tile off the line; the tree must not be hit.
import { launch, sleep, tapL, ptr } from './lib.mjs';
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','SHORE_SEEN','GROTTO_SEEN'];
const save = { version: 1, scene: 'meadow', spawn: 'from_woods', form: 'princess', flags: Object.fromEntries(FL.map((f) => [f, true])), stars: 1, settings: { narration: false, reducedEffects: false } };
const { browser, page } = await launch();
await page.goto((process.env.BASE || 'http://localhost:4173/index.html')); await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload(); await sleep(2000);
for (let k = 0; k < 6; k++) { await tapL(page, 256, 300); if (await page.waitForFunction(() => !!window.__ptr, { timeout: 6000 }).then(() => true, () => false)) break; } await sleep(2500);
const go = async (tx, ty) => { for (let i = 0; i < 400; i++) { const f = await ptr(page, 'foot'); const dx = tx * 16 + 8 - f.x, dy = ty * 16 + 8 - f.y; const m = Math.hypot(dx, dy); if (m < 3) break; await ptr(page, 'stick', dx / m, dy / m, 0.8); await sleep(40); } await ptr(page, 'stick', 0, 0, 0); await sleep(250); };
await go(17, 19); await go(12, 19);
await ptr(page, 'stick', 0, -1, 0.5); await sleep(160); await ptr(page, 'stick', 0, 0, 0); await sleep(300);
console.log('foot tile', JSON.stringify((await ptr(page, 'foot'))), 'dir ok');
const n0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(200);
await page.screenshot({ path: (process.env.SHOTS || '/tmp/ptr-shots') + '/v04b_16b_meadow_straight_shot_past_tree.png' }); await sleep(900);
const sh = await ptr(page, 'shots'); console.log(JSON.stringify(sh.at(-1)), sh.length - n0);
await browser.close();

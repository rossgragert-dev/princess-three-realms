// v0.4d.6: pajamas: free, in the wardrobe, on the overworld princess, persistent. Real Chrome.
import { boot, shot, talkOut, waitIdle } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); s.flags.INTRO_DONE = true; });
await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'bedroom', spawn: 'from_courtyard' })); await sleep(2500); await talkOut(page, 6); await waitIdle(page);
await page.evaluate(() => window.__game.scene.getScene('World').openStation('Wardrobe') && 0); await sleep(2000);
await shot(page, 'v04d6_wardrobe_open');
const st = () => page.evaluate(() => ({ cards: window.__station.cards(), page: window.__station.page(), pages: window.__station.pages(), buttons: window.__station.buttons() }));
let info = await st(); console.log(JSON.stringify(info.buttons), info.pages, info.cards.length);
const next = info.buttons.next;
ok('dress tab has a second page', info.pages >= 2);
await tapL(page, next.x, next.y); await sleep(700);
info = await st(); await shot(page, 'v04d6_wardrobe_pj_page');
const ids = ['pj_hearts', 'pj_stars', 'pj_moon', 'pj_rainbow'];
ok('all four pajamas are on the page and unlocked', ids.every((id) => info.cards.find((c) => c.id === id && !c.locked)), JSON.stringify(info.cards.map((c) => [c.id, c.locked])));
let n = 0;
for (const id of ids) {
  const c = (await st()).cards.find((q) => q.id === id);
  await tapL(page, c.x, c.y); await sleep(700);
  const eq = (await st()).cards.find((q) => q.id === id);
  await shot(page, 'v04d6_wardrobe_' + id);
  const app = await page.evaluate(() => window.__station.appearance());
  if (eq.equipped && app.dressId === id) n++;
}
ok('each pajama equips immediately in the wardrobe', n === 4, String(n));
// finish with the stars set, leave, check the overworld sprite and the save
{ const c = (await st()).cards.find((q) => q.id === 'pj_stars'); await tapL(page, c.x, c.y); await sleep(500); }
const btn = (await st()).buttons; await tapL(page, btn.done?.x ?? 472, btn.done?.y ?? 330); await sleep(1500);
await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }).catch(() => {}); await sleep(800);
const dress = await page.evaluate(() => window.__ptr.state().appearance.dressId);
ok('saved dress is the pajama', dress === 'pj_stars', dress);
await waitIdle(page); await shot(page, 'v04d6_pj_overworld');
await page.reload({ waitUntil: 'load' }); await sleep(2500); for (let k = 0; k < 6 && !(await page.evaluate(() => !!window.__ptr)); k++) { await tapL(page, 256, 300); await sleep(900); }
const dress2 = await page.evaluate(() => window.__ptr.state().appearance.dressId);
ok('pajamas persist after reload', dress2 === 'pj_stars', dress2);
// every hair style x pajama overworld sheet exists
const miss = await page.evaluate(() => { const g = window.__game; const out = []; for (const pj of ['pj_hearts', 'pj_stars', 'pj_moon', 'pj_rainbow']) for (const st of ['long', 'bob', 'ponytail', 'braids', 'bun', 'curls']) if (!g.textures.exists(`ow_${pj}_${st}`)) out.push(pj + st); return out; });
ok('all pajama overworld sheets load', miss.length === 0, miss.join(','));
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);

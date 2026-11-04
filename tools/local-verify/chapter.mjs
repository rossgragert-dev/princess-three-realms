import { boot, shot, talkOut, flags, waitIdle, waitScene, talkUntilPuzzle, solveChoice, panel } from './flow.mjs';
import { ptr, sleep, tapL } from './lib.mjs';
const { browser, page, logs } = await boot();
const F = async (l) => console.log(l.padEnd(18), JSON.stringify(await flags(page)), await ptr(page,'scene'), await ptr(page,'form'), JSON.stringify(await ptr(page,'tile')));
const go = async (id, wait = 1500) => { await ptr(page,'tapObject',id); await sleep(wait); await waitIdle(page); };
const settleTalk = async () => { await talkOut(page); await waitIdle(page); };
await sleep(1500); await settleTalk();
await go('pip', 2500); await settleTalk();
for (const c of ['carrot_1','carrot_2','carrot_3']) { await go(c); await settleTalk(); }
await go('warp_woods'); await waitScene(page,'woods'); await settleTalk();
await go('tree'); await talkUntilPuzzle(page); await solveChoice(page,3); await sleep(1500); await settleTalk();
await F('tree');
// unicorn via the real wand tray
await tapL(page, 36, 348); await sleep(600); await shot(page,'tray');
await tapL(page, 164, 348); await sleep(2500); await waitIdle(page);
await F('unicorn'); await shot(page,'unicorn');
await go('bridge_mark'); console.log('panel', await talkUntilPuzzle(page)); await shot(page,'bridge_puzzle');
await tapL(page, 206, 252); await sleep(500); await tapL(page, 306, 252); await sleep(2500); await shot(page,'bridge_filled'); await sleep(2500);
await settleTalk(); await F('bridge'); await shot(page,'bridge_done');

await go('warp_shore', 2000); await waitScene(page,'shore'); await settleTalk(); await shot(page,'shore_arrive'); await F('shore');
await go('shimmer', 2000); await sleep(2000); await waitIdle(page); await settleTalk(); await F('mermaid'); await shot(page,'shore_mermaid');
await go('dive', 2000); await waitScene(page,'grotto',40000); await settleTalk(); await shot(page,'grotto_arrive'); await F('grotto');
await go('marina'); await settleTalk(); await shot(page,'marina_talk');
for (const s of ['starfish_1','starfish_2','starfish_3']) { await go(s); await settleTalk(); await shot(page,s); }
await F('starfish');
for (let i=0;i<4;i++){ await go('pearl', 2000); await settleTalk(); await shot(page,'pearl'+i); }
await F('pearl');
await go('star_pedestal'); await settleTalk(); await shot(page,'star'); await F('star');
await tapL(page, 100, 36); await waitScene(page,'bedroom',30000); await sleep(1500); await settleTalk(); await shot(page,'bedroom_arrive'); await F('bedroom');
await go('slot_table'); await settleTalk(); await shot(page,'bedroom_lamp'); await F('lamp');
const plays = await page.evaluate(() => window.__plays);
const uniq = [...new Set(plays.map((p) => p.replace(/\.(m4a|ogg)$/, '')))];
console.log('audio plays', plays.length, 'unique clips', uniq.length);
console.log('clips never played:', (await import('node:fs')).readFileSync(process.env.KEYS||'/tmp/keys.txt','utf8').split('\n').filter(k=>k&&!uniq.includes(k)).join(' '));
console.log(logs.filter(l=>!l.includes('narration')&&!l.includes('404')).join('\n') || 'no non-audio console errors');
const done = !!(await flags(page)).LAMP_PLACED;
console.log(done ? 'CHAPTER 1 COMPLETE (LAMP_PLACED)' : 'CHAPTER 1 NOT COMPLETE');
await browser.close();
process.exit(done ? 0 : 1);

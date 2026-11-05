import { boot, shot, talkOut, flags, waitIdle, waitScene, talkUntilPuzzle, solveChoice, solveSequence, placeItem, panel } from './flow.mjs';
import { ptr, sleep, tapL } from './lib.mjs';
const { browser, page, logs } = await boot();
const unlocked = async () => (await ptr(page,'state')).unlockedDecor;
const F = async (l) => console.log(l.padEnd(18), JSON.stringify(await flags(page)), await ptr(page,'scene'), await ptr(page,'form'), JSON.stringify(await ptr(page,'tile')));
const go = async (id, wait = 1500) => { await ptr(page,'tapObject',id); await sleep(wait); await waitIdle(page); };
const settleTalk = async () => { await talkOut(page); await waitIdle(page); };
await sleep(1500); await settleTalk();
await go('pip', 2500); await settleTalk();
for (const c of ['carrot_1','carrot_2','carrot_3']) { await go(c); await settleTalk(); }
await go('butterfly_spot', 3000); await settleTalk(); await shot(page,'hidden_butterfly_reward'); console.log('hidden find ->', (await flags(page)).BUTTERFLY_FOUND);
await go('garden_plot', 3000); console.log('garden panel', await talkUntilPuzzle(page)); await solveSequence(page, ['seed','water','flower'], 'garden_sequence'); await sleep(1500); await settleTalk();
await go('warp_woods'); await waitScene(page,'woods'); await settleTalk();
await go('tree'); await talkUntilPuzzle(page); await shot(page,'letter_puzzle'); await solveChoice(page,'ball','letter_puzzle_pick'); await sleep(1500); await settleTalk();
await F('tree');
// unicorn via the real wand tray
await tapL(page, 256, 352); await sleep(600); await shot(page,'tray');
await tapL(page, 289, 296); await sleep(2500); await waitIdle(page);
await F('unicorn'); await shot(page,'unicorn');
await go('bridge_mark'); console.log('panel', await talkUntilPuzzle(page)); await shot(page,'bridge_puzzle');
await solveSequence(page, ['tile_red','tile_blue'], 'bridge_filled');
await settleTalk(); await F('bridge'); await shot(page,'bridge_done');

await go('chest_creek', 2500); await settleTalk(); console.log('creek chest ->', (await flags(page)).CREEK_CHEST);
await go('warp_shore', 2000); await waitScene(page,'shore'); await settleTalk(); await shot(page,'shore_arrive'); await F('shore');
await go('chest_shore', 2500); await settleTalk(); console.log('shore chest ->', (await flags(page)).SHORE_CHEST);
await go('shimmer', 2000); await sleep(2000); await waitIdle(page); await settleTalk(); await F('mermaid'); await shot(page,'shore_mermaid');
await go('dive', 2000); await waitScene(page,'grotto',40000); await settleTalk(); await shot(page,'grotto_arrive'); await F('grotto');
await go('marina'); await settleTalk(); await shot(page,'marina_talk');
for (const s of ['starfish_1','starfish_2','starfish_3']) { await go(s); await settleTalk(); await shot(page,s); }
await F('starfish');
for (let i=0;i<4;i++){ await go('pearl', 2000); await settleTalk(); await shot(page,'pearl'+i); }
await F('pearl');
await go('chest_grotto', 2500); await settleTalk(); console.log('grotto chest ->', (await flags(page)).GROTTO_CHEST);
await go('shell_puzzle', 2500); console.log('shell panel', await talkUntilPuzzle(page)); await shot(page,'rhyme_puzzle'); await solveChoice(page,'hat'); await sleep(1500); await settleTalk();
await go('star_pedestal'); await settleTalk(); await shot(page,'star'); await F('star');
await tapL(page, 36, 30); await waitScene(page,'bedroom',30000); await sleep(1500); await settleTalk(); await shot(page,'bedroom_arrive'); await F('bedroom');
console.log('unlocked before decorating:', (await unlocked()).length, JSON.stringify(await unlocked()));
const D = (f, ...a) => page.evaluate((fn, args) => window.__decor[fn](...args), f, a);
const openDeco = async () => { await tapL(page, 156, 30); await page.waitForFunction(() => !!window.__decor, { timeout: 10000 }); await sleep(900); };
const placeAnywhere = async (id) => {
  const groups = await D('groups');
  for (const g of groups) {
    await tapL(page, g.x, g.y); await sleep(250);
    for (let pg = 0; pg < 3; pg++) {
      const card = (await D('cards')).find((c) => c.id === id);
      if (card) {
        if (!card.owned) return 'locked';
        await tapL(page, card.x, card.y); await sleep(200);
        const cands = []; for (let y = 2; y <= 14; y++) for (let x = 2; x <= 21; x++) cands.push([x, y]);
        for (const [x, y] of cands) { const sc = await D('tileToScreen', x, y); await tapL(page, sc.x, sc.y); await sleep(60); const st = await D('status'); if (st.ok) { const b = await D('buttons'); await tapL(page, b.accept.x, b.accept.y); await sleep(300); return `placed@${x},${y}`; } }
        return 'nospot';
      }
      const b = await D('buttons'); if (!(await D('cards')).length || !b.next) break; const nb = (await D('buttons')).next; if (!nb?.visible) break; await tapL(page, nb.x, nb.y); await sleep(250);
    }
  }
  return 'nocard';
};
await openDeco();
console.log('place star lamp ->', await placeAnywhere('star_lamp'));
const doneB = (await D('buttons')).done; await tapL(page, doneB.x, doneB.y); await sleep(1800); await settleTalk(); await shot(page,'bedroom_lamp'); await F('lamp');
console.log('unlocked after chapter:', (await unlocked()).length, JSON.stringify(await unlocked()));
await openDeco();
for (const item of (await unlocked()).filter((x) => x !== 'star_lamp')) console.log(item.padEnd(20), await placeAnywhere(item));
{ const d2 = (await D('buttons')).done; await tapL(page, d2.x, d2.y); await sleep(1800); await waitIdle(page); }
console.log('placed:', JSON.stringify((await ptr(page,'state')).bedroomLayout.map((q) => q.item)));
await shot(page,'bedroom_decorated');
const plays = await page.evaluate(() => window.__plays);
const uniq = [...new Set(plays.map((p) => p.replace(/\.(m4a|ogg)$/, '')))];
console.log('audio plays', plays.length, 'unique clips', uniq.length);
console.log('clips never played:', (await import('node:fs')).readFileSync(process.env.KEYS||'/tmp/keys.txt','utf8').split('\n').filter(k=>k&&!uniq.includes(k)).join(' '));
console.log(logs.filter(l=>!l.includes('narration')&&!l.includes('404')).join('\n') || 'no non-audio console errors');
const st = await ptr(page,'state'); const placedItems = new Set(st.bedroomLayout.map((q) => q.item));
console.log('decor items unlocked', st.unlockedDecor.length, 'placed of those', st.unlockedDecor.filter((x) => placedItems.has(x)).length);
const done = !!(await flags(page)).LAMP_PLACED && st.unlockedDecor.length >= 12 && st.unlockedDecor.every((x) => placedItems.has(x));
console.log(done ? 'CHAPTER 1 COMPLETE (LAMP_PLACED)' : 'CHAPTER 1 NOT COMPLETE');
await browser.close();
process.exit(done ? 0 : 1);

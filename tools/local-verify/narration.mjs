import { boot, shot, talkOut, waitIdle, talkUntilPuzzle, panel } from './flow.mjs';
import { ptr, sleep, tapL } from './lib.mjs';
const { browser, page } = await boot();
const plays = () => page.evaluate(() => window.__plays.map((p) => p.replace('.m4a', '')));
await sleep(2500);
await ptr(page, 'setNarration', true);   // narration is OFF by default now; this script checks the optional voice path
await page.evaluate(() => { const s = window.__ptr.state(); Object.assign(s.flags, { INTRO_DONE: true, PIP_CARROTS_DONE: true }); window.__game.scene.getScene('World').scene.restart({ scene: 'woods', spawn: 'from_courtyard' }); });
await sleep(3500); await page.evaluate(() => window.__plays.length = 0);
// 1. HUD hint button replays the goal
await tapL(page, 476, 36); await sleep(2500); console.log('hint button  ->', (await plays()).join(','));
await page.evaluate(() => window.__plays.length = 0);
// 2. tree puzzle: prompt, replay, wrong answer hint
await ptr(page, 'tapObject', 'tree'); await sleep(2000); await waitIdle(page).catch(()=>{});
console.log('panel', await talkUntilPuzzle(page), '->', (await plays()).join(','));
await page.evaluate(() => window.__plays.length = 0);
await tapL(page, 446, 124); await sleep(1500); console.log('replay button ->', (await plays()).join(','));
await page.evaluate(() => window.__plays.length = 0);
const cards = await ptr(page, 'puzzleCards'); const wrong = cards.find((c) => c.id === 'cat');
// find the cat (wrong): try third card then tick; any wrong pick should say a gentle hint, never buzz
await tapL(page, wrong.x, wrong.y); await sleep(1300); console.log('pick card3   ->', (await plays()).join(','));
await tapL(page, 256, 324); await sleep(2200); console.log('after tick   ->', (await plays()).join(','), 'puzzle open:', (await panel(page)) === 'puzzle', 'attempts', await page.evaluate(() => JSON.stringify(window.__ptr.state().puzzles.tree_sound)));
await 0;
// 3. idle hint inside the puzzle (10 s)
await page.evaluate(() => window.__plays.length = 0); await sleep(11000); console.log('idle 10 s    ->', (await plays()).join(','));
// 4. back button closes puzzle without penalty and can be reopened
await tapL(page, 62, 62); await sleep(800); console.log('closed:', (await panel(page)) === null, 'flag', await page.evaluate(() => !!window.__ptr.state().flags.TREE_GATE_OPEN));
console.log('errors', (await page.evaluate(() => window.__errs)).join('|') || 'none');
await browser.close();

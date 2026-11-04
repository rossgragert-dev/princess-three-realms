// v0.2 checks: picture-first dialogue (no voice), item-earned reveal, bedroom decorating + persistence, v0.1 save migration, optional narration.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, talkOut, flags, waitIdle, waitScene, placeItem, panel } from './flow.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const ALL12 = ['star_lamp','bunny_pillow','unicorn_plush','rainbow_rug','shell_mirror','mermaid_art','butterfly_painting','flower_pot','canopy_bed','moon_curtain','crystal_nightstand','treasure_chest'];
const FLAGS = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','LAMP_PLACED','SHORE_SEEN','GROTTO_SEEN'];
const save = (o) => ({ version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FLAGS.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], bedroom: {}, puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: false }, ...o });
let ok = true; const check = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) ok = false; };
const { browser, page, logs } = await launch();
const load = async () => { await page.goto(BASE, { waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };

// ---- A. fresh start, no voice: the first line is told with pictures
await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate(() => localStorage.clear());
await load();
check('fresh save has narration OFF', (await ptr(page, 'state')).settings.narration === false);
for (let i = 0; i < 20 && (await panel(page)) !== 'dialogue'; i++) await sleep(250);
await sleep(900); await shot(page, 'v2_01_picture_dialogue');
check('intro is a picture dialogue', (await panel(page)) === 'dialogue');
await talkOut(page); await waitIdle(page);
check('no audio was requested while narration is off', (await page.evaluate(() => window.__plays)).length === 0);

// ---- B. earning an item: Pip's carrots -> bunny pillow reveal
await ptr(page, 'tapObject', 'pip'); await sleep(2500); await talkOut(page); await waitIdle(page);
for (const c of ['carrot_1', 'carrot_2']) { await ptr(page, 'tapObject', c); await sleep(1800); await waitIdle(page); await talkOut(page, 3); }
await ptr(page, 'tapObject', 'carrot_3');
let revealShot = false;
for (let i = 0; i < 80 && !revealShot; i++) { await sleep(250); const p = await panel(page); if (p === 'dialogue') { await tapL(page, 468, 328); await sleep(300); } else if (p === 'reveal') { await sleep(1300); await shot(page, 'v2_02_item_earned_reveal'); revealShot = true; } }
check('"new item earned" reveal appeared after the carrots', revealShot);
await sleep(300); await talkOut(page, 6); await waitIdle(page);
check('bunny pillow unlocked once', JSON.stringify((await ptr(page, 'state')).unlockedDecor) === '["bunny_pillow"]');
await sleep(800); await shot(page, 'v2_03_home_glows_after_reward');

// ---- C. decorate, reload, everything is still there
await page.evaluate((s) => localStorage.setItem('ptr_save_v1', JSON.stringify(s)), save({ unlockedDecor: ALL12 }));
await page.reload({ waitUntil: 'load' }); await load(); await talkOut(page, 6); await waitIdle(page);
check('starts in the bedroom from the save', (await ptr(page, 'scene')) === 'bedroom');
await shot(page, 'v2_04_bedroom_empty_with_sparkles');
const plan = [['slot_lamp','star_lamp'],['slot_bed','canopy_bed'],['slot_plush_a','bunny_pillow'],['slot_plush_b','unicorn_plush'],['slot_rug','rainbow_rug'],['slot_wall_a','shell_mirror'],['slot_wall_b','mermaid_art'],['slot_wall_c','butterfly_painting'],['slot_window','moon_curtain'],['slot_shelf','flower_pot'],['slot_accent','crystal_nightstand'],['slot_accent_b','treasure_chest']];
let n = 0;
for (const [slot, item] of plan) { const r = await placeItem(page, slot, item, slot === 'slot_plush_a' ? 'v2_05_picker_plush' : slot === 'slot_wall_a' ? 'v2_06_picker_wall' : undefined); if (r === 'placed') n++; else console.log('  ', slot, r); }
check('placed all 12 items', n === 12, `(${n})`);
await sleep(600); await shot(page, 'v2_07_bedroom_fully_decorated');
// a locked item is shown as a silhouette and can't be placed
await page.evaluate(() => { const s = window.__ptr.state(); s.unlockedDecor = s.unlockedDecor.filter((x) => x !== 'moon_curtain'); delete s.bedroom.slot_window; });
const before = JSON.stringify((await ptr(page, 'state')).bedroom);
console.log('  locked-item tap ->', await placeItem(page, 'slot_window', 'moon_curtain', 'v2_08_picker_locked_silhouette'));
check('locked item cannot be placed', JSON.stringify((await ptr(page, 'state')).bedroom) === before);
await page.evaluate(() => window.__ptr.state().unlockedDecor.push('moon_curtain'));
const placedBefore = JSON.stringify((await ptr(page, 'state')).bedroom);
await sleep(500); await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.reload({ waitUntil: 'load' }); await load(); await talkOut(page, 6); await waitIdle(page);
const after = (await ptr(page, 'state'));
check('decorated room survives a reload', JSON.stringify(after.bedroom) === placedBefore, Object.keys(after.bedroom).length + ' items');
await shot(page, 'v2_09_bedroom_after_reload');
// take an item away by tapping it again
const cur = after.bedroom.slot_rug; console.log('  rug before', cur);
console.log('  remove rug ->', await placeItem(page, 'slot_rug', 'rainbow_rug'));
check('tapping a placed item again removes it', !(await ptr(page, 'state')).bedroom.slot_rug);

// ---- D. a v0.1 save (old ids) still loads
await page.evaluate((s) => localStorage.setItem('ptr_save_v1', JSON.stringify(s)), save({ unlockedDecor: ['lamp', 'rug'], bedroom: { slot_table: 'lamp', slot_floor: 'rug' }, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, captions: true, reducedEffects: false, dpad: false } }));
await page.reload({ waitUntil: 'load' }); await load(); await talkOut(page, 6); await waitIdle(page);
const mig = await ptr(page, 'state');
check('v0.1 save migrated', mig.bedroom.slot_lamp === 'star_lamp' && mig.bedroom.slot_rug === 'rainbow_rug' && mig.unlockedDecor.includes('star_lamp'), JSON.stringify(mig.bedroom));
check('old save gets narration OFF by default', mig.settings.narration === false);
await shot(page, 'v2_10_migrated_v01_save');

// ---- E. narration is still there as an optional extra
await page.evaluate(() => { window.__plays.length = 0; });
await ptr(page, 'setNarration', true);
await ptr(page, 'tapObject', 'nana'); await sleep(2500);
const withVoice = await page.evaluate(() => window.__plays.slice());
await shot(page, 'v2_11_optional_narration_with_replay_button');
check('narration ON: clips play again', withVoice.length > 0, withVoice.join(','));
await talkOut(page, 8); await waitIdle(page);
await ptr(page, 'setNarration', false); await page.evaluate(() => { window.__plays.length = 0; });
await ptr(page, 'tapObject', 'nana'); await sleep(2500);
check('narration OFF again: silence', (await page.evaluate(() => window.__plays)).length === 0);
await talkOut(page, 8);

const errs = await page.evaluate(() => window.__errs);
check('no page errors', errs.length === 0, errs.join('|'));
const bad = logs.filter((l) => !l.includes('404') && !l.includes('narration'));
check('no console errors', bad.length === 0, bad.join(' | ').slice(0, 300));
await browser.close();
console.log(ok ? 'V0.2 CHECKS PASSED' : 'V0.2 CHECKS FAILED');
process.exit(ok ? 0 : 1);

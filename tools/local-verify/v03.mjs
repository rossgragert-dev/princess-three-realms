// v0.3 checks: Royal Wardrobe + Enchanted Vanity open/tap/close, saves, outfit in gameplay, rapid taps, reload.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
const talkOut = async (page, max = 14) => { for (let i = 0; i < max; i++) { if (!(await ptr(page, 'modal'))) return; await sleep(1100); await tapL(page, 440, 330); await sleep(500); if (await ptr(page, 'modal')) await tapL(page, 468, 328); await sleep(400); } };
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const FLAGS = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','LAMP_PLACED','SHORE_SEEN','GROTTO_SEEN','GROTTO_CHEST','SHORE_CHEST','CREEK_CHEST','WAND_LIT','GARDEN_SEQUENCED','BUTTERFLY_FOUND','FAIRY_DUST_FOUND','MOONSTONE_FOUND'];
const save = (o = {}) => ({ version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FLAGS.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], bedroom: {}, puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: false }, ...o });
let ok = true; const check = (name, cond, extra = '') => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); if (!cond) ok = false; };
const vp = process.env.VP ? JSON.parse(process.env.VP) : undefined;
const { browser, page, logs } = await launch(vp);
const load = async () => { await page.goto(BASE, { waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };
const st = (fn, ...a) => page.evaluate((f, args) => window.__station[f](...args), fn, a);
const hasStation = () => page.evaluate(() => !!window.__station);
const waitStation = async (key) => { await page.waitForFunction((k) => window.__station && window.__station.key === k, { timeout: 8000 }, key); await sleep(500); };
const tapCard = async (id) => { const c = (await st('cards')).find((k) => k.id === id); if (!c) return false; await tapL(page, c.x, c.y); await sleep(220); return true; };
const tapTab = async (i) => { const t = (await st('tabs'))[i]; await tapL(page, t.x, t.y); await sleep(220); };
const tapBtn = async (n) => { const b = (await st('buttons'))[n]; await tapL(page, b.x, b.y); await sleep(350); };
const app = async () => (await ptr(page, 'state')).appearance;
const openStation = async (which) => { await ptr(page, 'tapObject', which === 'Wardrobe' ? 'wardrobe_station' : 'vanity_station'); await waitStation(which); };

await page.goto(BASE, { waitUntil: 'load' });
await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save());
await load(); await sleep(1500); await shot(page, 'v3_00_pending_reveal'); await talkOut(page, 12); await waitIdle(page);
check('starts in the bedroom', (await ptr(page, 'scene')) === 'bedroom');
await shot(page, 'v3_01_bedroom_with_props');

// ---- Wardrobe
await openStation('Wardrobe');
check('wardrobe opened', await hasStation());
await shot(page, 'v3_02_wardrobe_dresses');
let cards = await st('cards');
check('wardrobe dress tab lists 6 on page 1 and has 2 pages', cards.length === 6 && (await st('pages')) === 2);
check('first dress equipped by default', cards[0].equipped && cards[0].id === 'royal_ball');
check('page 1 shows earned dresses as owned in this save', (await st('cards')).every((c) => c.owned));
await tapBtn('next'); await sleep(300);
await shot(page, 'v3_03_wardrobe_dresses_page2');
check('page 2 shows the last dress, owned', (await st('cards')).length === 2 && (await st('cards')).every((c) => c.owned));
await tapBtn('prev'); await sleep(300);
await tapCard('rainbow_gown');
check('tapping a dress equips it immediately', (await app()).dressId === 'rainbow_gown');
await tapTab(1); await tapCard('purple');
check('dress colour chosen', (await app()).dressColorId === 'purple');
await shot(page, 'v3_04_wardrobe_colors');
await tapTab(2); await shot(page, 'v3_05_wardrobe_shoes'); await tapCard((await st('cards'))[2].id);
await tapTab(3); await shot(page, 'v3_06_wardrobe_accessories'); await tapCard('moon_cape');
check('moon cape chosen', (await app()).accessoryId === 'moon_cape');
await shot(page, 'v3_07_wardrobe_full_outfit');

// ---- switch to vanity from wardrobe
await tapBtn('switch'); await waitStation('Vanity');
check('switch button goes to the Vanity', (await st('slot')) === 'hairstyle');
await shot(page, 'v3_08_vanity_hairstyles');
await tapCard('curls'); await tapTab(1); await tapCard('auburn'); await tapTab(2); await shot(page, 'v3_09_vanity_tiaras');
await tapCard('star_tiara');
await tapTab(3); await tapCard('star_drops'); await tapTab(4); await tapCard('pearl_strand'); await tapTab(5); await tapCard('star_freckles'); await shot(page, 'v3_10_vanity_face');
await tapTab(6); await tapCard('tan');
await shot(page, 'v3_11_vanity_full_look');
const a1 = await app(); console.log('  appearance', JSON.stringify(a1));
await tapBtn('accept'); await sleep(900);
check('closed back to the world', !(await hasStation()));
check('world is not stuck busy/modal', !(await ptr(page, 'busy')) && !(await ptr(page, 'modal')));
const ps = await ptr(page, 'playerSprite'); check('player uses the live look texture', ps.tex === 'princess_look', JSON.stringify(ps));
await sleep(500); await shot(page, 'v3_12_bedroom_new_look');

// ---- persistence: reload keeps the look
await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await sleep(300);
await page.reload({ waitUntil: 'load' }); await load(); await talkOut(page, 6); await waitIdle(page);
const a2 = await app();
check('look survives a reload', JSON.stringify(a2) === JSON.stringify(a1));
await shot(page, 'v3_13_after_reload');

// ---- open/tap/close x12 each, alternating
let cyc = 0;
for (let i = 0; i < 12; i++) {
  const w = i % 2 ? 'Vanity' : 'Wardrobe';
  await openStation(w);
  const cs = await st('cards'); const pick = cs[(i + 1) % cs.length];
  await tapCard(pick.id); await tapTab(1); await tapTab(0);
  await tapBtn('accept'); await sleep(500);
  if (!(await hasStation()) && !(await ptr(page, 'busy')) && !(await ptr(page, 'modal'))) cyc++;
}
check('12 open/tap/close cycles all clean', cyc === 12, `(${cyc})`);

// ---- rapid taps
await openStation('Wardrobe');
for (let i = 0; i < 30; i++) { const cs = await st('cards'); const c = cs[i % cs.length]; await tapL(page, c.x, c.y); if (i % 5 === 0) await tapTab(i % 4); }
for (let i = 0; i < 8; i++) { await tapBtn('next'); await tapBtn('prev'); }
const a3 = await app(); check('rapid taps leave a valid saved look', typeof a3.dressId === 'string' && JSON.stringify((await ptr(page, 'state')).appearance) === JSON.stringify(a3));
await tapBtn('accept'); await tapL(page, 432, 350); await sleep(700);
check('double-tapping accept closes cleanly once', !(await hasStation()) && !(await ptr(page, 'modal')));

// ---- locked items on a fresh save
await page.evaluate(() => { const s = window.__ptr.state(); s.flags.RAINBOW_BRIDGE_OPEN = false; s.wardrobe.unlocked = s.wardrobe.unlocked.filter((x) => x !== 'rainbow_gown'); s.appearance.dressId = 'royal_ball'; });
await openStation('Wardrobe'); await tapTab(0);
const locked = (await st('cards')).find((c) => c.id === 'rainbow_gown');
check('unearned dress is locked', locked && !locked.owned);
await tapCard('rainbow_gown'); await sleep(200);
check('tapping a locked dress does not equip it', (await app()).dressId === 'royal_ball');
await shot(page, 'v3_14_locked_silhouette');
await tapBtn('accept'); await sleep(600);

console.log('errors:', await page.evaluate(() => window.__errs));
console.log(logs.filter((l) => !/favicon|audio/i.test(l)).slice(0, 8).join('\n'));
await browser.close();
console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);

// v0.3 extras: new sparkle finds + wearable reveal, mermaid keeps hair/skin, outfit combos in world, portrait viewport.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
const FLAGS = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','LAMP_PLACED','SHORE_SEEN','GROTTO_SEEN'];
const mk = (o = {}) => ({ version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FLAGS.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], bedroom: {}, puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: false }, ...o });
let ok = true; const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (e ? '  ' + e : '')); if (!c) ok = false; };
const modal = (page) => ptr(page, 'modal');
const clear = async (page, max = 12) => { for (let i = 0; i < max; i++) { if (!(await modal(page))) return; await sleep(1100); await tapL(page, 440, 330); await sleep(500); if (await modal(page)) await tapL(page, 468, 328); await sleep(400); } };
let { browser, page, logs } = await launch();
const load = async (save) => { await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate((s) => { localStorage.clear(); localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };

// ---- A. discovering a sparkle in the woods earns a wearable (reveal), then it is owned but not auto-equipped
const noWear = mk({ scene: 'woods', spawn: 'from_courtyard', flags: Object.fromEntries(FLAGS.map((f) => [f, true])) });
await load(noWear); await clear(page);
check('in the woods', (await ptr(page, 'scene')) === 'woods');
check('fairy gown not yet owned', !(await ptr(page, 'state')).wardrobe.unlocked.includes('fairy_sparkle'));
await ptr(page, 'tapObject', 'fairy_dust_spot');
let saw = false;
for (let i = 0; i < 60 && !saw; i++) { await sleep(250); if ((await ptr(page, 'panel')) === 'reveal') { await sleep(1200); await shot(page, 'v3b_01_find_reveal'); saw = true; } else if ((await ptr(page, 'panel')) === 'dialogue') await tapL(page, 468, 328); }
check('reveal for the found gown appeared', saw);
await clear(page); await waitIdle(page);
const s1 = await ptr(page, 'state');
check('fairy gown now owned, not auto-equipped', s1.wardrobe.unlocked.includes('fairy_sparkle') && s1.appearance.dressId === 'royal_ball');
check('find flag set', s1.flags.FAIRY_DUST_FOUND === true);

// ---- B. mermaid keeps hair colour + skin tone
await load(mk({ scene: 'shore', spawn: 'from_woods', form: 'mermaid', appearance: { hairColorId: 'auburn', skinToneId: 'tan', hairstyleId: 'curls', dressColorId: 'blue' } }));
await clear(page);
const form = await ptr(page, 'form'); check('mermaid form on the shore', form === 'mermaid');
const ps = await ptr(page, 'playerSprite'); check('mermaid uses live look texture', ps.tex === 'mermaid_look', JSON.stringify(ps));
await sleep(500); await shot(page, 'v3b_02_mermaid_auburn');
fs.writeFileSync('/tmp/mermaid_look.png', Buffer.from((await page.evaluate(() => window.__ptr.dumpTexture('mermaid_look'))).split(',')[1], 'base64'));

// ---- C. outfit combos visible in the world + wardrobe/vanity screenshots
const combos = [
  { n: 'rainbow', a: { dressId: 'rainbow_gown', dressColorId: 'pink', shoesId: 'boots', accessoryId: 'butterfly_wings', hairstyleId: 'braids', hairColorId: 'black', tiaraId: 'flower_crown', earringsId: 'flower_dangles', necklaceId: 'heart_pendant', faceAccentId: 'butterfly_accent', skinToneId: 'deep' } },
  { n: 'night', a: { dressId: 'starry_night', dressColorId: 'blue', shoesId: 'slippers', accessoryId: 'moon_cape', hairstyleId: 'bun', hairColorId: 'platinum', tiaraId: 'star_tiara', earringsId: 'star_drops', necklaceId: 'star_pendant', faceAccentId: 'glitter_cheeks', skinToneId: 'honey' } },
  { n: 'garden', a: { dressId: 'garden', dressColorId: 'teal', shoesId: 'slippers', accessoryId: 'flower_shawl', hairstyleId: 'ponytail', hairColorId: 'copper', tiaraId: 'bunny_ribbon', earringsId: 'pearl_studs', necklaceId: 'shell_necklace', faceAccentId: 'star_freckles', skinToneId: 'rose' } }
];
const allFlags = [...FLAGS, 'GROTTO_CHEST','SHORE_CHEST','CREEK_CHEST','WAND_LIT','GARDEN_SEQUENCED','BUTTERFLY_FOUND','FAIRY_DUST_FOUND','MOONSTONE_FOUND'];
for (const c of combos) {
  await load(mk({ flags: Object.fromEntries(allFlags.map((f) => [f, true])) }));
  await clear(page, 12);
  const bad = await page.evaluate((a) => { const st = window.__ptr.state(); Object.assign(st.appearance, a); window.__ptr.refreshLook(); return JSON.stringify(st.appearance); }, c.a);
  await ptr(page, 'tapTile', 4, 13); await sleep(1500);
  await shot(page, `v3b_world_${c.n}`);
  await ptr(page, 'tapObject', 'wardrobe_station'); await page.waitForFunction(() => window.__station?.key === 'Wardrobe', { timeout: 8000 }); await sleep(600);
  await shot(page, `v3b_${c.n}_wardrobe`);
  const b = (await page.evaluate(() => window.__station.buttons())).switch; await tapL(page, b.x, b.y);
  await page.waitForFunction(() => window.__station?.key === 'Vanity', { timeout: 8000 }); await sleep(600);
  await shot(page, `v3b_${c.n}_vanity`);
  const acc = (await page.evaluate(() => window.__station.buttons())).accept; await tapL(page, acc.x, acc.y); await sleep(800);
  const same = JSON.stringify((await ptr(page, 'state')).appearance) === bad;
  check(`combo ${c.n}: look unchanged by browsing screens`, same);
}

// ---- D. portrait viewport (iPad portrait)
await browser.close();
({ browser, page, logs } = await launch({ width: 768, height: 1024 }));
await load(mk({ flags: Object.fromEntries(allFlags.map((f) => [f, true])) })); await clear(page, 12);
await ptr(page, 'tapObject', 'vanity_station'); await page.waitForFunction(() => window.__station?.key === 'Vanity', { timeout: 8000 }); await sleep(700);
await shot(page, 'v3b_portrait_vanity');
const bb = await (await page.$('canvas')).boundingBox();
const cards = await page.evaluate(() => window.__station.cards());
const cssW = (cards[0].w / 512) * bb.width; check('portrait: option card hit target >= 44 CSS px', cssW >= 44 && (cards[0].h / 384) * bb.height >= 44, `${cssW.toFixed(0)}px wide`);
const tabs = await page.evaluate(() => window.__station.tabs());
check('portrait: 7 tab spacing >= 44 CSS px', ((tabs[1].y - tabs[0].y) / 384) * bb.height >= 44, `${(((tabs[1].y - tabs[0].y) / 384) * bb.height).toFixed(0)}px`);
console.log('errors:', await page.evaluate(() => window.__errs));
await browser.close(); console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);

// v0.4b: King's fireworks, Queen's wand workshop, Unicorn Tag. Real Chrome. Run detached; reads BASE and SHOTS.
import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot, waitIdle } from './flow.mjs';
const BASE = process.env.BASE || 'http://localhost:4173/index.html';
let ok = true; const check = (n, c, e = '') => { console.log((c ? 'PASS ' : 'FAIL ') + n + (e ? '  ' + e : '')); if (!c) ok = false; };
const FL = ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN','WILLA_MET','RAINBOW_BRIDGE_OPEN','MARINA_HELPED','PEARL_PLACED','STAR_1_FOUND','SHORE_SEEN','GROTTO_SEEN'];
const mk = (o = {}) => ({ version: 1, scene: 'festival', spawn: 'from_courtyard', form: 'princess', flags: Object.fromEntries(FL.map((f) => [f, true])), stars: 1, stickers: [], unlockedDecor: [], puzzles: {}, settings: { musicVolume: 0.5, voiceVolume: 1, sfxVolume: 0.7, narration: false, captions: false, reducedEffects: false, dpad: true }, ...o });
let { browser, page, logs } = await launch();
const load = async (save) => { await page.goto(BASE, { waitUntil: 'load' }); await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('ptr_save_v1', JSON.stringify(s)); }, save); await page.reload({ waitUntil: 'load' }); await sleep(2000); for (let k = 0; k < 6; k++) { await tapL(page, 256, 300); if (await page.waitForFunction(() => !!window.__ptr, { timeout: 6000 }).then(() => true, () => false)) break; } await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500); };
const talkOut = async (max = 8) => { for (let i = 0; i < max; i++) { if (!(await ptr(page, 'modal'))) return; await sleep(500); await tapL(page, 468, 328); await sleep(450); } };
const stationKey = () => page.evaluate(() => window.__station && window.__station.key);
const waitStation = async (key, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if ((await stationKey()) === key) { await sleep(500); return true; } await sleep(300); if (await ptr(page, 'modal')) await talkOut(2); } return false; };
const st = (f) => page.evaluate((fn) => window.__station[fn](), f);
const S = () => ptr(page, 'state');
const worldBack = async () => { const t0 = Date.now(); while (Date.now() - t0 < 6000) { if (!(await stationKey())) return true; await sleep(200); } return false; };
try {
  // ================================================================= FIREWORKS (King)
  await load(mk()); await waitIdle(page);
  check('festival garden loads', (await ptr(page, 'scene')) === 'festival');
  await shot(page, 'v04b_01_festival_king');
  await ptr(page, 'tapObject', 'king');
  check('King opens fireworks screen', await waitStation('Fireworks'));
  await sleep(500);
  const btn = await st('buttons'); const rings = await st('rings');
  check('6 colours, 5 shapes, 3 modes', rings.filter((r) => r.kind === 'color').length === 6 && rings.filter((r) => r.kind === 'shape').length === 5 && rings.filter((r) => r.kind === 'mode').length === 3);
  const cb = await (await page.$('canvas')).boundingBox();
  check('every option >= 44 CSS px at this viewport (58 logical)', 58 * cb.width / 512 >= 44, `${(58 * cb.width / 512).toFixed(0)} css px`);
  await shot(page, 'v04b_02_fireworks_options');
  const colors = ['pink', 'gold', 'blue', 'green', 'violet', 'rainbow'], shapes = ['star', 'heart', 'flower', 'spiral', 'rainbow'];
  const tapOpt = async (kind, id) => { const p = btn[`${kind}:${id}`]; await tapL(page, p.x, p.y); await sleep(120); };
  await tapOpt('color', 'gold'); await tapOpt('shape', 'heart'); await tapOpt('mode', 3);
  let s0 = await st('state'); check('selection works', s0.color === 'gold' && s0.shape === 'heart' && s0.mode === 3, JSON.stringify(s0));
  await tapL(page, 256, 90); await sleep(900); await shot(page, 'v04b_03_fireworks_burst_a'); await sleep(900); await shot(page, 'v04b_04_fireworks_burst_b');
  await sleep(2500);
  s0 = await st('state'); check('3-in-a-row launched 3 bursts and session completed', s0.launched >= 3 && s0.sessionDone, JSON.stringify(s0));
  await sleep(1800); await shot(page, 'v04b_05_garland_reward');
  check('garland unlocked once', (await S()).unlockedDecor.filter((d) => d === 'festival_garland').length === 1);
  // 10 repeated interactions with varied choices (sound off already), button mashing included
  for (let i = 0; i < 10; i++) { await tapOpt('color', colors[i % 6]); await tapOpt('shape', shapes[i % 5]); await tapOpt('mode', (i % 3) + 1); await tapL(page, 80 + i * 40, 60 + (i % 4) * 40); if (i % 3 === 0) { for (let k = 0; k < 6; k++) { await tapL(page, 100 + k * 60, 120); await sleep(30); } } await sleep(700); }
  await sleep(1500); for (let i = 0; i < 40; i++) { s0 = await st('state'); if (s0.active === 0 && s0.queued === 0) break; await sleep(500); }
  check('10 repeated interactions: bounded particles (<= 3 bursts x 96)', s0.maxLive <= 288 && s0.total > 100, `maxLive ${s0.maxLive} total ${s0.total}`);
  check('no stuck bursts after settling', s0.active === 0 && s0.queued === 0, JSON.stringify(s0));
  await tapL(page, btn.back.x, btn.back.y); check('back returns to the festival', await worldBack());
  await sleep(700); check('world responsive after fireworks', !(await ptr(page, 'modal')) && !(await ptr(page, 'busy')));
  const A = (await S()).activities.fireworks; check('activity progress saved', A.sessions === 1 && A.launched >= 13 && A.designs.length >= 5, JSON.stringify(A));
  // reduced effects, second visit: no second garland, caps lower
  await page.evaluate(() => { window.__ptr.state().settings.reducedEffects = true; });
  await sleep(1200);
  await ptr(page, 'tapObject', 'king'); check('second visit opens again', await waitStation('Fireworks'));
  const b2 = await st('buttons'); for (let i = 0; i < 6; i++) { await tapL(page, b2['mode:3'].x, b2['mode:3'].y); await tapL(page, 120 + i * 50, 100); await sleep(500); }
  await sleep(3500); const s2 = await st('state');
  check('reduced effects: fewer particles (<= 3 x 40)', s2.maxLive <= 120 && s2.total > 0, `maxLive ${s2.maxLive}`);
  await shot(page, 'v04b_06_fireworks_reduced');
  await tapL(page, b2.back.x, b2.back.y); await worldBack(); await sleep(500);
  check('garland granted only once', (await S()).unlockedDecor.filter((d) => d === 'festival_garland').length === 1);

  // ================================================================= WAND WORKSHOP (Queen)
  await load(mk({ scene: 'conservatory', activities: undefined })); await waitIdle(page);
  check('conservatory loads', (await ptr(page, 'scene')) === 'conservatory');
  await shot(page, 'v04b_07_queen_conservatory');
  await ptr(page, 'tapObject', 'queen'); check('Queen opens the workshop', await waitStation('WandWorkshop')); await sleep(600);
  let cards = await st('cards'); const wb = await st('buttons'); const tabs = await st('tabs');
  check('6 wand heads shown, 3 owned at start', cards.length === 6 && cards.filter((c) => c.owned).length >= 3, JSON.stringify(cards.map((c) => c.value + (c.owned ? '+' : '-'))));
  await shot(page, 'v04b_08_wand_heads');
  const lockedHead = cards.find((c) => !c.owned);
  const before = await st('wand'); if (lockedHead) { await tapL(page, lockedHead.x, lockedHead.y); await sleep(300); }
  check('locked option cannot be equipped', JSON.stringify(await st('wand')) === JSON.stringify(before));
  const heart = cards.find((c) => c.value === 'heart'); await tapL(page, heart.x, heart.y); await sleep(500);
  await tapL(page, tabs[1].x, tabs[1].y); await sleep(400); cards = await st('cards'); await shot(page, 'v04b_09_wand_colors');
  check('8 colours shown', cards.length === 8);
  const gold = cards.find((c) => c.value === 'gold'); await tapL(page, gold.x, gold.y); await sleep(500);
  await tapL(page, tabs[2].x, tabs[2].y); await sleep(400); cards = await st('cards'); await shot(page, 'v04b_10_wand_trails');
  check('4 trails shown', cards.length === 4);
  const petal = cards.find((c) => c.value === 'petal'); await tapL(page, petal.x, petal.y); await sleep(1200); await shot(page, 'v04b_11_wand_preview');
  let w = await st('wand'); check('equipped heart/gold/petal', w.headId === 'heart' && w.colorId === 'gold' && w.trailId === 'petal', JSON.stringify(w));
  // 10 repeated choices cycling every owned option
  for (let i = 0; i < 10; i++) { const k = ['head', 'color', 'trail'][i % 3]; const ti = i % 3; await tapL(page, tabs[ti].x, tabs[ti].y); await sleep(250); const cs = (await st('cards')).filter((c) => c.owned); const c = cs[i % cs.length]; await tapL(page, c.x, c.y); await sleep(350); }
  check('10 repeated choices stay valid and saved', (await S()).equippedWand.headId.length > 0);
  await tapL(page, tabs[0].x, tabs[0].y); await sleep(250); let hc = (await st('cards')).find((c) => c.value === 'heart'); await tapL(page, hc.x, hc.y); await sleep(300);
  await tapL(page, tabs[1].x, tabs[1].y); await sleep(250); let gc = (await st('cards')).find((c) => c.value === 'gold'); await tapL(page, gc.x, gc.y); await sleep(300);
  await tapL(page, tabs[2].x, tabs[2].y); await sleep(250); let pc = (await st('cards')).find((c) => c.value === 'petal'); await tapL(page, pc.x, pc.y); await sleep(300);
  await tapL(page, wb.accept.x, wb.accept.y); check('check button closes workshop', await worldBack()); await sleep(800);
  await page.reload({ waitUntil: 'load' }); await sleep(2000); await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500);
  w = (await S()).equippedWand; check('wand survives reload', w.headId === 'heart' && w.colorId === 'gold' && w.trailId === 'petal', JSON.stringify(w));
  // equipped wand reflected in play, still straight
  await waitIdle(page);
  const sc = await ptr(page, 'scene'); console.log('scene after reload', sc);
  await ptr(page, 'stick', 0, 1, 0.6); await sleep(500); await ptr(page, 'stick', 0, 0, 0); await sleep(300);
  const n0 = (await ptr(page, 'shots')).length; await ptr(page, 'magic'); await sleep(260); await shot(page, 'v04b_12_equipped_wand_shot'); await sleep(700);
  const sh = await ptr(page, 'shots'); check('shot carries equipped wand and flies the faced direction', sh.length === n0 + 1 && sh.at(-1).wand === 'heart/gold/petal' && sh.at(-1).dir === 'down', JSON.stringify(sh.at(-1)));

  // ================================================================= UNICORN TAG (Dapple)
  await load(mk({ scene: 'meadow', spawn: 'from_woods', form: 'unicorn' })); await waitIdle(page);
  check('meadow loads', (await ptr(page, 'scene')) === 'meadow' && (await ptr(page, 'form')) === 'unicorn');
  await shot(page, 'v04b_13_meadow');
  const runTag = async (full) => {
    await ptr(page, 'tapObject', 'dapple');
    const t0 = Date.now(); while (Date.now() - t0 < 30000 && !(await ptr(page, 'tag'))) { if (await ptr(page, 'modal')) await talkOut(2); await sleep(300); }
    let tag = await ptr(page, 'tag'); if (!tag) return { started: false };
    if (!full) { await sleep(800); const e = tag.exit; await tapL(page, e.x, e.y); await sleep(600); return { started: true, ended: !(await ptr(page, 'tag')) }; }
    let shotsTaken = 0, last = Date.now();
    while (Date.now() - last < 240000) {
      tag = await ptr(page, 'tag'); if (!tag) break;
      const foot = await ptr(page, 'foot'); let dx = tag.pal.x - foot.x, dy = tag.pal.y - foot.y; const m = Math.hypot(dx, dy) || 1;
      const sign = tag.phase === 'companionIt' ? -1 : 1;
      await ptr(page, 'stick', sign * dx / m, sign * dy / m, 1);
      if (tag.phase === 'playerIt' && tag.stars === 1 && shotsTaken === 0) { shotsTaken = 1; await shot(page, 'v04b_14_tag_in_action'); }
      if (tag.stars === 3 && shotsTaken < 2) { shotsTaken = 2; await sleep(300); await shot(page, 'v04b_15_tag_celebration'); }
      await sleep(100);
    }
    await ptr(page, 'stick', 0, 0, 0); await sleep(700);
    return { started: true, finished: !(await ptr(page, 'tag')) };
  };
  const r1 = await runTag(true); check('tag run 1: started and finished three rounds', r1.started && r1.finished, JSON.stringify(r1));
  let T = (await S()).activities.tag; check('tag session counted with 3 tags', T.sessions === 1 && T.tags >= 3, JSON.stringify(T));
  check('Meadow Cushion earned once', (await S()).unlockedDecor.filter((d) => d === 'meadow_cushion').length === 1);
  await sleep(1500); await waitIdle(page);
  let okRuns = 0; for (let i = 0; i < 2; i++) { await waitIdle(page); const r = await runTag(true); if (r.started && r.finished) okRuns++; await sleep(1200); await waitIdle(page); }
  check('tag runs 2-3 also finish', okRuns === 2, `${okRuns}/2`);
  check('cushion still only once, sessions=3', (await S()).unlockedDecor.filter((d) => d === 'meadow_cushion').length === 1 && (await S()).activities.tag.sessions === 3);
  let exits = 0; for (let i = 0; i < 10; i++) { await waitIdle(page); const r = await runTag(false); if (r.started && r.ended) exits++; await sleep(500); }
  check('10 start/exit cycles never softlock', exits === 10, `${exits}/10`);
  await waitIdle(page); await ptr(page, 'stick', 1, 0, 0.7); await sleep(400); await ptr(page, 'stick', 0, 0, 0);
  check('player can still walk after tag exit', !(await ptr(page, 'tag')) && !(await ptr(page, 'modal')));
  // princess is told how to join in
  await page.evaluate(() => window.__ptr.changeForm('princess')); await sleep(1500); await waitIdle(page);
  await ptr(page, 'tapObject', 'dapple'); await sleep(3500); const dl = await ptr(page, 'dialogueText').catch(() => ''); console.log('princess dialogue:', dl);
  await talkOut(4); check('princess gets a gentle prompt, no game starts', !(await ptr(page, 'tag')));
} catch (e) { console.log('DRIVER ERROR', e && e.stack || e); ok = false; await shot(page, 'v04b_ERROR').catch(() => {}); }
const errs = await page.evaluate(() => window.__errs).catch(() => []);
console.log('page errors:', JSON.stringify(errs)); console.log('console issues:', JSON.stringify(logs.filter((l) => !/favicon/.test(l)).slice(0, 8)));
check('no page errors', errs.length === 0);
console.log(ok ? 'ALL OK' : 'SOME FAILED'); await browser.close(); process.exit(ok ? 0 : 1);

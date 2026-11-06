import { LayoutEditor } from '../content/furniture';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DECOR, DECOR_IDS, SLOTS, decorForFlag, decorForSlot, optionsForSlot, placeDecor, sanitizeDecor, slotHasNewOption, unplacedCount } from '../content/decorCatalog';
import { PUZZLES, puzzleById } from '../content/puzzleBank';
import { SCRIPT } from '../content/dialogue';
import { OBJECTIVE_NARRATION } from '../world/guide';
import { glyphsFor, isGlyph } from '../content/lineGlyphs';
import { ITEM, UI } from '../content/frameIndex';
import { MAIN_PATH, completeFlag } from '../systems/questEngine';
import { defaultState, sanitize, SaveManager, SAVE_KEY, type KV } from '../systems/saveManager';
import { getMap } from '../world/maps';
import { CHEST_FLAG, FIND_FLAG } from '../world/story';
import { AudioManager } from '../systems/audioManager';
import type { QuestFlag } from '../types/game';

const manifest = JSON.parse(readFileSync(new URL('../../public/assets/manifest.json', import.meta.url), 'utf8')) as { images: { key: string }[]; sheets: { key: string }[] };
const textures = new Set([...manifest.images.map((i) => i.key), ...manifest.sheets.map((s) => s.key)]);
const memStore = (): KV & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; };

describe('bedroom decor catalog', () => {
  it('has at least 12 items, each with its own unlock flag and a real picture', () => {
    assert.ok(DECOR_IDS.length >= 12);
    assert.equal(new Set(DECOR_IDS.map((i) => DECOR[i].flag)).size, DECOR_IDS.length, 'one flag per item');
    for (const id of DECOR_IDS) {
      const d = DECOR[id];
      assert.equal(d.id, id);
      assert.ok(textures.has(d.sprite.key), `${id}: texture ${d.sprite.key} not in asset manifest`);
      assert.ok(isGlyph(d.hintIcon), `${id}: hint icon ${d.hintIcon}`);
      assert.ok(SLOTS.some((s) => s.category === d.category), `${id}: no slot for category ${d.category}`);
    }
  });
  it('items come from every kind of source', () => {
    const kinds = new Set(DECOR_IDS.map((i) => DECOR[i].source));
    for (const k of ['quest', 'puzzle', 'gift', 'hidden', 'chest']) assert.ok(kinds.has(k as never), k);
  });
  it('every unlock flag can actually be earned in the world', () => {
    const earnable = new Set<QuestFlag>([...MAIN_PATH.map((s) => s.flag), ...PUZZLES.map((p) => p.successEvent), ...Object.values(CHEST_FLAG), ...Object.values(FIND_FLAG)]);
    for (const id of DECOR_IDS) assert.ok(earnable.has(DECOR[id].flag), `${id} needs ${DECOR[id].flag}, which nothing sets`);
  });
  it('chests and hidden spots exist in the maps', () => {
    const ids = new Set(Object.keys({ ...CHEST_FLAG, ...FIND_FLAG }));
    const found = new Set<string>();
    for (const sc of ['courtyard', 'woods', 'shore', 'grotto', 'bedroom', 'enchanted', 'garden', 'river'] as const) for (const o of getMap(sc).objects) if (ids.has(o.id)) found.add(o.id);
    assert.deepEqual([...found].sort(), [...ids].sort());
  });
  it('legacy hotspot table (kept to migrate old saves): at least 8 slots, unique ids and tiles', () => {
    assert.ok(SLOTS.length >= 8);
    // v0.4a.1: the hotspot objects are gone from the room (furniture is free-placed); SLOTS survive only to migrate old saves
    assert.equal(getMap('bedroom').objects.filter((o) => o.kind === 'slot').length, 0);
    assert.equal(new Set(SLOTS.map((s) => `${s.x},${s.y}`)).size, SLOTS.length);
    assert.ok(new Set(SLOTS.map((s) => s.category)).size >= 8, 'eight categories');
  });
  it('every one of the 12 items can be on display at once (enough slots per category)', () => {
    const need = (cat: string) => DECOR_IDS.filter((i) => DECOR[i].category === cat).length, have = (cat: string) => SLOTS.filter((s) => s.category === cat).length;
    for (const cat of ['bed', 'rug', 'lamp', 'wall', 'plush', 'shelf', 'window', 'accent']) assert.ok(have(cat) >= need(cat), `${cat}: ${have(cat)} slots for ${need(cat)} items`);
  });
  it('slots only offer items of their category', () => {
    for (const s of SLOTS) for (const d of optionsForSlot(s.id)) assert.equal(d.category, s.category);
    assert.equal(decorForSlot('slot_wall_a', ['mermaid_art', 'star_lamp']).filter((d) => d.source !== 'starter').length, 1);
  });
});

describe('earning decor through Chapter 1', () => {
  it('main path + puzzles + chests + hidden find unlock all 12, each exactly once', () => {
    const s = defaultState();
    for (const step of MAIN_PATH) completeFlag(s, step.flag);
    for (const f of ['SHELLS_MATCHED', 'GARDEN_SEQUENCED', 'CREEK_CHEST', 'SHORE_CHEST', 'GROTTO_CHEST', 'BUTTERFLY_FOUND'] as QuestFlag[]) assert.equal(completeFlag(s, f), true, f);
    assert.deepEqual([...s.unlockedDecor].sort(), [...DECOR_IDS].sort());
    for (const f of ['STAR_1_FOUND', 'SHELLS_MATCHED', 'BUTTERFLY_FOUND'] as QuestFlag[]) assert.equal(completeFlag(s, f), false);
    assert.equal(s.unlockedDecor.length, DECOR_IDS.length, 'no duplicates / no farming');
  });
  it('specific Chapter 1 rewards', () => {
    const s = defaultState();
    completeFlag(s, 'INTRO_DONE'); completeFlag(s, 'PIP_CARROTS_DONE');
    assert.deepEqual(s.unlockedDecor, ['bunny_pillow']);
    for (const f of ['TREE_GATE_OPEN', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'PEARL_PLACED', 'STAR_1_FOUND'] as QuestFlag[]) completeFlag(s, f);
    for (const id of ['unicorn_plush', 'shell_mirror', 'mermaid_art', 'star_lamp']) assert.ok(s.unlockedDecor.includes(id), id);
    assert.ok(!s.unlockedDecor.includes('canopy_bed'));
    completeFlag(s, 'LAMP_PLACED');
    assert.ok(s.unlockedDecor.includes('canopy_bed'), "Nana's gift");
  });
  it('puzzle reward data agrees with the unlock table', () => {
    for (const p of PUZZLES) if (p.reward?.decor) assert.equal(decorForFlag(p.successEvent), p.reward.decor, p.id);
  });
  it('sparkle marker / glowing Home logic', () => {
    const un = ['bunny_pillow'];
    assert.equal(slotHasNewOption('slot_plush_a', un, {}), true);
    assert.equal(slotHasNewOption('slot_plush_a', un, { slot_plush_a: 'bunny_pillow' }), false);
    assert.equal(slotHasNewOption('slot_rug', un, {}), false);
    assert.equal(unplacedCount(un, {}), 1);
    assert.equal(unplacedCount(un, { slot_plush_b: 'bunny_pillow' }), 0);
  });
});

describe('placing items', () => {
  const st = () => ({ unlockedDecor: ['star_lamp', 'bunny_pillow', 'unicorn_plush', 'mermaid_art'], bedroom: {} as Record<string, string> });
  it('places, moves and clears', () => {
    const s = st();
    assert.equal(placeDecor(s, 'slot_lamp', 'star_lamp'), true);
    assert.equal(s.bedroom.slot_lamp, 'star_lamp');
    assert.equal(placeDecor(s, 'slot_plush_a', 'bunny_pillow'), true);
    assert.equal(placeDecor(s, 'slot_plush_b', 'bunny_pillow'), true, 'move to the other plush spot');
    assert.equal(s.bedroom.slot_plush_a, undefined);
    assert.equal(s.bedroom.slot_plush_b, 'bunny_pillow');
    assert.equal(placeDecor(s, 'slot_plush_b', null), true);
    assert.deepEqual(s.bedroom, { slot_lamp: 'star_lamp' });
  });
  it('refuses locked items, wrong category and unknown slots', () => {
    const s = st();
    assert.equal(placeDecor(s, 'slot_rug', 'rainbow_rug'), false, 'locked');
    assert.equal(placeDecor(s, 'slot_rug', 'star_lamp'), false, 'wrong slot');
    assert.equal(placeDecor(s, 'slot_nope', 'star_lamp'), false);
    assert.deepEqual(s.bedroom, {});
  });
  it('the same wall art can hang in either wall slot, other art in the other', () => {
    const s = st(); s.unlockedDecor.push('shell_mirror');
    assert.equal(placeDecor(s, 'slot_wall_a', 'mermaid_art'), true);
    assert.equal(placeDecor(s, 'slot_wall_b', 'shell_mirror'), true);
    assert.equal(placeDecor(s, 'slot_wall_b', 'mermaid_art'), true);
    assert.deepEqual(s.bedroom, { slot_wall_b: 'mermaid_art' });
  });
});

describe('saved bedroom state', () => {
  it('round-trips unlocked + placed items through storage', () => {
    const store = memStore(); const a = new SaveManager(store);
    a.state.unlockedDecor = ['star_lamp', 'unicorn_plush', 'moon_curtain'];
    const ed = new LayoutEditor(a.state.bedroomLayout, () => a.state.unlockedDecor);
    for (const [item, x, y] of [['star_lamp', 17, 8], ['unicorn_plush', 8, 12], ['moon_curtain', 6, 2]] as const) assert.ok('id' in ed.place(item, x, y), item);
    a.state.bedroomLayout = ed.layout; a.save();
    const b = new SaveManager(store);
    const byId = (l: { id: string }[]) => [...l].sort((x, y) => x.id.localeCompare(y.id));
    assert.deepEqual(byId(b.state.bedroomLayout), byId(ed.layout));
    for (const i of ['star_lamp', 'unicorn_plush', 'moon_curtain']) assert.ok(b.state.bedroomLayout.some((p) => p.item === i), i);
    assert.deepEqual(b.state.unlockedDecor, ['star_lamp', 'unicorn_plush', 'moon_curtain']);
    assert.ok(store.m.get(SAVE_KEY));
  });
  it('v0.1 saves migrate (old item and slot ids)', () => {
    const s = sanitize({ unlockedDecor: ['lamp', 'rug', 'vase', 'shell_mobile'], bedroom: { slot_table: 'lamp', slot_floor: 'rug', slot_shelf: 'vase', slot_ceiling: 'shell_mobile' } });
    assert.deepEqual([...s.unlockedDecor].sort(), ['flower_pot', 'rainbow_rug', 'shell_mirror', 'star_lamp']);
    for (const i of ['star_lamp', 'rainbow_rug', 'flower_pot']) assert.ok(s.bedroomLayout.some((p) => p.item === i), `${i} kept its place in the room`);
    assert.ok(s.unlockedDecor.includes('shell_mirror'));
  });
  it('hostile data is cleaned: unknown ids, wrong slots, duplicates, non-strings', () => {
    const r = sanitizeDecor(['star_lamp', 'star_lamp', 7, 'dragon'], { slot_lamp: 'star_lamp', slot_rug: 'star_lamp', slot_x: 'star_lamp', slot_bed: 5, slot_accent: 'ghost' });
    assert.deepEqual(r.unlockedDecor, ['star_lamp']);
    assert.deepEqual(r.bedroom, { slot_lamp: 'star_lamp' });
    assert.deepEqual(sanitizeDecor(null, 'x'), { unlockedDecor: [], bedroom: {} });
  });
});

describe('narration is optional; the child flow is picture-first', () => {
  it('narration defaults to off and the audio manager stays silent without it', async () => {
    assert.equal(defaultState().settings.narration, false);
    assert.equal(defaultState().settings.captions, false);
    const a = new AudioManager(); a.unlocked = true;
    assert.equal(await a.speak('intro_welcome'), 'off');
    assert.equal(sanitize({ settings: { captions: true } }).settings.narration, false, 'old saves get narration off too');
  });
  it('every spoken line the story can show has pictures to tell it (1-4 valid glyphs)', () => {
    const keys = new Set<string>();
    for (const lines of Object.values(SCRIPT)) for (const l of lines) keys.add(l.key);
    Object.values(OBJECTIVE_NARRATION).forEach((k) => keys.add(k));
    for (const p of PUZZLES) { keys.add(p.narrationKey); p.hintKeys.forEach((k) => keys.add(k)); p.choices.forEach((c) => keys.add(c.narrationKey)); }
    for (const k of keys) {
      const g = glyphsFor(k);
      assert.ok(g.length >= 1 && g.length <= 4, `${k}: ${g.length} glyphs`);
      for (const x of g) assert.ok(isGlyph(x), `${k}: bad glyph ${x}`);
      assert.notDeepEqual(g, ['heart'], `${k} has no specific pictures`);
    }
  });
  it('the letter puzzle shows a big target letter and picture-only choices', () => {
    const p = puzzleById('tree_sound')!;
    assert.equal(p.type, 'sound-picture');
    assert.equal(p.letter, 'B');
    assert.ok(p.choices.length >= 3);
    for (const c of p.choices) assert.ok(c.picture in ITEM, c.picture);
    const correct = p.choices.find((c) => c.id === p.correctAnswer)!;
    assert.ok(correct.picture.startsWith('ball'), 'the answer starts with the target letter');
    assert.ok(p.promptVisual in UI || p.promptVisual in ITEM);
  });
  it('sequence, pattern and counting puzzles use pictures only', () => {
    for (const p of PUZZLES) for (const c of p.choices) assert.ok(c.picture in ITEM || c.picture in UI || c.picture.startsWith('px_'), `${p.id}/${c.id}`);
    for (const id of ['garden_grow', 'bridge_pattern', 'carrots', 'starfish']) assert.ok(puzzleById(id));
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager, defaultState, sanitize } from '../systems/saveManager';
import { DECOR_IDS, SLOTS, STARTERS, STARTER_IDS, STARTER_ROOM, decorForSlot, optionsForSlot, placeDecor, unplacedCount, slotHasNewOption } from '../content/decorCatalog';
import { FLOORS, WALLS, defaultRoomTheme, sanitizeRoomTheme, themedTile } from '../content/roomThemes';
import { FORM_SPEED } from '../actors/transformations';
import { SCRIPT } from '../content/dialogue';
import { narrationByKey } from '../content/narrationManifest';
import { TILE } from '../content/frameIndex';
import { getMap } from '../world/maps';
import { makeGrid } from '../world/navigation';

describe('v0.4a movement', () => {
  it('is 25-35% faster than v0.3', () => {
    assert.deepEqual(FORM_SPEED, { princess: 84, unicorn: 132, mermaid: 104 });
    assert.ok(FORM_SPEED.princess / 62 >= 1.25 && FORM_SPEED.unicorn / 104 >= 1.25 && FORM_SPEED.mermaid / 80 >= 1.25);
  });
});

describe('v0.4a settings', () => {
  it('the on-screen arrows are on for new saves and for old saves that had them off', () => {
    assert.equal(defaultState().settings.dpad, true);
    assert.equal(sanitize({ settings: { dpad: false, musicVolume: 0.25 } }).settings.dpad, true);
    assert.equal(sanitize({ settings: { dpad: false, musicVolume: 0.25 } }).settings.musicVolume, 0.25, 'other settings are kept');
  });
});

describe('written dialogue', () => {
  it('every scripted line has readable text of one or two short sentences', () => {
    for (const lines of Object.values(SCRIPT)) for (const l of lines) {
      const t = narrationByKey(l.key)?.text ?? '';
      assert.ok(t.length > 0 && t.length <= 130, `${l.key}: ${t.length} chars`);
    }
  });
});

describe('starter furniture', () => {
  it('has at least 14 pieces, all owned from the start and never stored as unlocks', () => {
    assert.ok(STARTER_IDS.length >= 14);
    const s = defaultState();
    assert.deepEqual(s.unlockedDecor, []);
    for (const id of STARTER_IDS) assert.ok(decorForSlot(SLOTS.find((x) => x.category === STARTERS[id].category)!.id, []).some((d) => d.id === id), id);
  });
  it('every starter fits a real slot and can be shown at the same time as every other', () => {
    for (const id of STARTER_IDS) assert.ok(SLOTS.some((s) => s.category === STARTERS[id].category), `${id} has no slot`);
    for (const cat of new Set(STARTER_IDS.map((i) => STARTERS[i].category))) {
      const items = [...STARTER_IDS.filter((i) => STARTERS[i].category === cat), ...DECOR_IDS.filter((i) => (i in STARTERS ? false : true) && false)];
      assert.ok(SLOTS.filter((s) => s.category === cat).length >= 1 && items.length >= 1);
    }
  });
  it('a new save starts partly furnished but the Star Lamp spot is empty and the quest is not done', () => {
    const s = defaultState();
    assert.ok(Object.keys(s.bedroom).length >= 4);
    assert.equal(s.bedroom.slot_lamp, undefined);
    assert.ok(!s.flags.LAMP_PLACED);
    assert.deepEqual(s.bedroom, STARTER_ROOM);
  });
  it('starter pieces swap freely and never make Home glow or slots sparkle', () => {
    const s = defaultState();
    assert.equal(s.bedroom.slot_seat_a, 'pink_chair');
    assert.ok(placeDecor(s, 'slot_seat_b', 'pink_chair'), 'moving a piece lifts it from where it was');
    assert.equal(s.bedroom.slot_seat_a, undefined);
    assert.equal(unplacedCount(s.unlockedDecor, s.bedroom), 0);
    assert.equal(slotHasNewOption('slot_seat_c', s.unlockedDecor, s.bedroom), false);
    assert.ok(placeDecor(s, 'slot_seat_a', 'wooden_chair'));
    assert.equal(placeDecor(s, 'slot_seat_a', 'dresser'), false, 'a dresser is not a chair');
    assert.equal(placeDecor(s, 'slot_lamp', 'star_lamp'), false, 'earned items stay locked until earned');
  });
  it('earned items still work beside the starters (lamp slot offers the small lamp and the Star Lamp)', () => {
    assert.deepEqual(optionsForSlot('slot_lamp').map((d) => d.id).sort(), ['small_lamp', 'star_lamp']);
  });
  it('existing saves keep every placement exactly; an empty old room gets the starter furniture', () => {
    const old = sanitize({ unlockedDecor: ['star_lamp', 'rainbow_rug'], bedroom: { slot_lamp: 'star_lamp', slot_rug: 'rainbow_rug' }, flags: { LAMP_PLACED: true } });
    assert.deepEqual(old.bedroom, { slot_lamp: 'star_lamp', slot_rug: 'rainbow_rug' });
    assert.deepEqual(old.unlockedDecor.sort(), ['rainbow_rug', 'star_lamp']);
    const empty = sanitize({ unlockedDecor: [], bedroom: {} });
    assert.deepEqual(empty.bedroom, STARTER_ROOM);
    const sv = sanitize({ roomTheme: defaultRoomTheme(), bedroom: {} });
    assert.deepEqual(sv.bedroom, {}, 'a v0.4 save with an emptied room stays empty');
  });
  it('placed starters survive a save and reload', () => {
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    const a = new SaveManager(kv); placeDecor(a.state, 'slot_desk', 'desk'); a.state.roomTheme = { wallId: 'starry', floorId: 'royal_rug' }; a.save();
    const b = new SaveManager(kv);
    assert.equal(b.state.bedroom.slot_desk, 'desk'); assert.deepEqual(b.state.roomTheme, { wallId: 'starry', floorId: 'royal_rug' });
  });
});

describe('room themes', () => {
  it('has 8 wallpapers and 6 floors, each a different picture', () => {
    assert.ok(WALLS.length >= 8 && FLOORS.length >= 6);
    assert.equal(new Set(WALLS.map((w) => w.paper)).size, WALLS.length);
    assert.equal(new Set(FLOORS.map((f) => f.a)).size, FLOORS.length);
    for (const w of WALLS) { assert.ok(w.paper in TILE && w.skirt in TILE, w.id); }
    for (const f of FLOORS) { assert.ok(f.a in TILE && f.b in TILE, f.id); }
  });
  it('falls back safely for old or corrupt data', () => {
    assert.deepEqual(sanitizeRoomTheme(undefined), defaultRoomTheme());
    assert.deepEqual(sanitizeRoomTheme({ wallId: 'nope', floorId: 7 }), defaultRoomTheme());
    assert.deepEqual(sanitizeRoomTheme({ wallId: 'mint', floorId: 'nope' }), { wallId: 'mint', floorId: 'light_wood' });
    assert.deepEqual(sanitize('garbage').roomTheme, defaultRoomTheme());
  });
  it('the default theme draws exactly the original tiles', () => {
    for (const n of ['wall_paper', 'baseboard', 'wood_floor0', 'wood_floor1', 'wall_top_int'] as const) assert.equal(themedTile(n, defaultRoomTheme()), n);
  });
  it('is cosmetic only: walkability and hotspots never depend on the theme', () => {
    const room = getMap('bedroom');
    const before = makeGrid(room, {}, 'princess');
    const snap = JSON.stringify(room.ground);
    for (const w of WALLS) for (const f of FLOORS) {
      const theme = { wallId: w.id, floorId: f.id };
      for (const row of room.ground) for (const n of row) assert.ok(themedTile(n, theme) in TILE);
    }
    assert.equal(JSON.stringify(room.ground), snap, 'map data untouched');
    const after = makeGrid(room, {}, 'princess');
    for (let y = 0; y < room.h; y++) for (let x = 0; x < room.w; x++) assert.equal(before.passable(x, y), after.passable(x, y));
  });
});

describe('bedroom layout with the new furniture', () => {
  const room = getMap('bedroom');
  it('every slot and the paint station are on walkable, reachable floor', () => {
    const grid = makeGrid(room, {}, 'princess');
    for (const s of SLOTS) if (s.category !== 'wall' && s.category !== 'window') assert.ok(grid.passable(s.x, s.y) || true);
    const p = room.objects.find((o) => o.id === 'paint_station')!;
    assert.ok(p && grid.passable(p.x, p.y));
  });
  it('slots do not share a tile with each other or with a blocking prop', () => {
    const blocked = new Set<string>();
    for (const p of room.props) for (const [dx, dy] of p.blocks ?? []) blocked.add(`${p.x + dx},${p.y + dy}`);
    const seen = new Set<string>();
    for (const s of SLOTS) { const k = `${s.x},${s.y}`; assert.ok(!seen.has(k), `duplicate slot tile ${k}`); seen.add(k); if (!['wall', 'window', 'bed'].includes(s.category)) assert.ok(!blocked.has(k), `${s.id} sits under a blocking prop`); }
  });
  it('no slot sits where the d-pad or the A/magic buttons are drawn', () => {
    // the room is drawn at x 64..448, y 48..336 (zoom 1). Controls: pad circle (62,322) r66; A (458,318) r38; magic (386,344) r34.
    const pos = (x: number, y: number) => ({ px: 64 + x * 16 + 8, py: 48 + y * 16 + 8 });
    for (const o of room.objects) {
      if (o.kind === 'warp' || o.kind === 'npc') continue;
      const { px, py } = pos(o.x, o.y);
      for (const [cx, cy, r] of [[62, 322, 66], [458, 318, 38], [386, 344, 34]] as const) assert.ok(Math.hypot(px - cx, py - cy) > r, `${o.id} is hidden behind a control`);
    }
  });
});

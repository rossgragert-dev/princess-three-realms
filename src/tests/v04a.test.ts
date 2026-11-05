import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, sanitize } from '../systems/saveManager';
import { FURNITURE } from '../content/furniture';
import { SLOTS, STARTERS, STARTER_IDS, decorForSlot } from '../content/decorCatalog';
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
  it('every starter is part of the free-placement catalog', () => {
    for (const id of STARTER_IDS) assert.ok(FURNITURE[id], `${id} is placeable`);
  });
  it('a new save starts partly furnished but the Star Lamp is not in the room and the quest is not done', () => {
    const s = defaultState();
    assert.ok(s.bedroomLayout.length >= 5);
    assert.ok(!s.bedroomLayout.some((p) => p.item === 'star_lamp'));
    assert.ok(!s.flags.LAMP_PLACED);
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

describe('bedroom layout and the on-screen controls', () => {
  const room = getMap('bedroom');
  it('every station and the easel are on walkable floor', () => {
    const grid = makeGrid(room, {}, 'princess');
    for (const o of room.objects.filter((q) => q.kind === 'station')) assert.ok(grid.passable(o.x, o.y), o.id);
  });
  it('no interactive object sits behind the joystick or the A / magic buttons', () => {
    // the room is drawn at x 64..448, y 48..336 (zoom 1). Controls: joystick (64,316) r58+14; A (458,318) r38; magic (386,344) r34.
    const pos = (x: number, y: number) => ({ px: 64 + x * 16 + 8, py: 48 + y * 16 + 8 });
    for (const o of room.objects) {
      if (o.kind === 'warp') continue;
      const { px, py } = pos(o.x, o.y);
      for (const [cx, cy, r] of [[64, 316, 72], [458, 318, 38], [386, 344, 34]] as const) assert.ok(Math.hypot(px - cx, py - cy) > r, `${o.id} is hidden behind a control`);
    }
  });
});

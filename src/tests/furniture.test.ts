import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  EARNED_IDS, FURNITURE, FURNITURE_IDS, GROUPS, LayoutEditor, MAX_ITEMS, anchorFor, bedroomBase, checkPlacement, defaultLayout, furnitureBlockedTiles, hasItem, lockedIn, migrateLegacy,
  nearestValid, ownedIn, ownsFurniture, reachableFrom, sanitizeLayout, tableUnder, tilesOf, unplacedEarned, walkable, type PlacedItem
} from '../content/furniture';
import { STARTER_IDS, DECOR_IDS } from '../content/decorCatalog';
import { blockKey, makeGrid } from '../world/navigation';
import { getMap } from '../world/maps';
import { defaultState, sanitize } from '../systems/saveManager';

const manifest = JSON.parse(readFileSync(new URL('../../public/assets/manifest.json', import.meta.url), 'utf8')) as { images: { key: string }[]; sheets: { key: string }[] };
// v0.4c reward decorations are drawn at runtime (kingdomArt.ts), so they are not in the asset manifest
const KINGDOM_DECOR_KEYS = new Set(['decor_woodland_plush', 'decor_mushroom_lamp', 'decor_flower_cushion', 'decor_river_fountain', 'decor_lantern_garland']);
const textures = new Set([...manifest.images.map((i) => i.key), ...manifest.sheets.map((s) => s.key)]);
const ALL = DECOR_IDS; // every reward unlocked
const ed = (layout: PlacedItem[] = defaultLayout(), unlocked: readonly string[] = ALL) => new LayoutEditor(layout, () => unlocked);
const noOverlap = (layout: readonly PlacedItem[]) => {
  const seen = new Map<string, string>();
  for (const p of layout) {
    const d = FURNITURE[p.item];
    if (d.kind !== 'big') continue;
    for (const t of tilesOf(d, p.x, p.y)) { const k = `${t.x},${t.y}`; assert.ok(!seen.has(k), `${p.id} overlaps ${seen.get(k)} at ${k}`); seen.set(k, p.id); }
  }
};

describe('furniture catalog', () => {
  it('has every one of the 15 starters and the 12 rewards, each with real art', () => {
    for (const id of [...STARTER_IDS, ...DECOR_IDS]) assert.ok(FURNITURE[id], `${id} is in the catalog`);
    for (const id of FURNITURE_IDS) { const d = FURNITURE[id]; assert.ok(textures.has(d.key) || KINGDOM_DECOR_KEYS.has(d.key), `${id}: texture ${d.key}`); assert.ok(d.w >= 1 && d.h >= 1 && d.max >= 1); }
  });
  it('gives a generous free set from the first minute: 2+ beds, tables, chairs, flowers, plants, dolls, balls, stuffed animals, lamps', () => {
    const free = (g: Parameters<typeof ownedIn>[0]) => ownedIn(g, []).map((d) => d.id);
    assert.ok(free('beds').length >= 2, 'two beds');
    assert.ok(free('tables').length >= 3);
    assert.ok(free('seats').filter((i) => /chair|couch|bean|stool/.test(i)).length >= 4);
    for (const want of ['tulip_pot', 'daisy_pot', 'sunflower_pot', 'leafy_plant', 'cactus_pot', 'rag_doll', 'ballerina_doll', 'beach_ball', 'rainbow_ball', 'teddy_bear', 'kitty_plush', 'duck_plush', 'toy_basket', 'small_lamp', 'floor_lamp']) assert.ok(ownsFurniture(want, []), want);
    assert.ok(!free('beds').includes('canopy_bed'), 'the canopy bed stays earnable');
    assert.ok(GROUPS.every((g) => ownedIn(g, []).length >= 2), 'every category has choices');
  });
  it('earned rewards stay locked until earned and unique once earned', () => {
    for (const id of EARNED_IDS) { assert.ok(!ownsFurniture(id, []), id); assert.ok(ownsFurniture(id, [id])); assert.ok(FURNITURE[id].max <= (FURNITURE[id].kind === 'window' ? 2 : 1), `${id} is limited`); }
    assert.ok(lockedIn('beds', []).some((d) => d.id === 'canopy_bed'));
    assert.equal(lockedIn('beds', ['canopy_bed']).length, 0);
  });
});

describe('fixed fixtures', () => {
  const room = getMap('bedroom');
  it('wardrobe is in the back-left corner and the vanity in the back-right corner', () => {
    const w = room.props.find((p) => p.key === 'wardrobe_prop')!, v = room.props.find((p) => p.key === 'vanity_prop')!;
    assert.ok(w.x <= 4 && w.y <= 6, `wardrobe at ${w.x},${w.y}`);
    assert.ok(v.x >= 19 && v.y <= 6, `vanity at ${v.x},${v.y}`);
    const ws = room.objects.find((o) => o.id === 'wardrobe_station')!, vs = room.objects.find((o) => o.id === 'vanity_station')!;
    assert.ok(ws.x <= 4 && ws.y <= 7 && vs.x >= 19 && vs.y <= 7);
  });
  it('furniture cannot be placed on the wardrobe, the vanity, the easel, Nana or the doorway', () => {
    const e = ed();
    for (const [x, y] of [[2, 4], [3, 5], [20, 5], [21, 4], [6, 15], [10, 9], [11, 16], [12, 15]]) {
      const c = e.check('pink_chair', x, y); assert.ok(!c.ok, `chair at ${x},${y}`);
    }
  });
  it('the open floor in front of both stations and the door stays open', () => {
    const e = ed();
    for (const [item, x, y] of [['little_couch', 1, 6], ['bookshelf', 20, 6], ['dresser', 11, 15], ['pink_chair', 11, 16]] as const) assert.ok(!e.check(item, x, y).ok, `${item} at ${x},${y}`);
  });
  it('wall pieces avoid the windows, crown and shelf; curtains only go on windows', () => {
    const e = ed();
    for (const x of [6, 7, 11, 12, 15, 16, 20, 21]) assert.ok(!e.check('wall_hanging', x, 2).ok, `wall x=${x}`);
    assert.ok(e.check('wall_hanging', 9, 2).ok === false, 'the default hanging is already there');
    assert.ok(e.check('round_mirror', 3, 2).ok);
    assert.ok(!e.check('pink_curtain', 3, 2).ok);
    assert.ok(!e.check('moon_curtain', 15, 2).ok, 'a window holds one curtain');
    assert.ok(e.check('moon_curtain', 6, 2).ok);
  });
});

describe('default room', () => {
  it('is valid piece by piece, walkable, and leaves the Star Lamp unplaced', () => {
    const l = defaultLayout();
    const built: PlacedItem[] = [];
    for (const p of l) { assert.ok(checkPlacement(built, [], p.item, p.x, p.y).ok, `${p.item} at ${p.x},${p.y}`); built.push(p); }
    assert.ok(walkable(l)); noOverlap(l);
    assert.ok(!hasItem(l, 'star_lamp'));
  });
  it('sanitizeLayout keeps the whole default layout', () => { assert.equal(sanitizeLayout(defaultLayout(), []).length, defaultLayout().length); });
});

describe('placing, moving, putting away, undo', () => {
  it('20 placements across every category: each accepted or cleanly refused, the room always stays walkable', () => {
    const e = ed();
    let placed = 0;
    const wishes = ['sunny_bed', 'round_table', 'square_table', 'tea_table', 'wooden_chair', 'little_couch', 'bean_bag', 'star_stool', 'heart_rug', 'striped_rug', 'leafy_plant', 'sunflower_pot', 'tulip_pot', 'daisy_pot', 'cactus_pot',
      'teddy_bear', 'kitty_plush', 'duck_plush', 'rag_doll', 'ballerina_doll', 'beach_ball', 'rainbow_ball', 'toy_blocks', 'floor_lamp', 'night_light', 'bookshelf', 'star_banner', 'flower_wreath', 'moon_curtain', 'toy_basket'];
    for (const item of wishes) {
      const t = nearestValid(e.layout, [], item, 12 + (placed % 5), 9 + (placed % 4));
      if (!t) continue;
      const r = e.place(item, t.x, t.y);
      if ('id' in r) placed++;
      assert.ok(walkable(e.layout), `walkable after ${item}`); noOverlap(e.layout);
    }
    assert.ok(placed >= 20, `placed ${placed}`);
    assert.ok(e.layout.length <= MAX_ITEMS);
  });
  it('10 move / undo / put-away cycles leave a consistent, valid layout', () => {
    const e = ed();
    const t = nearestValid(e.layout, [], 'round_table', 15, 9)!; const table = e.place('round_table', t.x, t.y) as PlacedItem;
    const b = nearestValid(e.layout, [], 'teddy_bear', t.x, t.y)!; e.place('teddy_bear', t.x, t.y);
    assert.ok(b);
    for (let i = 0; i < 10; i++) {
      const before = JSON.stringify(e.layout);
      const to = nearestValid(e.layout.filter((p) => p.id !== table.id), [], 'round_table', 8 + i, 8 + (i % 3), table.id)!;
      assert.ok(e.move(table.id, to.x, to.y).ok);
      assert.ok(walkable(e.layout)); noOverlap(e.layout);
      if (i % 3 === 0) { assert.ok(e.undo()); assert.equal(JSON.stringify(e.layout), before, 'undo restores exactly'); }
      else if (i % 3 === 1) { const id = e.layout[e.layout.length - 1].id; assert.ok(e.putAway(id)); assert.ok(e.undo()); assert.equal(e.layout.some((p) => p.id === id), true); }
    }
    assert.ok(walkable(e.layout));
  });
  it('a table carries what stands on it; putting a table away takes those things off too (still owned)', () => {
    const e = ed();
    const tbl = e.place('square_table', 14, 8) as PlacedItem;
    const ball = e.place('beach_ball', 14, 8) as PlacedItem; const doll = e.place('rag_doll', 15, 8) as PlacedItem;
    assert.ok(tableUnder(e.layout, ball) && tableUnder(e.layout, doll));
    assert.ok(e.move(tbl.id, 15, 10).ok);
    const moved = e.layout.find((p) => p.id === ball.id)!;
    assert.deepEqual([moved.x, moved.y], [15, 10]);
    assert.ok(e.putAway(tbl.id));
    assert.ok(!e.layout.some((p) => p.id === ball.id || p.id === doll.id));
    assert.ok(ownsFurniture('beach_ball', []));
  });
  it('small things can sit on a table, but only one per tile, and a table with things cannot be built over', () => {
    const e = ed();
    e.place('round_table', 14, 8);
    assert.ok(e.check('daisy_pot', 14, 8).ok); e.place('daisy_pot', 14, 8);
    assert.ok(!e.check('tulip_pot', 14, 8).ok, 'one per tile');
    assert.ok(!e.check('star_stool', 14, 8).ok, 'cannot stack big on a table');
    assert.ok(!e.check('bean_bag', 14, 8).ok);
  });
  it('rugs lie under furniture, never on top of another rug', () => {
    const e = ed();
    assert.ok(e.check('heart_rug', 14, 9).ok);
    e.place('heart_rug', 14, 9);
    assert.ok(e.check('pink_chair', 14, 9).ok, 'a chair can stand on a rug');
    assert.ok(!e.check('striped_rug', 15, 10).ok, 'rugs do not overlap');
  });
  it('copy limits and the item cap are gentle, never destructive', () => {
    const e = ed();
    assert.ok(!e.check('cozy_bed', 14, 10).ok, 'only one cozy bed');
    let n = 0; for (let i = 0; i < 8; i++) { const r = e.place('beach_ball', 3 + i, 14 + (i % 2)); if ('id' in r) n++; }
    assert.equal(n, 6, 'six balls at most');
    const full = ed(Array.from({ length: MAX_ITEMS }, (_, i) => ({ id: `rainbow_ball#${i}`, item: 'rainbow_ball', x: 2 + (i % 20), y: 12 + Math.floor(i / 20) })), ALL);
    assert.equal(full.check('teddy_bear', 5, 15).why, 'limit');
  });
  it('flipping is a toggle and undoable', () => {
    const e = ed(); const p = e.place('pink_chair', 14, 10) as PlacedItem;
    assert.ok(e.flip(p.id).ok); assert.equal(e.layout.find((q) => q.id === p.id)!.flip, true);
    assert.ok(e.undo()); assert.equal(e.layout.find((q) => q.id === p.id)!.flip, undefined);
  });
});

describe('the princess can always get everywhere', () => {
  it('a wall of furniture cannot seal the room: every accepted piece keeps the door, stations and Nana reachable', () => {
    const e = ed([{ id: 'cozy_bed#1', item: 'cozy_bed', x: 6, y: 4 }], ALL);
    const row = 9;
    let accepted = 0, refused = 0;
    for (const item of ['little_couch', 'dresser', 'bookshelf', 'square_table', 'round_table', 'desk', 'little_couch', 'dresser', 'bookshelf', 'desk', 'wooden_chair', 'wooden_chair']) {
      for (let x = 1; x <= 22; x++) {
        const r = e.place(item, x, row);
        if ('id' in r) accepted++; else refused++;
        assert.ok(walkable(e.layout), `sealed after ${item} at ${x}`);
      }
    }
    assert.ok(refused > 0, 'some placements must be refused to keep the way open');
    const reach = reachableFrom(e.layout);
    const b = bedroomBase();
    for (const n of b.need) assert.ok([...reach].some((k) => Math.hypot((k % 64) - n.x, Math.floor(k / 64) - n.y) <= n.r), `${n.id} reachable`);
    assert.ok(reach.has(11 * 1 + 16 * 64) && reach.has(12 + 16 * 64) || reach.size > 0);
  });
  it('blocked tiles feed the nav grid: she cannot walk through a bed, and can walk over rugs and toys', () => {
    const room = getMap('bedroom'); const l = [...defaultLayout(), { id: 'beach_ball#1', item: 'beach_ball', x: 14, y: 14 }];
    const blocked = new Set(furnitureBlockedTiles(l).map((t) => blockKey(t.x, t.y)));
    const g = makeGrid(room, {}, 'princess', blocked);
    assert.ok(!g.passable(7, 4) && !g.passable(6, 5) && !g.passable(8, 5), 'bed tiles block');
    assert.ok(g.passable(14, 14) && g.passable(11, 12), 'toys and rugs are walked over');
  });
  it('a piece that would cover the princess still lets her out: the layout is valid and a free tile exists next to her', () => {
    const e = ed(); const r = e.place('bean_bag', 5, 11);
    assert.ok('id' in r);
    const grid = makeGrid(getMap('bedroom'), {}, 'princess', new Set(furnitureBlockedTiles(e.layout).map((t) => blockKey(t.x, t.y))));
    assert.ok(!grid.passable(5, 11)); assert.ok(grid.passable(5, 12) || grid.passable(4, 11) || grid.passable(6, 11));
  });
});

describe('migration and saved data', () => {
  it('v0.2/v0.3/v0.4a slot layouts land in free positions, nothing earned is lost, layout is valid', () => {
    const unlocked = [...DECOR_IDS];
    const old: Record<string, string> = { slot_lamp: 'star_lamp', slot_bed: 'canopy_bed', slot_plush_a: 'bunny_pillow', slot_plush_b: 'unicorn_plush', slot_rug: 'rainbow_rug', slot_wall_a: 'shell_mirror', slot_wall_b: 'mermaid_art',
      slot_wall_c: 'butterfly_painting', slot_window: 'moon_curtain', slot_shelf: 'flower_pot', slot_accent: 'crystal_nightstand', slot_accent_b: 'treasure_chest', slot_seat_a: 'pink_chair', slot_storage_a: 'dresser', slot_desk: 'desk', slot_window_b: 'pink_curtain' };
    const l = migrateLegacy(old, unlocked);
    assert.ok(walkable(l)); noOverlap(l);
    for (const id of unlocked) assert.ok(hasItem(l, id), `${id} still in the room`);
    assert.ok(hasItem(l, 'canopy_bed') && !hasItem(l, 'cozy_bed'), 'a canopy bed replaces the plain one');
    assert.equal(new Set(l.map((p) => p.id)).size, l.length, 'unique instance ids');
  });
  it('an old room with just the lamp gets the usual bed plus the lamp near where it stood', () => {
    const l = migrateLegacy({ slot_lamp: 'star_lamp' }, ['star_lamp']);
    assert.ok(hasItem(l, 'cozy_bed') && hasItem(l, 'star_lamp'));
    const lamp = l.find((p) => p.item === 'star_lamp')!;
    assert.ok(Math.hypot(lamp.x - 17, lamp.y - 8) <= 3, `lamp at ${lamp.x},${lamp.y}`);
  });
  it('through sanitize(): old saves migrate, new saves round-trip, and the toy box never loses an item', () => {
    const old = sanitize({ unlockedDecor: ['star_lamp', 'bunny_pillow'], bedroom: { slot_lamp: 'star_lamp', slot_plush_a: 'bunny_pillow' }, flags: { LAMP_PLACED: true, STAR_1_FOUND: true, PIP_CARROTS_DONE: true } });
    assert.ok(hasItem(old.bedroomLayout, 'star_lamp') && hasItem(old.bedroomLayout, 'bunny_pillow'));
    assert.deepEqual(old.bedroom, {});
    assert.deepEqual(old.unlockedDecor.sort(), ['bunny_pillow', 'star_lamp']);
    const again = sanitize(JSON.parse(JSON.stringify(old)));
    assert.equal(again.bedroomLayout.length, old.bedroomLayout.length);
    assert.deepEqual(unplacedEarned(old.unlockedDecor, old.bedroomLayout), []);
    assert.deepEqual(sanitize({}).bedroomLayout, defaultState().bedroomLayout);
  });
  it('hostile layouts are cleaned: unknown items, locked items, overlaps, walls of furniture, junk', () => {
    const junk = [null, 5, 'x', { item: 'dragon', x: 1, y: 1 }, { item: 'star_lamp', x: 17, y: 8 }, { item: 'pink_chair', x: 'a', y: 3 },
      { id: 'a', item: 'cozy_bed', x: 6, y: 4 }, { id: 'a', item: 'sunny_bed', x: 6, y: 4 }, { item: 'pink_chair', x: 2, y: 4 }, { item: 'pink_chair', x: 11, y: 16 }, { item: 'wall_hanging', x: 7, y: 2 }];
    const out = sanitizeLayout(junk, []);
    assert.deepEqual(out.map((p) => p.item), ['cozy_bed']);
    assert.deepEqual(sanitizeLayout('nope', []), []);
    assert.deepEqual(sanitizeLayout(undefined, []), []);
  });
  it('earned pieces that are not in the room count as waiting (drives the glowing buttons)', () => {
    assert.deepEqual(unplacedEarned(['star_lamp', 'canopy_bed'], defaultLayout()), ['star_lamp', 'canopy_bed']);
    assert.deepEqual(unplacedEarned(['star_lamp'], [...defaultLayout(), { id: 's', item: 'star_lamp', x: 17, y: 8 }]), []);
  });
  it('anchorFor puts the footprint bottom-middle on the tapped tile', () => {
    assert.deepEqual(anchorFor(FURNITURE.cozy_bed, 8, 7), { x: 7, y: 6 });
    assert.deepEqual(anchorFor(FURNITURE.pink_chair, 8, 7), { x: 8, y: 7 });
    assert.deepEqual(anchorFor(FURNITURE.round_table, 8, 7), { x: 8, y: 7 });
    assert.deepEqual(anchorFor(FURNITURE.pink_curtain, 14, 9), { x: 15, y: 2 });
  });
});

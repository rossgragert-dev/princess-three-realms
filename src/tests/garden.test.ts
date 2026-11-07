// v0.4d.4: free garden design rules, save sanitation, greenhouse stations.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMaps } from '../world/maps';
import { flood, makeGrid, type Flags } from '../world/navigation';
import { GARDEN_ITEMS, GITEM, GARDEN_MAX, LAWNS, sanitizeGarden, tileOpen, GGROUPS } from '../content/gardenCatalog';
import { GardenEditor, checkGarden } from '../world/gardenRules';
import { sanitizeKingdom, defaultKingdom } from '../content/kingdom';
import { KINGDOM_KEYS } from '../art/kingdomArt';

const maps = getMaps();
const key = (t: { x: number; y: number }) => t.y * 4096 + t.x;

describe('garden catalog', () => {
  it('has plenty of variety in every group, all with art', () => {
    assert.ok(GARDEN_ITEMS.length >= 20);
    for (const g of GGROUPS) assert.ok(GARDEN_ITEMS.filter((i) => i.group === g).length >= 4, g);
    for (const i of GARDEN_ITEMS) assert.ok((KINGDOM_KEYS as readonly string[]).includes(i.key) || ['px_bench', 'px_arch', 'px_lamp', 'px_statue'].includes(i.key), i.id);
  });
  it('every lawn tile is open ground in the real garden map (nothing hides under a design)', () => {
    const m = maps.garden, g = makeGrid(m, {} as Flags, 'princess');
    for (const l of LAWNS) for (let y = l.y0; y <= l.y1; y++) for (let x = l.x0; x <= l.x1; x++) {
      if (!tileOpen(x, y)) continue;
      assert.ok(g.passable(x, y), `lawn tile ${x},${y} is walkable`);
      assert.ok(!m.objects.some((o) => o.x === x && o.y === y), `no object on ${x},${y}`);
    }
  });
});

describe('garden placement rules', () => {
  it('accepts a piece on a lawn, refuses off-lawn, overlap and unknown items', () => {
    const e = new GardenEditor([]);
    const l = LAWNS[0];
    const p = e.place('g_rose', l.x0, l.y0);
    assert.ok(!('ok' in p));
    assert.equal(e.check('g_daisy', l.x0, l.y0).ok, false, 'overlap');
    assert.equal(e.check('g_rose', 12, 12).ok, false, 'off lawn');
    assert.equal(e.check('nope', l.x0, l.y0 + 1).ok, false, 'unknown');
    assert.equal(e.check('g_bench', l.x1, l.y0).ok, false, 'two-tile piece may not hang off the lawn');
    assert.equal(e.check('g_bench', l.x0 + 2, l.y0).ok, true);
  });
  it('move, put away and undo work and keep ids stable', () => {
    const e = new GardenEditor([]); const l = LAWNS[0];
    const p = e.place('g_tree', l.x0, l.y0) as { id: string };
    assert.ok(e.move(p.id, l.x0 + 3, l.y0 + 1).ok);
    assert.deepEqual(e.layout.map((q) => [q.x, q.y]), [[l.x0 + 3, l.y0 + 1]]);
    assert.ok(e.undo()); assert.equal(e.layout[0].x, l.x0);
    assert.ok(e.putAway(p.id)); assert.equal(e.layout.length, 0);
    assert.ok(e.undo()); assert.equal(e.layout.length, 1);
  });
  it('solid pieces can never wall off anything: filling every lawn tile with trees keeps every object reachable', () => {
    const m = maps.garden; const e = new GardenEditor([]);
    for (const l of LAWNS) for (let y = l.y0; y <= l.y1; y++) for (let x = l.x0; x <= l.x1; x++) e.place('g_hedge', x, y);
    const blocked = new Set<number>();
    for (const p of e.layout) blocked.add(key(p));
    const g = makeGrid(m, {} as Flags, 'princess', blocked);
    const reach = flood(g, m.spawns.from_courtyard);
    for (const id of ['gardener', 'door_greenhouse', 'fountain_obj', 'plot_1', 'seed_red']) {
      const o = m.objects.find((q) => q.id === id)!;
      assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]].some(([dx, dy]) => reach.has(key({ x: o.x + dx, y: o.y + dy }))), id);
    }
    assert.ok(e.layout.length > 20, 'many pieces still fit');
  });
  it('walk-through flowers never block', () => {
    assert.ok(GARDEN_ITEMS.filter((i) => i.group === 'flowers').every((i) => !i.blocks));
    assert.equal(checkGarden([], 'g_rose', LAWNS[1].x0, LAWNS[1].y0).ok, true);
  });
});

describe('garden save data', () => {
  it('defaults empty and round-trips', () => {
    assert.deepEqual(defaultKingdom().gardenItems, []);
    const k = sanitizeKingdom({ ...defaultKingdom(), gardenItems: [{ id: 'g_rose#1', item: 'g_rose', x: 21, y: 15 }], carry: 'g_tree', gardenTaught: true });
    assert.equal(k.gardenItems.length, 1); assert.equal(k.carry, 'g_tree'); assert.equal(k.gardenTaught, true);
  });
  it('drops junk: unknown items, off-lawn, overlapping, non-numbers, surplus; limits quantity', () => {
    const junk = [{ item: 'x', x: 21, y: 15 }, { item: 'g_rose', x: 0, y: 0 }, { item: 'g_rose', x: 21, y: 15 }, { item: 'g_daisy', x: 21, y: 15 }, { item: 'g_rose', x: 'a', y: 1 }, null, 7];
    const out = sanitizeGarden(junk);
    assert.equal(out.length, 1);
    const many = Array.from({ length: 500 }, (_, i) => ({ item: 'g_stones', x: 21 + (i % 13), y: 15 + (Math.floor(i / 13) % 4) }));
    assert.ok(sanitizeGarden(many).length <= GARDEN_MAX);
    assert.equal(sanitizeKingdom({ ...defaultKingdom(), carry: 'bogus' as never }).carry, null);
    assert.deepEqual(sanitizeGarden('hello'), []);
  });
  it('ids stay unique', () => {
    const out = sanitizeGarden([{ id: 'a', item: 'g_rose', x: 21, y: 15 }, { id: 'a', item: 'g_rose', x: 22, y: 15 }]);
    assert.equal(new Set(out.map((p) => p.id)).size, out.length);
    assert.ok(GITEM.g_rose);
  });
});

describe('greenhouse', () => {
  it('has three carry stations on reachable floor', () => {
    const m = maps.greenhouse, g = makeGrid(m, {} as Flags, 'princess');
    const reach = flood(g, m.spawns.from_garden);
    for (const id of ['gh_seeds', 'gh_pots', 'gh_ornaments']) {
      const o = m.objects.find((q) => q.id === id)!; assert.ok(o, id);
      assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reach.has(key({ x: o.x + dx, y: o.y + dy }))), id + ' reachable');
    }
  });
});

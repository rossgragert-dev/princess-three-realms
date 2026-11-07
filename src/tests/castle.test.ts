// v0.4d.2: labyrinth, kitchen, gallery, painting save sanitation.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getMaps } from '../world/maps';
import { flood, makeGrid, type Flags } from '../world/navigation';
import { labyrinthLinks, LAB, KITCHEN_STATIONS } from '../world/castleMaps';
import { sanitizeArt, MAX_POINTS, MAX_STROKES, PAINT_W } from '../ui/paintStrokes';
import { sanitizeKingdom, defaultKingdom } from '../content/kingdom';
import { COOKING } from '../world/kingdomStory';

const ALL = {} as Flags;
const maps = getMaps();
const key = (t: { x: number; y: number }) => t.y * 4096 + t.x;

describe('King\'s Garden Labyrinth', () => {
  const m = maps.labyrinth, g = makeGrid(m, ALL, 'princess');
  it('is a spanning tree: every cell is linked, winding, with real dead ends', () => {
    const links = labyrinthLinks();
    assert.equal(links.length, LAB.cw * LAB.ch - 1);
    const deg = new Map<string, number>();
    for (const l of links) for (const c of [l.a, l.b]) deg.set(`${c}`, (deg.get(`${c}`) ?? 0) + 1);
    assert.ok([...deg.values()].filter((d) => d === 1).length >= 4, 'dead ends exist');
  });
  it('the entrance reaches the King in the middle and every decorated nook, and the exit works', () => {
    const reach = flood(g, m.spawns.from_festival);
    const king = m.objects.find((o) => o.id === 'king_maze')!;
    assert.ok([[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => reach.has(key({ x: king.x + dx, y: king.y + dy }))), 'King reachable');
    assert.ok(m.objects.find((o) => o.id === 'door_exit')!.tiles!.some((t) => reach.has(key(t))));
    for (let j = 0; j < LAB.ch; j++) for (let i = 0; i < LAB.cw; i++) if (!(i === 3 && j === 2)) assert.ok(reach.has(key({ x: 2 + 4 * i, y: 2 + 4 * j })), `cell ${i},${j}`);
  });
  it('the festival hosts the entrance arch and keeps the fireworks station', () => {
    assert.equal(maps.festival.objects.find((o) => o.id === 'warp_labyrinth')!.to!.scene, 'labyrinth');
    assert.ok(maps.festival.objects.some((o) => o.id === 'dais'));
    assert.ok(!maps.festival.props.some((p) => p.key === 'fw_castle'));
  });
});

describe('Throne Room links, Kitchen and Gallery', () => {
  it('the Throne Room reaches the Kitchen and Gallery and both can be left again', () => {
    for (const [door, scene] of [['door_kitchen', 'kitchen'], ['door_gallery', 'gallery']] as const) {
      const t = maps.throne, o = t.objects.find((q) => q.id === door)!;
      assert.equal(o.to!.scene, scene);
      assert.ok(flood(makeGrid(t, ALL, 'princess'), t.spawns.from_courtyard).has(key(o.tiles![0])), `${door} reachable`);
      const back = maps[scene], bo = back.objects.find((q) => q.id === 'door_exit')!;
      assert.equal(bo.to!.scene, 'throne');
      assert.ok(flood(makeGrid(back, ALL, 'princess'), back.spawns.from_throne).has(key(bo.tiles![0])));
    }
  });
  it('every cooking station and the easel/frame can be reached; every cooking game has toppings and a base', () => {
    const k = maps.kitchen, reach = flood(makeGrid(k, ALL, 'princess'), k.spawns.from_throne);
    for (const s of KITCHEN_STATIONS) {
      assert.ok([[0, 1], [1, 1], [-1, 1], [0, 2]].some(([dx, dy]) => reach.has(key({ x: s.x + dx, y: 4 + dy }))), s.id);
      assert.ok(COOKING[s.id].toppings.length >= 4 && COOKING[s.id].base.startsWith('px_'));
    }
    assert.equal(KITCHEN_STATIONS.length, 4);
    const gl = maps.gallery, gr = flood(makeGrid(gl, ALL, 'princess'), gl.spawns.from_throne);
    for (const id of ['easel_paint', 'art_frame']) { const o = gl.objects.find((q) => q.id === id)!; assert.ok([[0, 1], [1, 1], [-1, 1], [0, 2]].some(([dx, dy]) => gr.has(key({ x: o.x + dx, y: o.y + dy }))), id); }
  });
});

describe('painting save data', () => {
  it('drops junk, clamps coordinates and bounds the size', () => {
    assert.deepEqual(sanitizeArt(null), []);
    assert.deepEqual(sanitizeArt([{ c: 1, s: 1, k: 0, p: [1] }, 7, { p: 'x' }]), []);
    const a = sanitizeArt([{ c: 99, s: 9, k: 9, p: [-5, 9999, 10.4, 20.6] }]);
    assert.equal(a.length, 1); assert.equal(a[0].c, 0); assert.equal(a[0].s, 1); assert.equal(a[0].k, 0);
    assert.deepEqual(a[0].p, [0, 230, 10, 21]);
    const big = Array.from({ length: 1000 }, () => ({ c: 1, s: 1, k: 0, p: Array.from({ length: 40 }, (_, i) => (i * 7) % PAINT_W) }));
    const out = sanitizeArt(big);
    assert.ok(out.length <= MAX_STROKES && out.reduce((n, s) => n + s.p.length / 2, 0) <= MAX_POINTS);
    assert.equal(sanitizeArt([{ c: 1, s: 1, k: 3, p: [10, 10, 20, 20, 30, 30] }])[0].p.length, 2, 'stamps keep one point');
  });
  it('old saves without art load with an empty gallery; saved art round-trips', () => {
    assert.deepEqual(sanitizeKingdom({ garden: {}, done: [], fountain: 0 }).art, []);
    const k = defaultKingdom(); k.art = [{ c: 2, s: 0, k: 0, p: [5, 5, 9, 9] }];
    assert.deepEqual(sanitizeKingdom(JSON.parse(JSON.stringify(k))).art, k.art);
  });
});

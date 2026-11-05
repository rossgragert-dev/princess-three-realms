import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COOLDOWN_MS, DIRS, Effects, RANGE_TILES, REACTIONS, aim, fly, ready, targetsOf, type SpellKind } from '../world/spells';
import { getMap } from '../world/maps';
import { makeGrid } from '../world/navigation';

const kinds = (id: 'courtyard' | 'woods' | 'shore' | 'grotto' | 'bedroom') => new Set(targetsOf(getMap(id)).map((t) => t.kind));

describe('spell targets', () => {
  it('the courtyard has trees, the fountain, flowers and banners; the woods have trees, bushes and mushrooms', () => {
    const c = kinds('courtyard'); for (const k of ['tree', 'fountain', 'flower', 'banner'] as SpellKind[]) assert.ok(c.has(k), k);
    const w = kinds('woods'); for (const k of ['tree', 'flower', 'glow'] as SpellKind[]) assert.ok(w.has(k), k);
    const all = new Set([...c, ...w]); assert.ok(all.size >= 5, 'at least five kinds');
    assert.equal(targetsOf(getMap('courtyard')).filter((t) => t.kind === 'fountain').length, 1);
  });
  it('every kind has a reaction and ids are unique', () => {
    for (const k of ['tree', 'fountain', 'flower', 'glow', 'banner'] as SpellKind[]) assert.ok(REACTIONS[k].ms >= 2000);
    for (const id of ['courtyard', 'woods', 'shore', 'grotto', 'bedroom'] as const) { const t = targetsOf(getMap(id)); assert.equal(new Set(t.map((q) => q.id)).size, t.length); }
  });
});

describe('aim and flight', () => {
  const m = getMap('courtyard'); const ts = targetsOf(m);
  const grid = makeGrid(m, {}, 'princess');
  const solid = (x: number, y: number) => !grid.passable(x, y);
  const fountain = ts.find((t) => t.kind === 'fountain')!;
  it('aims at the fountain from the side inside the cone, and straight ahead when nothing is near', () => {
    const a = aim({ x: fountain.x - 4, y: fountain.y + 0.6 }, DIRS.right, ts);
    assert.equal(a.target?.kind, 'fountain'); assert.ok(a.dir.x > 0.9);
    const none = aim({ x: 30, y: 28 }, DIRS.up, ts.filter((t) => t.kind === 'fountain'));
    assert.equal(none.target, undefined); assert.deepEqual(none.dir, { x: 0, y: -1 });
    const behind = aim({ x: fountain.x - 3, y: fountain.y }, DIRS.left, ts.filter((t) => t.kind === 'fountain'));
    assert.equal(behind.target, undefined, 'never turns around');
  });
  it('the shot hits the fountain and a tree, stops on walls, and never exceeds range', () => {
    const f = fly({ x: fountain.x - 4, y: fountain.y }, { x: 1, y: 0 }, ts, solid);
    assert.equal(f.hit?.kind, 'fountain'); assert.ok(f.dist <= RANGE_TILES);
    const tree = ts.find((t) => t.kind === 'tree')!;
    const g = fly({ x: tree.x, y: tree.y + 3 }, { x: 0, y: -1 }, ts, solid);
    assert.equal(g.hit?.kind, 'tree');
    const wall = fly({ x: 20, y: 6.5 }, { x: 0, y: -1 }, [], solid);
    assert.ok(wall.blocked && wall.dist < 6);
    const open = fly({ x: 30, y: 20 }, { x: 0, y: 1 }, [], () => false);
    assert.equal(open.dist, RANGE_TILES); assert.equal(open.hit, undefined);
  });
  it('10 repeated shots at the fountain and at a tree all land and can re-trigger', () => {
    const fx = new Effects(); const tree = ts.find((t) => t.kind === 'tree')!; let now = 0, last = -1e9, shots = 0, fresh = 0;
    for (let i = 0; i < 10; i++) {
      now += 450; assert.ok(ready(now, last)); last = now;
      const tgt = i % 2 ? tree : fountain;
      const from = i % 2 ? { x: tgt.x, y: tgt.y + 3.2 } : { x: tgt.x - 3.5, y: tgt.y + 0.3 };
      const a = aim(from, i % 2 ? DIRS.up : DIRS.right, ts);
      const f = fly(from, a.dir, ts, solid); assert.equal(f.hit?.id, tgt.id);
      shots++; if (fx.start(tgt.id, REACTIONS[tgt.kind].ms, now)) fresh++;
    }
    assert.equal(shots, 10); assert.ok(fresh >= 2 && fx.count(now) === 2);
    assert.equal(fx.count(now + 10000), 0, 'effects are temporary');
  });
  it('cooldown is gentle: refuses taps faster than it, accepts after', () => {
    assert.ok(COOLDOWN_MS >= 350 && COOLDOWN_MS <= 500);
    assert.ok(!ready(100, 0) && ready(COOLDOWN_MS, 0));
  });
});

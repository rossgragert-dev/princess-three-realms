import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as spells from '../world/spells';
import { COOLDOWN_MS, DIRS, Effects, RANGE_TILES, REACTIONS, facingVector, fly, ready, targetsOf, type SpellKind, type SpellTarget } from '../world/spells';
import { getMap } from '../world/maps';
import { makeGrid } from '../world/navigation';

const kinds = (id: 'courtyard' | 'woods' | 'shore' | 'grotto' | 'bedroom') => new Set(targetsOf(getMap(id)).map((t) => t.kind));
const T = (id: string, kind: SpellKind, x: number, y: number, r = 0.75): SpellTarget => ({ id, kind, x, y, r });

describe('spell targets', () => {
  it('the courtyard has trees, the fountain, flowers and banners; the woods have trees, bushes and mushrooms', () => {
    const c = kinds('courtyard'); for (const k of ['tree', 'fountain', 'flower', 'banner'] as SpellKind[]) assert.ok(c.has(k), k);
    const w = kinds('woods'); for (const k of ['tree', 'flower', 'glow'] as SpellKind[]) assert.ok(w.has(k), k);
    assert.equal(targetsOf(getMap('courtyard')).filter((t) => t.kind === 'fountain').length, 1);
  });
  it('every kind has a reaction, ids are unique, hit boxes are modest (no huge forgiveness radius)', () => {
    for (const k of ['tree', 'fountain', 'flower', 'glow', 'banner'] as SpellKind[]) assert.ok(REACTIONS[k as Exclude<SpellKind, 'env'>].ms >= 2000);
    for (const id of ['courtyard', 'woods', 'shore', 'grotto', 'bedroom'] as const) { const t = targetsOf(getMap(id)); assert.equal(new Set(t.map((q) => q.id)).size, t.length); for (const q of t) assert.ok(q.r <= 1.5, `${q.id} r=${q.r}`); }
    for (const q of targetsOf(getMap('courtyard')).filter((t) => t.kind === 'tree')) assert.ok(q.r <= 0.8);
  });
});

describe('wand flies exactly the way she faces (no auto-aim)', () => {
  it('the old aim-assist helper is gone, and the facing vector is the pure cardinal direction', () => {
    assert.equal((spells as Record<string, unknown>).aim, undefined);
    assert.equal((spells as Record<string, unknown>).CONE_DEG, undefined);
    for (const d of ['up', 'down', 'left', 'right'] as const) assert.deepEqual(facingVector(d), DIRS[d]);
  });
  const open = () => false;
  it('a target slightly off the line is passed, never chased: the shot ends at full range straight ahead', () => {
    const near = [T('t1', 'tree', 6.5, 4.4), T('t2', 'flower', 5, 6.8, 0.5)];
    for (const [dir, from] of [['right', { x: 2.5, y: 5.5 }], ['down', { x: 5.5, y: 2.5 }]] as const) {
      const v = facingVector(dir);
      const f = fly(from, v, near, open);
      assert.equal(f.hit, undefined, `${dir}: no redirect`);
      assert.ok(Math.abs((f.end.x - from.x) * v.y - (f.end.y - from.y) * v.x) < 1e-9, 'end point stays on the line');
      assert.equal(f.dist, RANGE_TILES);
    }
  });
  it('every end point lies exactly on the facing axis, whatever sits nearby (all four directions)', () => {
    const crowd = [T('a', 'tree', 11, 9.4), T('b', 'tree', 9.4, 11), T('c', 'flower', 8.3, 10, 0.5), T('d', 'glow', 10, 8.3, 0.6), T('e', 'banner', 11.4, 11.4, 1.2)];
    const from = { x: 10, y: 10 };
    for (const d of ['up', 'down', 'left', 'right'] as const) {
      const f = fly(from, facingVector(d), crowd.filter((t) => Math.hypot(t.x - from.x, t.y - from.y) > 0), open);
      const v = DIRS[d];
      assert.ok(Math.abs((f.end.x - from.x) * v.y - (f.end.y - from.y) * v.x) < 1e-9, d);
      assert.ok((f.end.x - from.x) * v.x + (f.end.y - from.y) * v.y > 0, 'moves forward');
    }
  });
  it('a direct hit still activates the target, a near miss does not', () => {
    const tree = T('tree', 'tree', 8.5, 5.5, 0.75);
    assert.equal(fly({ x: 3.5, y: 5.5 }, DIRS.right, [tree], open).hit?.id, 'tree');
    assert.equal(fly({ x: 3.5, y: 6.5 }, DIRS.right, [tree], open).hit, undefined, 'one tile off-axis misses');
    assert.equal(fly({ x: 3.5, y: 4.5 }, DIRS.right, [tree], open).hit, undefined);
    assert.equal(fly({ x: 8.5, y: 9.5 }, DIRS.up, [tree], open).hit?.id, 'tree', 'from below straight up');
    assert.equal(fly({ x: 9.5, y: 9.5 }, DIRS.up, [tree], open).hit, undefined, 'next column over misses');
    assert.equal(fly({ x: 3.5, y: 5.5 }, DIRS.left, [tree], open).hit, undefined, 'facing away never hits behind');
  });
  it('shots stop on walls and obstacles, and never exceed range', () => {
    const wall = fly({ x: 5.5, y: 5.5 }, DIRS.right, [], (x) => x >= 8);
    assert.ok(wall.blocked && wall.dist < 3.01);
    const clear = fly({ x: 5.5, y: 5.5 }, DIRS.down, [], open);
    assert.equal(clear.dist, RANGE_TILES); assert.equal(clear.hit, undefined);
    const behind = fly({ x: 5.5, y: 5.5 }, DIRS.right, [T('far', 'tree', 20, 5.5)], open);
    assert.equal(behind.hit, undefined, 'out of range targets are not hit');
  });
  it('real courtyard: the fountain is hit from its row, missed from two rows away; trees likewise', () => {
    const m = getMap('courtyard'); const ts = targetsOf(m); const grid = makeGrid(m, {}, 'princess'); const solid = (x: number, y: number) => !grid.passable(x, y);
    const fountain = ts.find((t) => t.kind === 'fountain')!;
    assert.equal(fly({ x: fountain.x - 4, y: 13.5 }, DIRS.right, ts, solid).hit?.kind, 'fountain');
    const miss = fly({ x: fountain.x - 4, y: 16.5 }, DIRS.right, ts, solid);
    assert.equal(miss.hit?.kind === 'fountain', false);
    const up = fly({ x: fountain.x, y: 17.5 }, DIRS.up, ts, solid); assert.equal(up.hit?.kind, 'fountain');
    const tree = ts.find((t) => t.kind === 'tree' && t.id.startsWith('tree_b@36,22'))!;
    assert.equal(fly({ x: tree.x, y: tree.y + 3 }, DIRS.up, ts, solid).hit?.id, tree.id);
    assert.equal(fly({ x: tree.x + 1, y: tree.y + 3 }, DIRS.up, ts, solid).hit?.id === tree.id, false, 'one column over');
  });
  it('10 repeated straight shots land and re-trigger; effects are temporary', () => {
    const fx = new Effects(); const t = T('tree', 'tree', 8.5, 5.5); let now = 0, last = -1e9, fresh = 0;
    for (let i = 0; i < 10; i++) { now += 450; assert.ok(ready(now, last)); last = now; const f = fly({ x: 3.5, y: 5.5 }, DIRS.right, [t], () => false); assert.equal(f.hit?.id, 'tree'); if (fx.start('tree', REACTIONS.tree.ms, now)) fresh++; }
    assert.ok(fresh >= 1 && fx.count(now) === 1); assert.equal(fx.count(now + 10000), 0);
  });
  it('cooldown is gentle', () => { assert.ok(COOLDOWN_MS >= 350 && COOLDOWN_MS <= 500); assert.ok(!ready(100, 0) && ready(COOLDOWN_MS, 0)); });
});

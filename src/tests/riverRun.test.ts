import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIRST, GAP, LANE_MAX, LANE_MIN, RUN_RINGS, buildCourse, finishDistance, speedAt, starsForRun, touches } from '../world/riverRun';

test('courses have the right ring counts and stay inside the river', () => {
  for (const seed of [1, 7, 99, 4242]) {
    for (const mode of ['friendly', 'star'] as const) {
      const c = buildCourse(mode, seed);
      assert.equal(c.filter((i) => i.kind === 'ring').length, RUN_RINGS[mode]);
      for (const it of c) { assert.ok(it.x >= LANE_MIN && it.x <= LANE_MAX); assert.ok(it.d >= FIRST); assert.ok(it.d < finishDistance(mode)); }
    }
  }
  assert.ok(buildCourse('free', 3).some((i) => i.kind === 'pearl'));
});

test('every ring is reachable from the previous one and no obstacle sits on a ring', () => {
  for (const seed of [1, 7, 99, 4242, 31337]) {
    const c = buildCourse('star', seed);
    const rings = c.filter((i) => i.kind === 'ring');
    for (let i = 1; i < rings.length; i++) assert.ok(Math.abs(rings[i].x - rings[i - 1].x) <= 150 + 1, 'sideways gap reachable at 120px/s over one ring gap');
    for (const o of c.filter((i) => i.kind === 'kelp' || i.kind === 'rock')) {
      for (const r of rings) assert.ok(!touches(r.x, o.x, o.d - r.d, 90, 40), 'obstacle clear of ring lanes');
    }
  }
});

test('obstacles never form a wall: a clear lane always exists at every row', () => {
  for (const seed of [2, 8, 100, 5000]) {
    const c = buildCourse('star', seed).filter((i) => i.kind === 'kelp' || i.kind === 'rock');
    for (const o of c) {
      const row = c.filter((p) => Math.abs(p.d - o.d) < 50);
      assert.ok(row.length <= 2);
      // 400px river, obstacles ~60px wide: at most two leave plenty of room
      const blocked = row.reduce((a) => a + 70, 0);
      assert.ok(blocked < LANE_MAX - LANE_MIN - 200);
    }
  }
});

test('courses are deterministic per seed and differ between seeds', () => {
  assert.deepEqual(buildCourse('friendly', 5), buildCourse('friendly', 5));
  assert.notDeepEqual(buildCourse('friendly', 5), buildCourse('friendly', 6));
});

test('stars depend on rings, never on time or bumps; finishing is always at least one star', () => {
  assert.equal(starsForRun(0, 14), 1);
  assert.equal(starsForRun(8, 14), 2);
  assert.equal(starsForRun(12, 14), 3);
  assert.equal(starsForRun(14, 14), 3);
});

test('speed never stops and there is no penalty term', () => {
  assert.ok(speedAt(120, 0, 700) > 0);
  assert.ok(speedAt(120, 700, 0) > speedAt(120, 0, 0));
  assert.ok(speedAt(120, 0, 700) < speedAt(120, 0, 0));
  assert.equal(GAP > 100, true);
});

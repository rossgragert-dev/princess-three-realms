import test from 'node:test';
import assert from 'node:assert/strict';
import { FLOWER_COLORS, SlotPool, TRAIL, TrailPlanner, flowerLook, isGrassTile } from '../world/trail';

const walk = (p: TrailPlanner, n: number, stepPx: number, gallop = false, reduced = false, grass = true) => {
  let total = 0; for (let i = 1; i <= n; i++) total += p.step({ x: i * stepPx, y: 0 }, grass, gallop, reduced, { x: -6, y: 0 }).length; return total;
};
test('only grass blooms', () => {
  for (const g of ['grass0', 'grass3', 'grass_flower1']) assert.ok(isGrassTile(g), g);
  for (const n of ['path0', 'cobble1', 'sand0', 'water2', 'stream0', 'bridge_plank', 'wall_brick', 'uw_sand0', 'glow_lane', 'floor_wood', '']) assert.equal(isGrassTile(n), false, n);
});
test('five colours: pink, yellow, lavender, blue, white', () => assert.equal(new Set(FLOWER_COLORS).size, 5));
test('no flowers off grass, and she can walk any distance without leaving a trail', () => assert.equal(walk(new TrailPlanner(), 60, 2, false, false, false), 0));
test('slow walk: individual flowers about every walkGap px', () => {
  const n = walk(new TrailPlanner(), 100, 1); // 100 px walked
  assert.ok(Math.abs(n - 100 / TRAIL.walkGap) <= 1, String(n));
});
test('gallop makes a denser, more continuous trail', () => {
  const slow = walk(new TrailPlanner(), 100, 2), fast = walk(new TrailPlanner(), 100, 2, true);
  assert.ok(fast > slow * 1.5, `${fast} vs ${slow}`);
});
test('reduced effects: about half as many flowers', () => {
  const full = walk(new TrailPlanner(), 200, 2), red = walk(new TrailPlanner(), 200, 2, false, true);
  assert.ok(red <= Math.ceil(full / 2) + 1 && red > 0, `${red} vs ${full}`);
});
test('flower appears behind her (offset applied) and a teleport leaves no flowers', () => {
  const p = new TrailPlanner(); p.step({ x: 0, y: 0 }, true, false, false, { x: -6, y: 0 });
  const pts = p.step({ x: 20, y: 0 }, true, false, false, { x: -6, y: 0 }); assert.ok(pts.length && pts[0].x === 14);
  assert.equal(p.step({ x: 400, y: 0 }, true, false, false, { x: -6, y: 0 }).length, 0);
});
test('pool never exceeds its cap however far she runs', () => {
  const pool = new SlotPool(TRAIL.max); let now = 0;
  for (let i = 0; i < 500; i++) { now += 30; pool.acquire(now, 4000, TRAIL.max); assert.ok(pool.count(now) <= TRAIL.max); }
  assert.equal(pool.count(now), TRAIL.max);
});
test('reduced cap is honoured', () => {
  const pool = new SlotPool(TRAIL.max); let now = 0;
  for (let i = 0; i < 100; i++) { now += 30; pool.acquire(now, 4000, TRAIL.maxReduced); }
  assert.ok(pool.count(now) <= TRAIL.maxReduced);
});
test('flowers expire by themselves within 3–5 seconds', () => {
  const pool = new SlotPool(4); pool.acquire(0, 3000); assert.ok(pool.alive(0, 2999)); assert.equal(pool.alive(0, 3001), false);
  assert.ok(TRAIL.lifeMin >= 3000 && TRAIL.lifeMax <= 5000);
});
test('look: pops in, holds, fades to nothing, sparkles as it dissolves', () => {
  assert.ok(flowerLook(10, 4000, false).scale < 0.5);
  assert.equal(flowerLook(1500, 4000, false).alpha, 1);
  assert.ok(flowerLook(3800, 4000, false).alpha < 0.3 && flowerLook(3800, 4000, false).spark > 0);
  assert.equal(flowerLook(4000, 4000, false).alpha, 0);
  const r = flowerLook(3800, 4000, true); assert.equal(r.spark, 0); assert.equal(flowerLook(10, 4000, true).scale, 1);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEAD_ZONE, facingFor, knobOffset, speedScale, stickFromOffset, stickVelocity, NEUTRAL } from '../input/joystick';
import { footFree, steerMove, tileOfFoot } from '../world/steer';
import { makeGrid } from '../world/navigation';
import { getMap } from '../world/maps';
import { tilePos } from '../actors/player';
import { FORM_SPEED } from '../actors/transformations';
import type { Form } from '../types/game';

describe('joystick maths', () => {
  it('has a dead zone and a clamped magnitude', () => {
    assert.equal(stickFromOffset(2, 1, 58), NEUTRAL);
    assert.equal(stickFromOffset(0, 0, 58), NEUTRAL);
    const full = stickFromOffset(500, 0, 58);
    assert.equal(full.mag, 1); assert.equal(full.x, 1);
    const half = stickFromOffset(58 * 0.57, 0, 58);
    assert.ok(half.mag > 0.4 && half.mag < 0.6, String(half.mag));
    assert.equal(stickFromOffset(NaN, 4, 58), NEUTRAL);
  });
  it('diagonals are normalised: no faster than straight', () => {
    for (const [dx, dy] of [[40, 40], [-40, 40], [30, -50], [100, 100]]) {
      const s = stickFromOffset(dx, dy, 58); const v = stickVelocity(s, 84);
      assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 84 * speedScale(s.mag)) < 1e-9);
    }
    const a = stickVelocity(stickFromOffset(100, 0, 58), 84), b = stickVelocity(stickFromOffset(100, 100, 58), 84);
    assert.ok(Math.abs(Math.hypot(a.vx, a.vy) - Math.hypot(b.vx, b.vy)) < 1e-9);
  });
  it('a small push is slow but never stalls; a full push is full speed', () => {
    assert.equal(speedScale(0), 0); assert.ok(speedScale(0.01) >= 0.3); assert.equal(speedScale(1), 1); assert.equal(speedScale(5), 1);
    const slow = stickVelocity(stickFromOffset(58 * (DEAD_ZONE + 0.05), 0, 58), 104).vx;
    assert.ok(slow > 0 && slow < 104 * 0.5);
  });
  it('the knob never leaves the base', () => {
    const k = knobOffset(300, 400, 40); assert.ok(Math.abs(Math.hypot(k.x, k.y) - 40) < 1e-9);
    assert.deepEqual(knobOffset(10, 5, 40), { x: 10, y: 5 });
  });
  it('facing picks the nearest of four with hysteresis on diagonals', () => {
    assert.equal(facingFor(stickFromOffset(50, 5, 58), 'down'), 'right');
    assert.equal(facingFor(stickFromOffset(-5, -50, 58), 'right'), 'up');
    const d = stickFromOffset(40, 38, 58);
    assert.equal(facingFor(d, 'right'), 'right'); assert.equal(facingFor(d, 'down'), 'down');
    assert.equal(facingFor(NEUTRAL, 'left'), 'left');
  });
});

const footOf = (t: { x: number; y: number }, f: Form) => { const p = tilePos(t, f); return { x: p.x, y: p.y - (f === 'mermaid' ? 8 : 6) }; };
const spawnOf = (map: ReturnType<typeof getMap>, f: Form, grid: ReturnType<typeof makeGrid>) => {
  for (const s of Object.values(map.spawns)) if (grid.passable(s.x, s.y)) return s;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (grid.passable(x, y)) return { x, y };
  throw new Error('no tile');
};

describe('steering collision', () => {
  it('foot at a tile centre is free on a passable tile', () => {
    const room = getMap('bedroom'), g = makeGrid(room, {}, 'princess');
    const s = spawnOf(room, 'princess', g); const f = footOf(s, 'princess');
    assert.ok(footFree(g, f.x, f.y)); assert.deepEqual(tileOfFoot(f.x, f.y), s);
  });
  it('walls stop her and she slides along them', () => {
    const room = getMap('bedroom'), g = makeGrid(room, {}, 'princess');
    let f = footOf({ x: 11, y: 15 }, 'princess');
    for (let i = 0; i < 400; i++) { const r = steerMove(g, f.x, f.y, 0, -1.4); f = { x: r.x, y: r.y }; }
    assert.ok(footFree(g, f.x, f.y)); assert.ok(f.y > 48, 'stopped below the back wall: y=' + f.y);
    const y0 = f.y;
    for (let i = 0; i < 40; i++) { const r = steerMove(g, f.x, f.y, 1.4, -1.4); f = { x: r.x, y: r.y }; }
    assert.ok(f.x > footOf({ x: 11, y: 15 }, 'princess').x + 20, 'slid sideways along the wall');
    assert.ok(Math.abs(f.y - y0) < 4);
    assert.ok(footFree(g, f.x, f.y));
  });
  it('random thumbs on every map in every form never put her feet on an impassable tile', () => {
    let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const id of ['bedroom', 'courtyard', 'woods', 'shore', 'grotto'] as const) {
      const map = getMap(id);
      for (const form of ['princess', 'unicorn', 'mermaid'] as Form[]) {
        const g = makeGrid(map, {}, form);
        let ok = false; let f = { x: 0, y: 0 };
        for (let y = 0; y < map.h && !ok; y++) for (let x = 0; x < map.w && !ok; x++) if (g.passable(x, y)) { f = footOf({ x, y }, form); ok = footFree(g, f.x, f.y); }
        if (!ok) continue;
        let a = rnd() * 6.28, speed = FORM_SPEED[form];
        for (let i = 0; i < 3000; i++) {
          if (i % 40 === 0) a = rnd() * 6.28;
          const dt = 0.016 * (rnd() < 0.05 ? 3 : 1);
          const r = steerMove(g, f.x, f.y, Math.cos(a) * speed * dt, Math.sin(a) * speed * dt);
          f = { x: r.x, y: r.y };
          assert.ok(footFree(g, f.x, f.y), `${id}/${form} step ${i} at ${f.x.toFixed(1)},${f.y.toFixed(1)}`);
        }
      }
    }
  });
  it('a big frame hitch cannot tunnel through a wall', () => {
    const room = getMap('bedroom'), g = makeGrid(room, {}, 'unicorn');
    let f = footOf({ x: 11, y: 15 }, 'unicorn');
    for (let i = 0; i < 20; i++) { const r = steerMove(g, f.x, f.y, 0, -50); f = { x: r.x, y: r.y }; assert.ok(footFree(g, f.x, f.y)); }
  });
  it('the bedroom door at the bottom can be walked through by a straight push', () => {
    const room = getMap('bedroom'), g = makeGrid(room, {}, 'princess');
    let f = footOf({ x: 11, y: 15 }, 'princess');
    let reached = false;
    for (let i = 0; i < 200 && !reached; i++) { const r = steerMove(g, f.x, f.y, 0, 1.4); f = { x: r.x, y: r.y }; if (tileOfFoot(f.x, f.y).y >= 17) reached = true; }
    assert.ok(reached, 'reached the doorway row: ' + JSON.stringify(tileOfFoot(f.x, f.y)));
  });
});

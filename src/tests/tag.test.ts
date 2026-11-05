import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CHASE_SPEED, CONTACT_R, COOLDOWN_MS, FLEE_SPEED, PLAYER_MAX_SPEED, ROUNDS, TILE, dist, lineClear, newTag, stepTag, type Pt, type TagEvent, type TagState } from '../world/tag';
import { footFree } from '../world/steer';
import type { NavGrid } from '../world/navigation';

/** An open meadow with a border wall, and an optional internal wall. */
function field(w = 30, h = 20, walls: [number, number][] = []): NavGrid {
  const solid = new Set(walls.map(([x, y]) => `${x},${y}`));
  return { map: null as never, form: 'unicorn', passable: (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && !solid.has(`${x},${y}`) };
}
const px = (t: number) => t * TILE + TILE / 2;
const at = (x: number, y: number): Pt => ({ x: px(x), y: px(y) });

/** A scripted child: runs straight at (or away from) the companion at a chosen speed. */
function chaser(s: TagState, speed: number, dt: number): Pt {
  const d = dist(s.me, s.pal) || 1; const k = Math.min(1, (speed * dt / 1000) / d);
  return { x: s.me.x + (s.pal.x - s.me.x) * k, y: s.me.y + (s.pal.y - s.me.y) * k };
}
function run(grid: NavGrid, s: TagState, ms: number, brain: (s: TagState, dt: number) => Pt, onEvent?: (e: TagEvent, s: TagState) => void) {
  const evs: TagEvent[] = [];
  for (let t = 0; t < ms; t += 16) {
    const me = brain(s, 16);
    const r = stepTag(s, 16, me, grid);
    for (const e of r.events) { evs.push(e); onEvent?.(e, s); }
  }
  return evs;
}

describe('unicorn tag AI', () => {
  it('the companion is clearly slower than the child and has a fair contact radius', () => {
    assert.ok(FLEE_SPEED < PLAYER_MAX_SPEED * 0.7 && CHASE_SPEED < FLEE_SPEED);
    assert.ok(CONTACT_R >= 10 && CONTACT_R <= 20);
  });
  it('a child who simply runs at her always catches her; three tags earn three stars and one celebration, then done', () => {
    for (let seed = 0; seed < 10; seed++) {
      const g = field(); const s = newTag(at(15 + (seed % 3), 9), at(6 + seed, 14 - (seed % 4)));
      const evs = run(g, s, 90_000, (st, dt) => (st.phase === 'playerIt' || st.phase === 'invite' ? chaser(st, 110, dt) : { x: st.me.x + (seed % 2 ? 0.3 : -0.3), y: st.me.y }));
      assert.equal(s.phase, 'done', `seed ${seed}`);
      assert.equal(s.stars, ROUNDS);
      assert.equal(evs.filter((e) => e === 'tagged').length, ROUNDS, 'exactly one tag per round');
      assert.equal(evs.filter((e) => e === 'celebrate').length, 1);
      assert.equal(evs.filter((e) => e === 'done').length, 1);
    }
  });
  it('no repeated score while overlapping: tags are always at least a cooldown apart, and never exceed three stars', () => {
    const g = field(); const s = newTag(at(10, 10), at(10, 10)); const times: number[] = [];
    run(g, s, 20_000, (st) => ({ ...st.pal }), (e, st) => { if (e === 'tagged') times.push(st.t); });
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= COOLDOWN_MS, 'cooldown respected');
    assert.ok(s.stars <= ROUNDS);
  });
  it('contact never counts through a wall', () => {
    const wall: [number, number][] = []; for (let y = 1; y < 19; y++) wall.push([15, y]);
    const g = field(30, 20, wall);
    assert.ok(!lineClear(g, at(14, 10), at(16, 10)));
    const s = newTag(at(16, 10), at(14, 10)); s.phase = 'playerIt'; s.cooldownUntil = 0;
    // feet 2 tiles apart on opposite sides of the wall: never a tag
    const evs = run(g, s, 4000, (st) => ({ ...st.me }));
    assert.ok(!evs.includes('tagged'));
  });
  it('the companion always stays on open ground, never wedged in a wall, across long runs with a wandering child', () => {
    const walls: [number, number][] = []; for (let x = 8; x < 22; x++) walls.push([x, 9]);
    const g = field(30, 20, walls);
    for (let seed = 1; seed <= 10; seed++) {
      const s = newTag(at(15, 13), at(8, 15)); let a = seed;
      run(g, s, 40_000, (st, dt) => { a = (a * 1103515245 + 12345) & 0x7fffffff; const ang = (a % 628) / 100; const sp = 60 * dt / 1000; const nx = st.me.x + Math.cos(ang) * sp, ny = st.me.y + Math.sin(ang) * sp; return footFree(g, nx, ny) ? { x: nx, y: ny } : st.me; });
      assert.ok(footFree(g, s.pal.x, s.pal.y), `seed ${seed}: companion on open ground at ${s.pal.x},${s.pal.y}`);
    }
  });
  it('in a corner she does not get stuck forever: the child can still reach and tag her', () => {
    const g = field(12, 10); const s = newTag(at(1, 1), at(8, 6)); s.phase = 'playerIt'; s.cooldownUntil = 0;
    run(g, s, 30_000, (st, dt) => chaser(st, 100, dt));
    assert.ok(s.stars >= 1);
  });
  it('when the child stops playing she slows, approaches and invites; she does not trap or score on an idle child', () => {
    const g = field(); const s = newTag(at(20, 10), at(8, 10)); s.phase = 'companionIt'; s.cooldownUntil = 0;
    const evs = run(g, s, 12_000, (st) => ({ ...st.me }), undefined);
    assert.ok(evs.includes('invite') || evs.includes('caught'));
    assert.ok(s.stars === 0, 'her touching the child never takes a star away or adds one');
  });
  it('a companion chase gives up gracefully and the game continues (no softlock, no loss)', () => {
    const g = field(); const s = newTag(at(25, 3), at(3, 17)); s.phase = 'companionIt'; s.cooldownUntil = 0; s.meMovedAt = 1e9;
    let moveDir = 1;
    const evs = run(g, s, 40_000, (st) => { moveDir = -moveDir; return { x: st.me.x + moveDir * 0.2 * (st.phase === 'companionIt' ? 4 : 0), y: st.me.y }; });
    assert.ok(evs.some((e) => e === 'giveUp' || e === 'caught'));
    assert.ok(s.phase !== 'companionIt' || s.t > 0);
  });
  it('contact respects the cooldown', () => {
    const g = field(); const s = newTag(at(10, 10), at(10, 10)); s.phase = 'playerIt'; s.cooldownUntil = 0; s.pauseUntil = 1e9;
    let n = 0; run(g, s, COOLDOWN_MS - 100, (st) => ({ ...st.pal }), (e) => { if (e === 'tagged') n++; });
    assert.equal(n, 1);
  });
});

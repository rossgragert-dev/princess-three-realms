// v0.4b: Unicorn Tag. A pure, deterministic, Phaser-free module: friendly AI, fair contact rules, three gentle rounds.
// Positions are foot points in pixels (16 px tiles) so the same tile-authoritative `steerMove` used for the player moves the companion.
import type { NavGrid } from './navigation';
import { footFree, steerMove } from './steer';

export const TILE = 16;
export const ROUNDS = 3;
export const PLAYER_MAX_SPEED = 132;           // the unicorn's top speed (px/s)
export const FLEE_SPEED = PLAYER_MAX_SPEED * 0.6; // companion is clearly slower than the player
export const CHASE_SPEED = PLAYER_MAX_SPEED * 0.5;
export const CONTACT_R = 14;                    // px between feet that counts as a gentle touch
export const COOLDOWN_MS = 1800;                // no repeat scoring on overlap; also a calm breather after every tag
export const PAUSE_EVERY_MS = 2600;             // she stops to "catch her breath" now and then, giving a clear chance to tag
export const PAUSE_MS = 900;
export const GIVE_UP_MS = 14000;                // a chase by the companion never lasts forever
export const IDLE_INVITE_MS = 3500;             // if the child stands still, the companion comes over and invites

export interface Pt { x: number; y: number }
export type Phase = 'invite' | 'playerIt' | 'companionIt' | 'celebrate' | 'done';
export type TagEvent = 'tagged' | 'caught' | 'invite' | 'roundStart' | 'giveUp' | 'celebrate' | 'done';

export interface TagState {
  phase: Phase;
  /** stars earned this session (player tagged the companion), 0..ROUNDS */
  stars: number;
  pal: Pt;
  me: Pt;
  t: number;            // session clock (ms)
  cooldownUntil: number;
  phaseSince: number;
  pauseUntil: number;
  nextPauseAt: number;
  meMovedAt: number;
  lastMe: Pt;
  stuckMs: number;
  heading: Pt;          // companion's current unit heading
  facing: 'up' | 'down' | 'left' | 'right';
  moving: boolean;
}

export const DIRS8: Pt[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 }, { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 }];
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

export function newTag(pal: Pt, me: Pt): TagState {
  return { phase: 'invite', stars: 0, pal: { ...pal }, me: { ...me }, t: 0, cooldownUntil: 0, phaseSince: 0, pauseUntil: 0, nextPauseAt: PAUSE_EVERY_MS, meMovedAt: 0, lastMe: { ...me }, stuckMs: 0, heading: { x: 0, y: 1 }, facing: 'down', moving: false };
}

/** Clear line between two foot points: no solid tile between them, so nobody is ever tagged through a wall. */
export function lineClear(grid: NavGrid, a: Pt, b: Pt): boolean {
  const n = Math.max(1, Math.ceil(dist(a, b) / 4));
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
    if (!grid.passable(Math.floor(x / TILE), Math.floor(y / TILE))) return false;
  }
  return true;
}

/** Free steps ahead along a heading: a cheap "is this direction roomy?" measure that keeps the companion out of dead ends. */
function room(grid: NavGrid, p: Pt, d: Pt, maxSteps = 6): number {
  let n = 0;
  for (let i = 1; i <= maxSteps; i++) { if (!footFree(grid, p.x + d.x * 8 * i, p.y + d.y * 8 * i)) break; n++; }
  return n;
}

/** The companion's wish for this moment: away from the child (evade) or toward the child (chase), always along open ground. */
function pickHeading(grid: NavGrid, s: TagState, away: boolean): Pt | null {
  let best: Pt | null = null, bestScore = -Infinity;
  const base = dist(s.pal, s.me);
  for (const d of DIRS8) {
    const r = room(grid, s.pal, d);
    if (r === 0) continue;
    const np = { x: s.pal.x + d.x * 24, y: s.pal.y + d.y * 24 };
    const nd = dist(np, s.me);
    // keep going the same way unless something is clearly better (no jitter)
    const stay = d.x === s.heading.x && d.y === s.heading.y ? 3 : 0;
    const score = (away ? nd - base : base - nd) * 1.0 + Math.min(r, 6) * (away ? 2.2 : 0.6) + stay;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

const faceOf = (d: Pt): TagState['facing'] => (Math.abs(d.x) >= Math.abs(d.y) ? (d.x > 0 ? 'right' : 'left') : d.y > 0 ? 'down' : 'up');

export interface TagStep { events: TagEvent[] }

/** Advance the game by `dtMs`. `me` is the child's current foot point. Deterministic: no randomness is needed. */
export function stepTag(s: TagState, dtMs: number, me: Pt, grid: NavGrid): TagStep {
  const events: TagEvent[] = [];
  const dt = Math.min(dtMs, 50);
  s.t += dt;
  s.me = { ...me };
  if (dist(me, s.lastMe) > 0.4) { s.meMovedAt = s.t; s.lastMe = { ...me }; }
  s.moving = false;
  if (s.phase === 'done') return { events };

  if (s.phase === 'celebrate') {
    if (s.t - s.phaseSince > 2600) { s.phase = 'done'; events.push('done'); }
    return { events };
  }

  const near = dist(s.pal, s.me);
  const calm = s.t < s.cooldownUntil;

  if (s.phase === 'invite') {
    // she waits near the child, hops to say hello, and the first touch starts round one
    if (near > 90 && s.t - s.phaseSince > 600) { moveToward(s, grid, dt, CHASE_SPEED * 0.8); }
    if (s.t - s.phaseSince > 1200 && near < CONTACT_R + 8 && lineClear(grid, s.pal, s.me)) {
      s.phase = 'playerIt'; s.phaseSince = s.t; s.nextPauseAt = s.t + 1500; s.cooldownUntil = s.t + 800; events.push('roundStart');
    } else if (Math.floor(s.t / 3000) !== Math.floor((s.t - dt) / 3000)) events.push('invite');
    return { events };
  }

  if (s.phase === 'playerIt') {
    // friendly evade: slower than the child, pauses now and then, and never cornered into a stuck pose
    if (s.t >= s.pauseUntil && s.t >= s.nextPauseAt) { s.pauseUntil = s.t + PAUSE_MS; s.nextPauseAt = s.t + PAUSE_MS + PAUSE_EVERY_MS; }
    if (s.t < s.pauseUntil) { /* standing still, ears twitching */ } else if (near < 150) {
      const h = pickHeading(grid, s, true);
      if (h) { s.heading = h; moveAlong(s, grid, dt, FLEE_SPEED); }
      else s.pauseUntil = s.t + 500; // truly cornered: just stand there and let the tag happen
    } else if (near > 220) moveToward(s, grid, dt, CHASE_SPEED * 0.8);  // child far away: wander closer, never run off
    if (!calm && near <= CONTACT_R && lineClear(grid, s.pal, s.me)) {
      s.stars = Math.min(ROUNDS, s.stars + 1); s.cooldownUntil = s.t + COOLDOWN_MS; events.push('tagged');
      if (s.stars >= ROUNDS) { s.phase = 'celebrate'; s.phaseSince = s.t; events.push('celebrate'); }
      else { s.phase = 'companionIt'; s.phaseSince = s.t; events.push('roundStart'); }
    }
    return { events };
  }

  // companionIt: the friend chases at a gentle pace, always gives up gracefully, and never traps
  const idleFor = s.t - s.meMovedAt;
  if (!calm) {
    if (idleFor > IDLE_INVITE_MS) { // the child stopped: come over slowly and invite instead of chasing
      if (near > CONTACT_R * 1.4) moveToward(s, grid, dt, CHASE_SPEED * 0.6);
      else if (Math.floor(s.t / 1500) !== Math.floor((s.t - dt) / 1500)) events.push('invite');
    } else {
      const h = pickHeading(grid, s, false);
      if (h) { s.heading = h; moveAlong(s, grid, dt, near > 80 ? CHASE_SPEED : CHASE_SPEED * 0.8); }
    }
  }
  if (!calm && near <= CONTACT_R && lineClear(grid, s.pal, s.me)) {
    s.phase = 'playerIt'; s.phaseSince = s.t; s.cooldownUntil = s.t + COOLDOWN_MS; s.nextPauseAt = s.t + COOLDOWN_MS + 1200; events.push('caught');
  } else if (s.t - s.phaseSince > GIVE_UP_MS) {
    s.phase = 'playerIt'; s.phaseSince = s.t; s.cooldownUntil = s.t + 1200; s.nextPauseAt = s.t + 2000; events.push('giveUp');
  }
  return { events };
}

function moveAlong(s: TagState, grid: NavGrid, dt: number, speed: number) {
  const px = speed * dt / 1000;
  const r = steerMove(grid, s.pal.x, s.pal.y, s.heading.x * px, s.heading.y * px);
  const moved = Math.hypot(r.x - s.pal.x, r.y - s.pal.y);
  s.pal = { x: r.x, y: r.y };
  if (moved < px * 0.25) { s.stuckMs += dt; if (s.stuckMs > 350) { s.heading = { x: -s.heading.y, y: s.heading.x }; s.stuckMs = 0; } } else s.stuckMs = 0;
  if (moved > 0.01) { s.moving = true; s.facing = faceOf(s.heading); }
}

function moveToward(s: TagState, grid: NavGrid, dt: number, speed: number) {
  const h = pickHeading(grid, s, false);
  if (h) { s.heading = h; moveAlong(s, grid, dt, speed); }
}

/** Pure joystick maths (no Phaser). The scene feeds pointer offsets in; it gets a smooth, normalised steering vector out. */
export type Facing = 'down' | 'up' | 'left' | 'right';

export interface Stick { x: number; y: number; mag: number }
export const NEUTRAL: Stick = { x: 0, y: 0, mag: 0 };

/** Fraction of the base radius inside which the thumb counts as "not pushing". */
export const DEAD_ZONE = 0.14;

/**
 * Pointer offset from the base centre -> steering vector. `x`,`y` are a unit direction (so diagonals are never faster);
 * `mag` is 0..1 after the dead zone, reaching 1 at the edge of the base and clamping beyond it.
 */
export function stickFromOffset(dx: number, dy: number, radius: number, dead = DEAD_ZONE): Stick {
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || radius <= 0 || len / radius <= dead) return NEUTRAL;
  const mag = Math.min(1, (len / radius - dead) / (1 - dead));
  return { x: dx / len, y: dy / len, mag };
}

/** Where the knob is drawn: follows the finger but never leaves the base. */
export function knobOffset(dx: number, dy: number, radius: number): { x: number; y: number } {
  const len = Math.hypot(dx, dy);
  if (len <= radius || len === 0) return { x: dx, y: dy };
  return { x: (dx / len) * radius, y: (dy / len) * radius };
}

/** A tiny push walks slowly (precise room navigation); a full push is full speed. Never below 30% once past the dead zone. */
export const speedScale = (mag: number) => (mag <= 0 ? 0 : 0.3 + 0.7 * Math.min(1, mag));

export function stickVelocity(s: Stick, speed: number): { vx: number; vy: number } {
  const k = speed * speedScale(s.mag);
  return { vx: s.x * k, vy: s.y * k };
}

/** Nearest of the four art facings, with hysteresis so a diagonal does not make the sprite flicker between two. */
export function facingFor(s: Stick, prev: Facing): Facing {
  if (s.mag <= 0) return prev;
  const ax = Math.abs(s.x), ay = Math.abs(s.y);
  const horizontal = prev === 'left' || prev === 'right';
  // keep the current axis until the other one clearly wins
  const preferH = horizontal ? ax >= ay * 0.8 : ax > ay * 1.25;
  if (preferH) return s.x >= 0 ? 'right' : 'left';
  return s.y >= 0 ? 'down' : 'up';
}

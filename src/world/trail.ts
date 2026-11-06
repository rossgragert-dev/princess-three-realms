// v0.4b.3: the unicorn's living flower trail — pure rules (no Phaser). Visuals live in WorldScene.
import type { Pt } from './spells';

export const FLOWER_COLORS = [0xff7ec3, 0xffd93d, 0xb48cff, 0x6bb8ff, 0xffffff] as const; // pink, yellow, lavender, blue, white
export const TRAIL = {
  lifeMin: 3000, lifeMax: 5000,
  walkGap: 15, gallopGap: 8,   // px between flowers: slow = individual blooms, gallop = near-continuous line
  max: 28, maxReduced: 10,     // hard cap on simultaneous flowers
  gapReducedMul: 2
};

/** Only living grass blooms: never stone, paths, water, sand, indoor floors. */
export const isGrassTile = (name: string): boolean => name.startsWith('grass');

/** Decides where flowers go as she moves. Distance based, so joystick and tap-to-move behave the same. */
export class TrailPlanner {
  private last: Pt | null = null;
  private acc = 0;
  reset() { this.last = null; this.acc = 0; }
  /** Call every frame she is moving (pos = her feet). Returns the points a flower should appear at (usually 0 or 1). */
  step(pos: Pt, onGrass: boolean, gallop: boolean, reduced: boolean, behind: Pt): Pt[] {
    const out: Pt[] = [];
    const prev = this.last; this.last = { ...pos };
    if (!prev || !onGrass) { this.acc = 0; return out; }
    const d = Math.hypot(pos.x - prev.x, pos.y - prev.y);
    if (d > 48) { this.acc = 0; return out; } // teleport / scene change
    this.acc += d;
    const gap = (gallop ? TRAIL.gallopGap : TRAIL.walkGap) * (reduced ? TRAIL.gapReducedMul : 1);
    while (this.acc >= gap && out.length < 3) { this.acc -= gap; out.push({ x: pos.x + behind.x, y: pos.y + behind.y }); }
    if (this.acc > gap * 3) this.acc = 0;
    return out;
  }
}

/** Fixed-size pool bookkeeping: reuse an expired slot, otherwise recycle the oldest. Never grows past `size`. */
export class SlotPool {
  readonly born: number[]; readonly life: number[];
  constructor(readonly size: number) { this.born = new Array(size).fill(-1e9); this.life = new Array(size).fill(0); }
  alive(i: number, now: number): boolean { return now - this.born[i] < this.life[i]; }
  acquire(now: number, life: number, cap = this.size): number {
    let pick = -1, oldest = 0, oldestAge = -1;
    for (let i = 0; i < Math.min(cap, this.size); i++) {
      if (!this.alive(i, now)) { pick = i; break; }
      const age = now - this.born[i]; if (age > oldestAge) { oldestAge = age; oldest = i; }
    }
    if (pick < 0) pick = oldest;
    this.born[pick] = now; this.life[pick] = life; return pick;
  }
  count(now: number): number { let n = 0; for (let i = 0; i < this.size; i++) if (this.alive(i, now)) n++; return n; }
}

/** Visual state of a flower at age `t` (ms): pops in, holds, then dissolves. */
export function flowerLook(t: number, life: number, reduced: boolean): { scale: number; alpha: number; spark: number } {
  const fadeMs = reduced ? 600 : 1000;
  const popMs = 240;
  const scale = reduced ? 1 : t < popMs ? 0.2 + 0.95 * (t / popMs) : t < popMs + 120 ? 1.15 - 0.15 * ((t - popMs) / 120) : 1;
  const left = life - t;
  const alpha = left >= fadeMs ? 1 : Math.max(0, left / fadeMs);
  const spark = reduced || left > 520 || left <= 0 ? 0 : 1 - left / 520;
  return { scale, alpha, spark };
}

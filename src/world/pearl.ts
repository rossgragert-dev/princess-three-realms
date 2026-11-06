// v0.4b.3: the mermaid's bubble wand and the glowing pearl lane — pure rules (no Phaser).
import { DIRS, fly, type Pt, type SpellTarget } from './spells';

/** Tile columns the pearl rests at after each successful bubble; the last one is the shell socket. */
export const PEARL_LANE_X = [22, 24, 26, 28];
export const PEARL_Y = 20;
export const PEARL_START_X = 20;
/** How close (tiles) the bubble's straight line must pass to the pearl's centre to touch it. */
export const PEARL_HIT_R = 0.6;
export const BUBBLE_RANGE = 7;

/** The next resting column ahead of the pearl, or undefined once it is in the socket. */
export const nextLaneX = (curX: number): number | undefined => PEARL_LANE_X.find((x) => x > curX);
export const isSocketX = (x: number): boolean => x >= PEARL_LANE_X[PEARL_LANE_X.length - 1];

export interface BubbleResult { end: Pt; dist: number; blocked: boolean; hitPearl: boolean; push: boolean }

/**
 * One bubble fired straight along the way the mermaid faces (no aiming help, no homing).
 * It touches the pearl only if its line passes through it; the pearl only travels along its lane (to the right),
 * so a bubble from any other side just makes it wobble.
 */
export function bubbleShot(from: Pt, facing: keyof typeof DIRS, pearl: { x: number; y: number } | null, solid: (tx: number, ty: number) => boolean): BubbleResult {
  const targets: SpellTarget[] = pearl ? [{ id: 'pearl', kind: 'glow', x: pearl.x + 0.5, y: pearl.y + 0.5, r: PEARL_HIT_R }] : [];
  const f = fly(from, DIRS[facing], targets, solid, BUBBLE_RANGE);
  const hitPearl = f.hit?.id === 'pearl';
  return { end: f.end, dist: f.dist, blocked: f.blocked, hitPearl, push: hitPearl && facing === 'right' };
}

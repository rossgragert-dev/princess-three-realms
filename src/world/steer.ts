import type { NavGrid } from './navigation';

/** Half-size of the feet box used for collision, in px. Narrow enough for a 1-tile corridor, wide enough not to clip walls. */
export const FOOT_HX = 5;
export const FOOT_HY = 3;
const TILE = 16;
const MAX_SUB = 4; // px per sub-step; stops fast forms tunnelling through a 16px tile

/** True if a feet box centred on (fx,fy) lies entirely on passable tiles. The tile grid stays authoritative. */
export function footFree(grid: NavGrid, fx: number, fy: number): boolean {
  const x0 = Math.floor((fx - FOOT_HX) / TILE), x1 = Math.floor((fx + FOOT_HX - 0.01) / TILE);
  const y0 = Math.floor((fy - FOOT_HY) / TILE), y1 = Math.floor((fy + FOOT_HY - 0.01) / TILE);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!grid.passable(x, y)) return false;
  return true;
}

export interface SteerResult { x: number; y: number; blockedX: boolean; blockedY: boolean }

/**
 * Moves the feet point by (dx,dy) with axis-separated sliding: a blocked axis stops, the other keeps going, so walls are slid
 * along rather than stuck on. If one axis is blocked only by a corner, the princess is gently eased round it (doorways, furniture).
 */
export function steerMove(grid: NavGrid, fx: number, fy: number, dx: number, dy: number): SteerResult {
  let x = fx, y = fy, bx = false, by = false;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / MAX_SUB));
  const sx = dx / n, sy = dy / n;
  for (let i = 0; i < n; i++) {
    if (sx !== 0) {
      if (footFree(grid, x + sx, y)) x += sx;
      else {
        bx = true;
        // corner ease: if shifting up or down by a few px frees the way, slide that way
        for (const nudge of [1, 2, 3, 4, 5]) {
          const up = footFree(grid, x + sx, y - nudge), down = footFree(grid, x + sx, y + nudge);
          if (up !== down) { const ny = y + (up ? -1 : 1) * Math.min(Math.abs(sx), 1.5); if (footFree(grid, x, ny)) y = ny; break; }
          if (up && down) break;
        }
      }
    }
    if (sy !== 0) {
      if (footFree(grid, x, y + sy)) y += sy;
      else {
        by = true;
        for (const nudge of [1, 2, 3, 4, 5]) {
          const l = footFree(grid, x - nudge, y + sy), r = footFree(grid, x + nudge, y + sy);
          if (l !== r) { const nx = x + (l ? -1 : 1) * Math.min(Math.abs(sy), 1.5); if (footFree(grid, nx, y)) x = nx; break; }
          if (l && r) break;
        }
      }
    }
  }
  return { x, y, blockedX: bx, blockedY: by };
}

export const tileOfFoot = (fx: number, fy: number) => ({ x: Math.floor(fx / TILE), y: Math.floor(fy / TILE) });

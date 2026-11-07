import type { Form } from '../types/game';
import { flood, makeGrid, type Flags } from '../world/navigation';
import type { MapDef, Tile } from '../world/types';

export const FORM_SPEED: Record<Form, number> = { princess: 84, unicorn: 132, mermaid: 104 }; // logical px/s (v0.4a: ~30% faster than v0.3's 62 / 104 / 80)

export type Unavailable = 'locked' | 'underwater' | 'no_water' | 'no_route';

export type FormPlan =
  | { mode: 'same' }
  | { mode: 'now' }
  /** Walk to `to`; when you arrive change form and take one step onto `step` (if given). */
  | { mode: 'walk'; to: Tile; step?: Tile }
  | { mode: 'unavailable'; reason: Unavailable };

/** Which forms the picker offers right now. Locked forms are hidden, never greyed text. */
export function availableForms(_flags: Flags): Form[] {
  // v0.4d.6: every form is free from the first launch. Story flags track story events, not abilities.
  return ['princess', 'unicorn', 'mermaid'];
}

const N4: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Plans a form change without ever teleporting into a wall or leaving the player stranded:
 * - land forms can swap anywhere both can stand;
 * - to become a mermaid, walk to the nearest shore tile and step into the water;
 * - to leave the water, swim to the nearest shore and step onto land.
 */
export function planFormChange(map: MapDef, flags: Flags, at: Tile, current: Form, target: Form): FormPlan {
  if (target === current) return { mode: 'same' };
  if (!availableForms(flags).includes(target)) return { mode: 'unavailable', reason: 'locked' };
  if (map.medium === 'water') return { mode: 'unavailable', reason: 'underwater' };

  const here = makeGrid(map, flags, current);
  const dest = makeGrid(map, flags, target);

  if (target !== 'mermaid' && current !== 'mermaid') {
    if (dest.passable(at.x, at.y)) return { mode: 'now' };
    // e.g. a unicorn standing on a creek: walk to the nearest tile the princess can stand on.
    const reach = flood(here, at);
    let best: Tile | null = null, bd = Infinity;
    for (const [k, d] of reach) {
      const x = k % 4096, y = Math.floor(k / 4096);
      if (dest.passable(x, y) && d < bd) { bd = d; best = { x, y }; }
    }
    return best ? { mode: 'walk', to: best } : { mode: 'unavailable', reason: 'no_route' };
  }

  if (target === 'mermaid' && !map.mermaidAllowed) return { mode: 'unavailable', reason: 'no_water' };

  // Crossing the shoreline in either direction: find the nearest tile (reachable in the current form)
  // that has a neighbouring tile the target form can stand on.
  const reach = flood(here, at);
  let best: { to: Tile; step: Tile; d: number } | null = null;
  for (const [k, d] of reach) {
    const x = k % 4096, y = Math.floor(k / 4096);
    for (const [dx, dy] of N4) {
      if (dest.passable(x + dx, y + dy) && (!best || d < best.d)) best = { to: { x, y }, step: { x: x + dx, y: y + dy }, d };
    }
  }
  return best ? { mode: 'walk', to: best.to, step: best.step } : { mode: 'unavailable', reason: map.mermaidAllowed ? 'no_route' : 'no_water' };
}

/** Narration key to speak for a given outcome. */
export function narrationForPlan(plan: FormPlan, target: Form): string | null {
  if (plan.mode === 'unavailable') return plan.reason === 'no_water' || plan.reason === 'underwater' ? 'form_wrong_terrain' : null;
  return target === 'unicorn' ? 'transform_unicorn' : target === 'mermaid' ? 'transform_mermaid' : 'transform_princess';
}

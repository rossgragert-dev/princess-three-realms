import type { TileName } from '../content/frameIndex';

/** land: walk (princess/unicorn). water: swim (mermaid). creek: unicorn leaps it. solid: nobody. */
export type Terrain = 'land' | 'water' | 'creek' | 'solid';

export function terrainOf(t: TileName): Terrain {
  if (t.startsWith('water') || t === 'deep_water') return 'water';
  if (t.startsWith('stream')) return 'creek';
  if (
    t.startsWith('wall_') ||
    t.startsWith('roof_') ||
    t.startsWith('tree_wall') ||
    t === 'hedge' ||
    t.startsWith('fence_') ||
    t.startsWith('boulder') ||
    t.startsWith('uw_rock') ||
    t.startsWith('coral_') ||
    t === 'baseboard' ||
    t === 'bridge_ghost'
  )
    return 'solid';
  return 'land';
}

/** Ground tiles that animate by cycling frames 0-3 of a family. */
export const ANIMATED_FAMILIES = ['water', 'water_edge', 'stream'] as const;

import type { SceneId } from '../types/game';

/** v0.4d.6: the King's and Queen's mission pictures take her straight to the adventure. Invitations only, never gates. */
export const MISSIONS: Record<string, { scene: SceneId; spawn: string }> = {
  woods: { scene: 'woods', spawn: 'from_courtyard' },
  meadow: { scene: 'meadow', spawn: 'from_woods' },
  shore: { scene: 'shore', spawn: 'from_woods' },
  garden: { scene: 'garden', spawn: 'from_courtyard' },
  // straight to the Shimmering River start line: no tasks needed first
  race: { scene: 'river', spawn: 'from_throne' },
  // the castle moat and the underwater realm beneath it
  moat: { scene: 'moat', spawn: 'from_courtyard' }
};

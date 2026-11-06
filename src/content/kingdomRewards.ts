// v0.4c: what each Kingdom Beyond milestone gives. Gentle, granted once (completeFlag is idempotent), saved, and never required.
import type { GameState, QuestFlag } from '../types/game';

export interface KingdomReward { sticker?: string; decor?: string }

export const KINGDOM_REWARDS: Partial<Record<QuestFlag, KingdomReward>> = {
  LANTERNS_LIT: { sticker: 'sticker_lanterns', decor: 'mushroom_lamp' },
  TREES_HEARD: { sticker: 'sticker_trees', decor: 'woodland_plush' },
  RHYME_BRIDGE: { sticker: 'sticker_rhyme_bridge', decor: 'lantern_garland' },
  STUMP_STORY: { sticker: 'sticker_storybook' },
  WOODS_TREASURE: { sticker: 'sticker_woods_gem' },
  GARDEN_GROWN: { sticker: 'sticker_garden', decor: 'flower_cushion' },
  BUTTERFLIES_GUIDED: { sticker: 'sticker_butterflies' },
  GARDEN_COUNTED: { sticker: 'sticker_ladybug' },
  FOUNTAIN_RESTORED: { sticker: 'sticker_fountain' },
  GARDEN_TREASURE: { sticker: 'sticker_garden_gem' },
  RIVER_FRIENDLY: { sticker: 'sticker_river', decor: 'river_fountain' },
  RIVER_STAR: { sticker: 'sticker_river_star' },
  RIVER_PEARLS: { sticker: 'sticker_river_pearls' },
  RIVER_TREASURE: { sticker: 'sticker_river_gem' }
};

/** Pure, idempotent. Returns true if anything new was given. */
export function grantKingdomReward(s: Pick<GameState, 'stickers' | 'unlockedDecor'>, flag: QuestFlag): boolean {
  const r = KINGDOM_REWARDS[flag];
  if (!r) return false;
  let gave = false;
  if (r.sticker && !s.stickers.includes(r.sticker)) { s.stickers.push(r.sticker); gave = true; }
  if (r.decor && !s.unlockedDecor.includes(r.decor)) { s.unlockedDecor.push(r.decor); gave = true; }
  return gave;
}

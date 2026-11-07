import type { GameState, QuestFlag } from '../types/game';
import { decorForFlag } from '../content/decorCatalog';
import { grantForFlag } from '../content/appearance';
import { grantKingdomReward } from '../content/kingdomRewards';

/** The ordered main path. Each step lists the flag that completes it and the flags that must come first. */
export const MAIN_PATH: { flag: QuestFlag; requires: QuestFlag[]; hintIcon: string; where: string }[] = [
  { flag: 'INTRO_DONE', requires: [], hintIcon: 'icon_pip', where: 'courtyard' },
  { flag: 'PIP_CARROTS_DONE', requires: ['INTRO_DONE'], hintIcon: 'carrot', where: 'courtyard' },
  { flag: 'TREE_GATE_OPEN', requires: ['PIP_CARROTS_DONE'], hintIcon: 'icon_tree', where: 'woods' },
  { flag: 'RAINBOW_BRIDGE_OPEN', requires: ['TREE_GATE_OPEN'], hintIcon: 'icon_rainbow', where: 'woods' },
  { flag: 'MARINA_HELPED', requires: ['RAINBOW_BRIDGE_OPEN'], hintIcon: 'icon_marina', where: 'grotto' },
  { flag: 'PEARL_PLACED', requires: ['MARINA_HELPED'], hintIcon: 'icon_wand', where: 'grotto' },
  { flag: 'STAR_1_FOUND', requires: ['PEARL_PLACED'], hintIcon: 'icon_star', where: 'grotto' },
  { flag: 'LAMP_PLACED', requires: ['STAR_1_FOUND'], hintIcon: 'icon_lamp', where: 'bedroom' }
];

/** v0.4d.6: the path is a suggested order only. Every flag can be earned in any order (skipping ahead is welcome); rewards are still granted once. */
export function canComplete(_state: GameState, _flag: QuestFlag): boolean {
  return true;
}

/** Idempotent. Returns true only the first time the flag is set (so rewards are never farmed). */
export function completeFlag(state: GameState, flag: QuestFlag): boolean {
  if (state.flags[flag]) return false;
  if (!canComplete(state, flag)) return false;
  state.flags[flag] = true;
  if (flag === 'STAR_1_FOUND') {
    state.stars = Math.max(state.stars, 1);
    addUnique(state.stickers, 'sticker_star');
  }
  if (flag === 'PIP_CARROTS_DONE') addUnique(state.stickers, 'sticker_pip');
  if (flag === 'RAINBOW_BRIDGE_OPEN') addUnique(state.stickers, 'sticker_rainbow');
  if (flag === 'MARINA_HELPED') {
    addUnique(state.stickers, 'sticker_marina');
  }
  if (flag === 'WAND_LIT') addUnique(state.stickers, 'sticker_wand');
  if (flag === 'CREEK_CHEST') addUnique(state.stickers, 'sticker_chest');
  const item = decorForFlag(flag);
  if (item) addUnique(state.unlockedDecor, item); // every decor reward comes from exactly one flag
  grantKingdomReward(state, flag); // v0.4c: stickers and room items for the Kingdom Beyond, once each
  grantForFlag(state.wardrobe, flag); // v0.3: optional wearables, same one-flag rule; never replaces what she is wearing
  return true;
}

export function nextObjective(state: GameState) {
  return MAIN_PATH.find((s) => !state.flags[s.flag]) ?? null;
}

export function chapterComplete(state: GameState): boolean {
  return !!state.flags.LAMP_PLACED;
}

function addUnique(arr: string[], v: string) {
  if (!arr.includes(v)) arr.push(v);
}

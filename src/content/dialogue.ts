import type { Speaker } from './narrationManifest';

export interface Line { speaker: Speaker; key: string }
const L = (speaker: Speaker, key: string): Line => ({ speaker, key });

/** Short scripted beats. 1-3 spoken lines each. Every key exists in narrationManifest (tested). */
export const SCRIPT = {
  intro: [L('narrator', 'intro_welcome')],
  pipIntro: [L('pip', 'pip_intro')],
  pipCount: [L('pip', 'pip_count_carrots')],
  carrotsDone: [L('pip', 'success_carrots')],
  treeAsk: [L('tree', 'tree_sound_b')],
  treeDone: [L('tree', 'success_tree_sound')],
  willaIntro: [L('willa', 'willa_intro')],
  needUnicorn: [L('willa', 'need_unicorn')],
  bridgeAsk: [L('bramble', 'bramble_pattern')],
  bridgeDone: [L('bramble', 'success_bridge_pattern'), L('willa', 'bridge_bloom_prompt')],
  shoreIntro: [L('willa', 'shore_intro')],
  marinaIntro: [L('marina', 'marina_intro')],
  marinaCount: [L('marina', 'marina_find_starfish')],
  marinaDone: [L('marina', 'success_starfish'), L('coralie', 'pearl_prompt')],
  pearlHint: [L('coralie', 'pearl_prompt')],
  pearlPushed: [L('coralie', 'pearl_pushed')],
  starFound: [L('narrator', 'star_found'), L('narrator', 'obj_home')],
  nanaReturn: [L('nana', 'nana_return'), L('narrator', 'decor_tutorial')],
  lampPlaced: [L('nana', 'lamp_placed'), L('narrator', 'chapter_done')],
  wandLit: [L('narrator', 'wand_lit')],
  chestFound: [L('narrator', 'chest_found')],
  bloomCheer: [L('narrator', 'bloom_cheer')],
  shellAsk: [L('shell', 'shell_rhyme_cat')],
  shellDone: [L('shell', 'success_shell_rhyme')],
  gardenAsk: [L('nana', 'garden_sequence')],
  gardenDone: [L('nana', 'success_garden_grow')]
} as const satisfies Record<string, readonly Line[]>;

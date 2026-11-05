import { ITEM, UI } from './frameIndex';

/**
 * Picture-first dialogue: every spoken line also has a short row of pictures (max 4) so the child can follow the
 * story with no reading and no sound. A glyph is a UI icon (`icon_*`), an item frame name, or `#X` for a big letter/symbol.
 */
export const LINE_GLYPHS: Record<string, string[]> = {
  intro_welcome: ['icon_princess', 'heart', 'icon_home'],
  pip_intro: ['icon_pip', 'heart'],
  pip_count_carrots: ['carrot_top', 'carrot_top', 'carrot_top'],
  success_carrots: ['carrot', 'sparkle0', 'heart'],
  tree_sound_b: ['icon_tree', '#B', 'icon_sound'],
  success_tree_sound: ['icon_tree', 'sparkle0', 'heart'],
  king_hello: ['star', 'sparkle0', 'heart'],
  king_again: ['sparkle1', 'heart'],
  queen_hello: ['icon_wand', 'icon_star'],
  queen_again: ['icon_wand', 'heart'],
  dapple_hello: ['icon_unicorn', 'heart'],
  dapple_again: ['icon_unicorn', 'icon_star'],
  dapple_form: ['icon_wand', 'icon_unicorn'],
  willa_meadow: ['icon_unicorn', 'icon_up'],
  willa_intro: ['icon_unicorn', 'heart'],
  need_unicorn: ['icon_wand', 'icon_unicorn'],
  transform_unicorn: ['icon_unicorn', 'sparkle0'],
  transform_mermaid: ['icon_mermaid', 'sparkle0'],
  transform_princess: ['icon_princess', 'sparkle0'],
  form_wrong_terrain: ['icon_wand', 'icon_lock'],
  bramble_pattern: ['tile_red', 'tile_blue', 'tile_red', '#?'],
  success_bridge_pattern: ['icon_rainbow', 'sparkle0', 'heart'],
  bridge_bloom_prompt: ['icon_unicorn', 'bloom0', 'sparkle0'],
  shore_intro: ['icon_mermaid', 'water'],
  marina_intro: ['icon_marina', 'heart'],
  marina_find_starfish: ['starfish', 'starfish', 'starfish'],
  success_starfish: ['starfish', 'sparkle0', 'heart'],
  pearl_prompt: ['pearl', 'icon_wand'],
  pearl_pushed: ['pearl', 'sparkle0', 'heart'],
  star_found: ['star', 'sparkle0', 'heart'],
  nana_return: ['icon_home', 'heart'],
  decor_tutorial: ['icon_home', 'sparkle0', 'icon_hint'],
  lamp_placed: ['icon_lamp', 'sparkle0', 'heart'],
  chapter_done: ['star', 'icon_home', 'heart'],
  shell_rhyme_cat: ['cat', 'icon_music', 'hat'],
  success_shell_rhyme: ['hat', 'cat', 'heart'],
  garden_sequence: ['seed', 'water', 'flower'],
  success_garden_grow: ['flower', 'sparkle0', 'heart'],
  obj_pip: ['icon_pip', 'heart'],
  obj_tree: ['icon_tree', 'icon_sound'],
  obj_bridge: ['icon_rainbow', 'icon_unicorn'],
  obj_lake: ['water', 'icon_mermaid'],
  obj_marina: ['icon_marina', 'icon_down'],
  obj_star: ['star', 'sparkle0'],
  obj_home: ['icon_home', 'sparkle0'],
  wand_lit: ['icon_wand', 'sparkle0', 'heart'],
  chest_found: ['chest_open', 'sparkle0', 'heart'],
  bloom_cheer: ['bloom2', 'sparkle0', 'heart'],
  retry_gentle: ['heart', 'icon_hint'],
  hint_together: ['icon_hint', 'heart'],
  controls_tap: ['icon_princess', 'icon_hint'],
  quest_replay: ['icon_hint']
};

const BY_PREFIX: [RegExp, string[]][] = [
  [/^hint_carrots/, ['carrot_top', 'icon_hint']],
  [/^hint_tree/, ['ball', 'icon_hint']],
  [/^hint_pattern/, ['tile_red', 'tile_blue', 'tile_red']],
  [/^hint_starfish/, ['starfish', 'icon_hint']],
  [/^hint_rhyme/, ['hat', 'icon_hint']],
  [/^hint_sequence/, ['seed', 'water', 'flower']],
  [/^sticker_/, ['star', 'sparkle0']]
];

export const isGlyph = (g: string) => g.startsWith('#') || g in ITEM || g in UI;

/** Pictures for a narration key. Never empty: unknown keys get a friendly heart. */
export function glyphsFor(key: string): string[] {
  if (LINE_GLYPHS[key]) return LINE_GLYPHS[key];
  for (const [re, g] of BY_PREFIX) if (re.test(key)) return g;
  const w = key.match(/^word_(.+)$/)?.[1];
  if (w) {
    const base = w.replace(/_\d+$/, ''); // word_carrot_2 -> carrot, word_starfish_3 -> starfish
    if (w in ITEM) return [w];
    if (base in ITEM) return [base];
    if (`${base}_top` in ITEM) return [`${base}_top`];
  }
  return ['heart'];
}

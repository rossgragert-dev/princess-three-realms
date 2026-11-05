import type { NarrationClip, Speaker } from './narrationManifest';

export type NarrationScene = 'courtyard' | 'woods' | 'shore' | 'grotto' | 'bedroom' | 'anywhere';
export const SCENE_ORDER: NarrationScene[] = ['courtyard', 'woods', 'shore', 'grotto', 'bedroom', 'anywhere'];

/** First matching rule wins. Used only for organising the recording script, never at runtime. */
const RULES: [RegExp, NarrationScene][] = [
  [/^(word_carrot_|hint_carrots_|success_carrots|obj_pip|pip_|wand_lit|garden_sequence|word_(seed|water|flower)$|hint_sequence_|success_garden_grow)/, 'courtyard'],
  [/^(tree_|hint_tree_|success_tree_sound|obj_tree|word_(ball|cat|sun)$|willa_intro|bramble_|word_tile_|hint_pattern_|success_bridge_pattern|bridge_bloom_prompt|need_unicorn|obj_bridge|bloom_cheer|transform_unicorn|chest_found)/, 'woods'],
  [/^(shore_intro|obj_lake|transform_mermaid|form_wrong_terrain)/, 'shore'],
  [/^(marina_|word_starfish_|hint_starfish_|success_starfish|obj_marina|pearl_|obj_star|star_found|shell_rhyme_cat|word_(hat|fish)$|hint_rhyme_|success_shell_rhyme)/, 'grotto'],
  [/^(nana_return|decor_tutorial|lamp_placed|chapter_done|obj_home)/, 'bedroom']
];

export function sceneOfClip(c: Pick<NarrationClip, 'key'>): NarrationScene {
  for (const [re, scene] of RULES) if (re.test(c.key)) return scene;
  return 'anywhere'; // intro, controls, replay prompts, stickers, generic hints
}

/** Voice casting notes. Generic synthetic or parent voices only: never imitate a real person or a known character voice. */
export const VOICE_CAST: Record<Speaker, { role: string; voice: string }> = {
  narrator: { role: 'Storyteller', voice: 'Warm, calm, unhurried grown-up voice; bedtime-story pace.' },
  pip: { role: 'Pip the bunny', voice: 'Bright, bouncy and a little squeaky; quick and eager.' },
  willa: { role: 'Willa the woodland fairy', voice: 'Light, gentle and musical; slightly higher pitch.' },
  tree: { role: 'The Talking Tree', voice: 'Slow, deep, kindly and rumbly; long vowels.' },
  bramble: { role: 'Bramble the squirrel', voice: 'Quick, cheerful and chatty; mid-high pitch.' },
  marina: { role: 'Marina the sea turtle', voice: 'Soft, slow and wise; watery calm.' },
  nana: { role: 'Nana Bluebird', voice: 'Cozy, loving grandmother tone; slightly warbly.' },
  shell: { role: 'The Singing Shell', voice: 'Playful sing-song; gentle echo is fine.' },
  coralie: { role: 'Coralie the seahorse', voice: 'Sweet and bubbly; medium-high pitch.' },
  king: { role: 'The King', voice: 'Warm, jolly and booming but gentle; a proud-parent tone.' },
  queen: { role: 'The Queen', voice: 'Calm, kind and graceful; a soft storyteller tone.' },
  dapple: { role: 'Dapple the unicorn', voice: 'Playful and giggly; quick and friendly.' }
};

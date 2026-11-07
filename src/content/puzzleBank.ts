import type { PuzzleDef } from '../types/game';

const c = (id: string, picture = id) => ({ id, picture, narrationKey: `word_${id}` });

/** Curated, validated puzzles. Pictures only; every prompt/hint has a narration key. */
export const PUZZLES: PuzzleDef[] = [
  {
    id: 'carrots',
    type: 'count',
    realm: 'sunlit',
    narrationKey: 'pip_count_carrots',
    promptVisual: 'carrot',
    difficultyTier: 1,
    mandatory: true,
    choices: [c('carrot_1', 'carrot'), c('carrot_2', 'carrot'), c('carrot_3', 'carrot')],
    correctAnswer: 3,
    hintKeys: ['hint_carrots_1', 'hint_carrots_2', 'hint_together'],
    successEvent: 'PIP_CARROTS_DONE',
    replayAllowed: true,
    reward: { sticker: 'sticker_pip', decor: 'bunny_pillow' }
  },
  {
    id: 'tree_sound',
    type: 'sound-picture',
    realm: 'wilds',
    narrationKey: 'tree_sound_b',
    promptVisual: 'icon_tree',
    letter: 'B',
    difficultyTier: 1,
    mandatory: true,
    // Answer is the id, never the position. The engine shuffles display order.
    choices: [c('ball'), c('cat'), c('sun')],
    correctAnswer: 'ball',
    hintKeys: ['hint_tree_1', 'hint_tree_2', 'hint_together'],
    successEvent: 'TREE_GATE_OPEN',
    replayAllowed: true,
    reward: null
  },
  {
    id: 'bridge_pattern',
    type: 'pattern',
    realm: 'wilds',
    narrationKey: 'bramble_pattern',
    promptVisual: 'icon_rainbow',
    difficultyTier: 1,
    mandatory: true,
    // Red, blue, red, blue ... child fills the last two slots.
    choices: [c('tile_red'), c('tile_blue')],
    correctAnswer: ['tile_red', 'tile_blue'],
    hintKeys: ['hint_pattern_1', 'hint_pattern_2', 'hint_together'],
    successEvent: 'RAINBOW_BRIDGE_OPEN',
    replayAllowed: true,
    reward: { sticker: 'sticker_rainbow', decor: 'unicorn_plush' }
  },
  {
    id: 'starfish',
    type: 'count',
    realm: 'seas',
    narrationKey: 'marina_find_starfish',
    promptVisual: 'starfish',
    difficultyTier: 1,
    mandatory: true,
    choices: [c('starfish_1', 'starfish'), c('starfish_2', 'starfish'), c('starfish_3', 'starfish')],
    correctAnswer: 3,
    hintKeys: ['hint_starfish_1', 'hint_starfish_2', 'hint_together'],
    successEvent: 'MARINA_HELPED',
    replayAllowed: true,
    reward: { sticker: 'sticker_marina', decor: 'shell_mirror' }
  },
  {
    id: 'shell_rhyme',
    type: 'matching',
    realm: 'seas',
    narrationKey: 'shell_rhyme_cat',
    promptVisual: 'cat',
    difficultyTier: 1,
    mandatory: false,
    choices: [c('hat'), c('fish')],
    correctAnswer: 'hat',
    hintKeys: ['hint_rhyme_1', 'hint_rhyme_2', 'hint_together'],
    successEvent: 'SHELLS_MATCHED',
    replayAllowed: true,
    reward: { decor: 'rainbow_rug' }
  },
  {
    id: 'garden_grow',
    type: 'sequence',
    realm: 'sunlit',
    narrationKey: 'garden_sequence',
    promptVisual: 'seed',
    difficultyTier: 1,
    mandatory: false,
    choices: [c('seed'), c('water'), c('flower')],
    correctAnswer: ['seed', 'water', 'flower'],
    hintKeys: ['hint_sequence_1', 'hint_sequence_2', 'hint_together'],
    successEvent: 'GARDEN_SEQUENCED',
    replayAllowed: true,
    reward: { decor: 'flower_pot' }
  }
];

const kp = (id: string, o: Partial<PuzzleDef> & Pick<PuzzleDef, 'type' | 'narrationKey' | 'promptVisual' | 'choices' | 'correctAnswer' | 'hintKeys' | 'successEvent'>): PuzzleDef =>
  ({ id, realm: 'wilds', difficultyTier: 1, mandatory: false, replayAllowed: true, reward: null, ...o });

/** v0.4c: replayable early-learning activities of the Enchanted Woods and the Garden. Pictures only; replay after success. */
export const KINGDOM_PUZZLES: PuzzleDef[] = [
  kp('sound_s', { type: 'sound-picture', narrationKey: 'atree_sound_s', promptVisual: 'icon_tree', letter: 'S', choices: [c('sun'), c('ball'), c('hat')], correctAnswer: 'sun', hintKeys: ['hint_atree_s_1', 'hint_atree_s_2', 'hint_together'], successEvent: 'TREES_HEARD' }),
  kp('sound_c', { type: 'sound-picture', narrationKey: 'atree_sound_c', promptVisual: 'icon_tree', letter: 'C', choices: [c('cat'), c('sun'), c('fish')], correctAnswer: 'cat', hintKeys: ['hint_atree_c_1', 'hint_atree_c_2', 'hint_together'], successEvent: 'TREES_HEARD' }),
  kp('sound_f', { type: 'sound-picture', narrationKey: 'atree_sound_f', promptVisual: 'icon_tree', letter: 'F', choices: [c('fish'), c('ball'), c('hat')], correctAnswer: 'fish', hintKeys: ['hint_atree_f_1', 'hint_atree_f_2', 'hint_together'], successEvent: 'TREES_HEARD' }),
  kp('rhyme_cat', { type: 'matching', narrationKey: 'shell_rhyme_cat', promptVisual: 'cat', choices: [c('hat'), c('fish')], correctAnswer: 'hat', hintKeys: ['hint_rhyme_1', 'hint_rhyme_2', 'hint_together'], successEvent: 'RHYME_BRIDGE' }),
  kp('rhyme_bee', { type: 'matching', narrationKey: 'bridge_rhyme_bee', promptVisual: 'px_bee', choices: [c('tree', 'px_treepic'), c('sun')], correctAnswer: 'tree', hintKeys: ['hint_bee_1', 'hint_bee_2', 'hint_together'], successEvent: 'RHYME_BRIDGE' }),
  kp('rhyme_frog', { type: 'matching', narrationKey: 'bridge_rhyme_frog', promptVisual: 'px_frog', choices: [c('log', 'px_log'), c('ball')], correctAnswer: 'log', hintKeys: ['hint_frog_1', 'hint_frog_2', 'hint_together'], successEvent: 'RHYME_BRIDGE' }),
  kp('story_egg', { type: 'sequence', narrationKey: 'story_egg', promptVisual: 'px_egg', choices: [c('egg', 'px_egg'), c('chick', 'px_chick'), c('hen', 'px_hen')], correctAnswer: ['egg', 'chick', 'hen'], hintKeys: ['hint_story_1', 'hint_story_2', 'hint_together'], successEvent: 'STUMP_STORY' }),
  kp('story_day', { type: 'sequence', narrationKey: 'story_day', promptVisual: 'star', choices: [c('star'), c('sun'), c('flower')], correctAnswer: ['star', 'sun', 'flower'], hintKeys: ['hint_day_1', 'hint_day_2', 'hint_together'], successEvent: 'STUMP_STORY' }),
  kp('ladybugs', { type: 'count', realm: 'sunlit', narrationKey: 'ladybug_count', promptVisual: 'px_ladybug', choices: [c('ladybug_1', 'px_ladybug'), c('ladybug_2', 'px_ladybug'), c('ladybug_3', 'px_ladybug')], correctAnswer: 3, hintKeys: ['hint_ladybug_1', 'hint_ladybug_2', 'hint_together'], successEvent: 'GARDEN_COUNTED' })
];
PUZZLES.push(...KINGDOM_PUZZLES);

/** v0.4d.6: Pebble the crab (Moat Depths) and Inky the octopus (Coral Gardens). Pictures only, replayable. */
export const MOAT_PUZZLES: PuzzleDef[] = [
  kp('crab_sound_c', { realm: 'seas', type: 'sound-picture', narrationKey: 'crab_sound_c', promptVisual: 'px_crab', letter: 'C', choices: [c('cat'), c('sun'), c('ball')], correctAnswer: 'cat', hintKeys: ['hint_atree_c_1', 'hint_atree_c_2', 'hint_together'], successEvent: 'MOAT_CRAB' }),
  kp('crab_rhyme_hat', { realm: 'seas', type: 'matching', narrationKey: 'crab_rhyme_hat', promptVisual: 'hat', choices: [c('cat'), c('sun')], correctAnswer: 'cat', hintKeys: ['hint_crab_rhyme_1', 'hint_crab_rhyme_2', 'hint_together'], successEvent: 'MOAT_CRAB' }),
  kp('inky_pattern', { realm: 'seas', type: 'pattern', narrationKey: 'inky_pattern', promptVisual: 'px_octopus', prefix: ['tile_blue', 'tile_red', 'tile_blue', 'tile_red'], choices: [c('tile_red'), c('tile_blue')], correctAnswer: ['tile_blue', 'tile_red'], hintKeys: ['hint_inky_p1', 'hint_inky_p2', 'hint_together'], successEvent: 'CORAL_OCTO' }),
  kp('inky_sequence', { realm: 'seas', type: 'sequence', narrationKey: 'inky_sequence', promptVisual: 'px_octopus', choices: [c('star'), c('fish'), c('shell', 'px_shell')], correctAnswer: ['star', 'fish', 'shell'], hintKeys: ['hint_inky_s1', 'hint_inky_s2', 'hint_together'], successEvent: 'CORAL_OCTO' })
];
PUZZLES.push(...MOAT_PUZZLES);

export const puzzleById = (id: string) => PUZZLES.find((p) => p.id === id);

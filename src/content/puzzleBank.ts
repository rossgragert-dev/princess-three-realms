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
    reward: { sticker: 'sticker_pip' }
  },
  {
    id: 'tree_sound',
    type: 'sound-picture',
    realm: 'wilds',
    narrationKey: 'tree_sound_b',
    promptVisual: 'icon_tree',
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
    reward: { sticker: 'sticker_rainbow' }
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
    reward: { sticker: 'sticker_marina', decor: 'shell_mobile' }
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
    reward: { decor: 'rug' }
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
    reward: { decor: 'vase' }
  }
];

export const puzzleById = (id: string) => PUZZLES.find((p) => p.id === id);

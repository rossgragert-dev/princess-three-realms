import type { PlacedItem } from '../content/furniture';
import type { RoomTheme } from '../content/roomThemes';
import type { PrincessAppearance, WardrobeState } from '../content/appearance';
import type { Activities, EquippedWand } from '../content/family';
import type { Kingdom } from '../content/kingdom';

export type Form = 'princess' | 'unicorn' | 'mermaid';
export type SceneId = 'courtyard' | 'woods' | 'shore' | 'grotto' | 'bedroom' | 'festival' | 'conservatory' | 'meadow' | 'enchanted' | 'garden' | 'river';

export type QuestFlag =
  | 'INTRO_DONE'
  | 'PIP_CARROTS_DONE'
  | 'TREE_GATE_OPEN'
  | 'WILLA_MET'
  | 'RAINBOW_BRIDGE_OPEN'
  | 'MARINA_HELPED'
  | 'STAR_1_FOUND'
  | 'LAMP_PLACED'
  | 'SHELLS_MATCHED'
  | 'GARDEN_SEQUENCED'
  | 'PEARL_PLACED'
  | 'WAND_LIT'
  | 'CREEK_CHEST'
  | 'SHORE_SEEN'
  | 'GROTTO_SEEN'
  | 'BUTTERFLY_FOUND'
  | 'SHORE_CHEST'
  | 'GROTTO_CHEST'
  | 'FAIRY_DUST_FOUND'
  | 'MOONSTONE_FOUND'
  // v0.4c: The Kingdom Beyond
  | 'KINGDOM_TOLD'
  | 'WOODS_SEEN'
  | 'TREES_HEARD'
  | 'RHYME_BRIDGE'
  | 'LANTERNS_LIT'
  | 'STUMP_STORY'
  | 'WOODS_TREASURE'
  | 'GARDEN_SEEN'
  | 'GARDEN_GROWN'
  | 'BUTTERFLIES_GUIDED'
  | 'GARDEN_COUNTED'
  | 'FOUNTAIN_RESTORED'
  | 'GARDEN_TREASURE'
  | 'RIVER_SEEN'
  | 'RIVER_FRIENDLY'
  | 'RIVER_STAR'
  | 'RIVER_PEARLS'
  | 'RIVER_TREASURE'
  | 'WOODS_SECRET'
  | 'GARDEN_SECRET'
  | 'RIVER_SECRET';

export type PuzzleType = 'count' | 'sound-picture' | 'pattern' | 'matching' | 'sequence';

export interface PuzzleChoice {
  id: string;
  /** Sprite key / picture shown to the child. Never text. */
  picture: string;
  /** Narration key that speaks this picture's word when tapped. */
  narrationKey: string;
}

export interface PuzzleDef {
  id: string;
  type: PuzzleType;
  realm: 'sunlit' | 'wilds' | 'seas';
  narrationKey: string;
  promptVisual: string;
  /** Letter puzzles: the big target letter card shown to the child (e.g. 'B'). */
  letter?: string;
  difficultyTier: 1 | 2 | 3;
  mandatory: boolean;
  choices: PuzzleChoice[];
  /** Choice id for single-answer; ordered ids for pattern/sequence; count target for count. */
  correctAnswer: string | string[] | number;
  hintKeys: string[];
  successEvent: QuestFlag;
  replayAllowed: true;
  reward: { sticker?: string; decor?: string; star?: boolean } | null;
}

export interface PuzzleProgress {
  attempts: number;
  hintLevel: number; // 0..3, the hint ladder rung currently offered
  solved: boolean;
  assisted: boolean;
}

export interface GameState {
  version: 1;
  scene: SceneId;
  spawn: string;
  form: Form;
  /** Last safe tile in the scene; validated on load. */
  tile?: { x: number; y: number };
  flags: Partial<Record<QuestFlag, boolean>>;
  stars: number;
  stickers: string[];
  unlockedDecor: string[];
  /** Legacy v0.1-v0.4a hotspot layout (slotId -> decorId). Read once to migrate; always {} afterwards. */
  bedroom: Record<string, string>;
  /** v0.4a.1: free-placed furniture instances. The only layout the game uses. */
  bedroomLayout: PlacedItem[];
  /** v0.3: what the princess is wearing right now (separate from what she owns). */
  appearance: PrincessAppearance;
  /** v0.3: earned wearables. */
  wardrobe: WardrobeState;
  /** v0.4a: wallpaper + floor of the bedroom (cosmetic). */
  roomTheme: RoomTheme;
  /** v0.4b: the wand she carries (what is equipped is separate from what is unlocked). */
  equippedWand: EquippedWand;
  /** v0.4b: stable ids like 'head:moon', 'color:gold', 'trail:petal'. Only ever grows. */
  unlockedWand: string[];
  /** v0.4b: optional-activity progress (fireworks, wand workshop, unicorn tag). Never gates Chapter 1. */
  activities: Activities;
  /** v0.4c: garden plots, revealed secret paths and race records. Always sanitized on load. */
  kingdom: Kingdom;
  puzzles: Record<string, PuzzleProgress>;
  settings: {
    musicVolume: number;
    voiceVolume: number;
    sfxVolume: number;
    /** Spoken narration is optional. Off by default: the child flow is picture-first and never needs sound. */
    narration: boolean;
    captions: boolean;
    reducedEffects: boolean;
    /** Always on since v0.4a; kept in the save for compatibility. */
    dpad: boolean;
  };
}

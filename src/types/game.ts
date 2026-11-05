import type { RoomTheme } from '../content/roomThemes';
import type { PrincessAppearance, WardrobeState } from '../content/appearance';

export type Form = 'princess' | 'unicorn' | 'mermaid';
export type SceneId = 'courtyard' | 'woods' | 'shore' | 'grotto' | 'bedroom';

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
  | 'MOONSTONE_FOUND';

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
  /** slotId -> decorId */
  bedroom: Record<string, string>;
  /** v0.3: what the princess is wearing right now (separate from what she owns). */
  appearance: PrincessAppearance;
  /** v0.3: earned wearables. */
  wardrobe: WardrobeState;
  /** v0.4a: wallpaper + floor of the bedroom (cosmetic). */
  roomTheme: RoomTheme;
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

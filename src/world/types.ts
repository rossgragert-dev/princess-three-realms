import type { QuestFlag, SceneId } from '../types/game';
import type { TileName } from '../content/frameIndex';

export interface Tile {
  x: number;
  y: number;
}

export interface SpriteRef {
  /** Phaser texture key (see public/assets/manifest.json). */
  key: string;
  frame?: number;
  anim?: string;
  scale?: number;
}

/** Decorative sprite anchored at the bottom-centre of tile (x, y). */
export interface PropDef {
  key: string;
  frame?: number;
  anim?: string;
  x: number;
  y: number;
  /** Tile offsets (relative to x,y) that this prop blocks. */
  blocks?: [number, number][];
  /** Frame to show once a quest flag is set (e.g. lit lamp, bright rainbow ribbon). */
  flagFrame?: { flag: QuestFlag; frame: number };
  /** Only drawn once this flag is set. */
  showWhen?: QuestFlag;
  /** Pixel offset from the tile centre (use 8 for sprites 2 tiles wide). */
  ox?: number;
  /** Extra depth bias so overlays sit above the ground but below the player when needed. */
  depthBias?: number;
}

export type ObjKind = 'npc' | 'warp' | 'collect' | 'ability' | 'puzzle' | 'slot' | 'portal' | 'chest' | 'find';

export interface ObjDef {
  id: string;
  kind: ObjKind;
  x: number;
  y: number;
  /** Warp trigger tiles. Walking onto any of them changes scene. */
  tiles?: Tile[];
  sprite?: SpriteRef;
  /** How close (in tiles) the player must be to interact. Default 1.6. */
  radius?: number;
  to?: { scene: SceneId; spawn: string };
  /** Occupies its own tile (NPCs, pedestals). */
  blocks?: boolean;
  /** Only present while this flag is NOT set / IS set. */
  hideWhen?: QuestFlag;
  showWhen?: QuestFlag;
  /** Warps and portals only open for these forms (undefined = any). */
  forms?: ('princess' | 'unicorn' | 'mermaid')[];
  /** Chests: sticker id awarded once. */
  reward?: string;
}

export interface Gate {
  id: string;
  flag: QuestFlag;
  tiles: Tile[];
  /** Ground tile shown while closed / open (optional; used by the rainbow bridge). */
  closedTile?: TileName;
  openTile?: TileName;
}

export interface MapDef {
  id: SceneId;
  w: number;
  h: number;
  medium: 'air' | 'water';
  mermaidAllowed: boolean;
  bg: string;
  ground: TileName[][];
  props: PropDef[];
  objects: ObjDef[];
  gates: Gate[];
  spawns: Record<string, Tile>;
  /** Which music loop plays here. */
  music: 'sunlit' | 'wilds' | 'seas';
}

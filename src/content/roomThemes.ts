import type { TileName } from './frameIndex';

/**
 * v0.4a bedroom look: wallpaper + floor. Purely cosmetic: they only change which tile PICTURE is drawn,
 * never which tiles can be walked on. Pure data + functions (unit tested).
 */
export interface WallDef { id: string; name: string; paper: TileName; skirt: TileName }
export interface FloorDef { id: string; name: string; a: TileName; b: TileName }

export const WALLS: WallDef[] = [
  { id: 'pink', name: 'Pink stripes', paper: 'wall_paper', skirt: 'baseboard' },
  { id: 'lavender', name: 'Lavender', paper: 'wall_lavender', skirt: 'base_lavender' },
  { id: 'mint', name: 'Mint leaves', paper: 'wall_mint', skirt: 'base_mint' },
  { id: 'sky', name: 'Sky and clouds', paper: 'wall_sky', skirt: 'base_sky' },
  { id: 'cream', name: 'Cream', paper: 'wall_cream', skirt: 'base_cream' },
  { id: 'floral', name: 'Little flowers', paper: 'wall_floral', skirt: 'base_floral' },
  { id: 'starry', name: 'Starry purple', paper: 'wall_starry', skirt: 'base_starry' },
  { id: 'rainbow', name: 'Rainbow stripes', paper: 'wall_rainbow', skirt: 'base_rainbow' }
];

export const FLOORS: FloorDef[] = [
  { id: 'light_wood', name: 'Light wood', a: 'wood_floor0', b: 'wood_floor1' },
  { id: 'dark_wood', name: 'Dark wood', a: 'floor_dark_wood0', b: 'floor_dark_wood1' },
  { id: 'cream_tile', name: 'Cream tiles', a: 'floor_cream_tile0', b: 'floor_cream_tile1' },
  { id: 'pastel_tile', name: 'Pastel tiles', a: 'floor_pastel_tile0', b: 'floor_pastel_tile1' },
  { id: 'patterned_carpet', name: 'Patterned carpet', a: 'floor_patterned_carpet0', b: 'floor_patterned_carpet1' },
  { id: 'royal_rug', name: 'Royal rug floor', a: 'floor_royal_rug0', b: 'floor_royal_rug1' }
];

export interface RoomTheme { wallId: string; floorId: string }
export const defaultRoomTheme = (): RoomTheme => ({ wallId: 'pink', floorId: 'light_wood' });

export const wallOf = (id: string): WallDef => WALLS.find((w) => w.id === id) ?? WALLS[0];
export const floorOf = (id: string): FloorDef => FLOORS.find((f) => f.id === id) ?? FLOORS[0];

/** Never throws: unknown / missing ids (old saves, corrupt data) fall back to the original pink + light wood room. */
export function sanitizeRoomTheme(raw: unknown): RoomTheme {
  const d = defaultRoomTheme();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<RoomTheme>;
  return {
    wallId: typeof r.wallId === 'string' && WALLS.some((w) => w.id === r.wallId) ? r.wallId : d.wallId,
    floorId: typeof r.floorId === 'string' && FLOORS.some((f) => f.id === r.floorId) ? r.floorId : d.floorId
  };
}

/** The tile picture to draw for a bedroom ground tile under a theme. Only the four decorative base tiles change. */
export function themedTile(name: TileName, theme: RoomTheme): TileName {
  switch (name) {
    case 'wall_paper': return wallOf(theme.wallId).paper;
    case 'baseboard': return wallOf(theme.wallId).skirt;
    case 'wood_floor0': return floorOf(theme.floorId).a;
    case 'wood_floor1': return floorOf(theme.floorId).b;
    default: return name;
  }
}

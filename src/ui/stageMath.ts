/** Pure responsive-display math (no Phaser import, so it is unit tested). See stage.ts for the scene helpers. */
export const STAGE_W = 512;
export const STAGE_H = 384;
/** Big enough to cover any plausible screen from the stage origin. */
export const HUGE = 6000;

export type StageAnchor = 'center' | 'top' | 'bottom';

export interface Size { w: number; h: number }
export interface Offset { x: number; y: number }

/** Pure: where the 512x384 stage sits inside a game of the given size. */
export function stageOffset(w: number, h: number, anchor: StageAnchor = 'center'): Offset {
  const x = Math.max(0, Math.floor((w - STAGE_W) / 2));
  const spare = Math.max(0, h - STAGE_H);
  const y = anchor === 'top' ? 0 : anchor === 'bottom' ? spare : Math.floor(spare / 2);
  return { x, y };
}

/**
 * Pure: the game size EXPAND picks for a viewport (the base 512x384 is the minimum visible area; the other axis grows).
 * `maxAspect` keeps absurdly wide windows from showing a huge world; extra width beyond it becomes letterbox.
 */
export function expandedSize(vw: number, vh: number, maxAspect = 2.4): Size {
  const aspect = Math.min(vw / Math.max(1, vh), maxAspect);
  const base = STAGE_W / STAGE_H;
  if (aspect >= base) return { w: Math.round(STAGE_H * aspect), h: STAGE_H };
  return { w: STAGE_W, h: Math.round(STAGE_W / aspect) };
}


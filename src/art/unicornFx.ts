// v0.4b.3: unicorn flower trail and horn-magic art, drawn at runtime (crisp pixels, no asset files).
import Phaser from 'phaser';
import { FLOWER_COLORS } from '../world/trail';

type Dir = 'down' | 'up' | 'left' | 'right';
/** Horn tip relative to the unicorn sprite anchor, for each of the four facings (measured from the real sprites). */
const HORN: Record<Dir, { x: number; y: number }> = { right: { x: 9, y: -26 }, left: { x: -10, y: -26 }, up: { x: 1, y: -29 }, down: { x: 1, y: -28 } };
export const hornOffset = (d: Dir) => HORN[d];

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

export function flowerKey(i: number) { return `trail_flower_${i % FLOWER_COLORS.length}`; }

/** Five little pixel flowers (pink, yellow, lavender, blue, white) with a golden heart. */
export function ensureTrailTextures(scene: Phaser.Scene) {
  FLOWER_COLORS.forEach((col, i) => {
    const key = flowerKey(i);
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, 9, 9)!, c = tex.getContext();
    const px = (x: number, y: number, w: number, h: number, f: string) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
    const p = hex(col), edge = col === 0xffffff ? '#d7c7f2' : hex(Phaser.Display.Color.ValueToColor(col).darken(22).color);
    px(3, 0, 3, 3, p); px(3, 6, 3, 3, p); px(0, 3, 3, 3, p); px(6, 3, 3, 3, p); px(2, 2, 5, 5, p);
    px(3, 0, 3, 1, edge); px(3, 8, 3, 1, edge); px(0, 3, 1, 3, edge); px(8, 3, 1, 3, edge);
    px(3, 3, 3, 3, '#ffe27a'); px(4, 4, 1, 1, '#fff6c8');
    tex.refresh();
  });
  if (!scene.textures.exists('horn_spark')) {
    const tex = scene.textures.createCanvas('horn_spark', 7, 7)!, c = tex.getContext();
    c.fillStyle = '#ffffff'; c.fillRect(3, 0, 1, 7); c.fillRect(0, 3, 7, 1); c.fillStyle = '#ffe6fb'; c.fillRect(2, 2, 3, 3); c.fillStyle = '#ffffff'; c.fillRect(3, 3, 1, 1);
    tex.refresh();
  }
}

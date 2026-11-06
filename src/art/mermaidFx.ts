// v0.4b.3: the mermaid's underwater wand and bubble projectile, drawn at runtime (crisp pixels, no extra asset files).
import Phaser from 'phaser';
import { WAND_TINT, type WandColor } from '../content/family';

type Dir = 'down' | 'up' | 'left' | 'right';
export interface WandPose { hx: number; hy: number; angle: number; flipY: boolean; front: boolean; len: number }

/** Hand position (relative to her sprite anchor), pointing angle and layering for each facing: readable in all four. */
const POSES: Record<Dir, WandPose> = {
  right: { hx: 5, hy: -9, angle: -25, flipY: false, front: true, len: 17 },
  left: { hx: -5, hy: -9, angle: 205, flipY: true, front: true, len: 17 },
  down: { hx: 8, hy: -7, angle: 50, flipY: false, front: true, len: 16 },
  up: { hx: 7, hy: -12, angle: -65, flipY: false, front: false, len: 16 }
};
export const wandPose = (d: Dir): WandPose => POSES[d];

const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');

/** The wand: a gold-banded driftwood stick, a little shell fan and a glowing pearl in the equipped colour. */
export function ensureMermaidTextures(scene: Phaser.Scene, color: WandColor) {
  const key = `mer_wand_${color}`;
  if (scene.textures.exists(key)) return;
  const accent = hex(WAND_TINT[color][0]);
  const tex = scene.textures.createCanvas(key, 24, 10)!, c = tex.getContext();
  c.imageSmoothingEnabled = false;
  const px = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  px(1, 4, 12, 2, '#8a5a2e'); px(1, 4, 12, 1, '#b57d44');          // stick
  px(4, 4, 1, 2, '#ffd34d'); px(8, 4, 1, 2, '#ffd34d');             // gold bands
  px(12, 2, 2, 6, '#ffd8ea'); px(13, 1, 1, 8, '#f6b5d3');           // shell fan
  px(14, 3, 6, 4, accent); px(15, 2, 4, 6, accent); px(16, 1, 2, 8, accent); // glow halo
  px(15, 3, 4, 4, '#fff8ff'); px(16, 2, 2, 6, '#fff8ff');           // pearl
  px(16, 3, 1, 1, '#ffffff');
  tex.refresh();
}

/** A bubble: pearly centre, soft coloured outline. One small texture per wand colour. */
export function bubbleTexture(scene: Phaser.Scene, color: number): string {
  const key = `mer_bubble_${color.toString(16)}`;
  if (scene.textures.exists(key)) return key;
  const n = 16, tex = scene.textures.createCanvas(key, n, n)!, c = tex.getContext();
  const col = hex(color);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d > 7.6) continue;
    if (d > 6) c.fillStyle = col;                        // outline
    else if (d > 4.2) { c.fillStyle = 'rgba(210,245,255,0.55)'; } // clear water film
    else c.fillStyle = d < 2 ? '#fff8ff' : '#f3e6ff';    // pearl
    c.fillRect(x, y, 1, 1);
  }
  c.fillStyle = '#ffffff'; c.fillRect(4, 4, 2, 2);
  tex.refresh();
  return key;
}

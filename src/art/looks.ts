import Phaser from 'phaser';
import { ATLAS, OW_STYLES } from '../content/wardrobeIndex';
import { buildRemap, composePrincess, owCrownSheet, owHairSheet, remapSheet, THUMB_CROP, type AtlasKey, type AtlasPixels } from './compose';
import { defaultAppearance, FIELD, type AppearanceSlot, type PrincessAppearance } from '../content/appearance';

/** Texture keys of the live (recoloured) overworld sprites. Their pixels are rewritten in place, so animations never need rebuilding. */
export const PRINCESS_LOOK = 'princess_look';
export const MERMAID_LOOK = 'mermaid_look';
export const lookKey = (form: string): string => (form === 'princess' ? PRINCESS_LOOK : form === 'mermaid' ? MERMAID_LOOK : form);

interface Pixels { data: Uint8ClampedArray; width: number; height: number }
const pixelCache = new Map<string, Pixels>();

/** RGBA pixels of a loaded texture (cached: source art never changes). */
export function pixelsOf(scene: Phaser.Scene, key: string): Pixels {
  let p = pixelCache.get(key);
  if (p) return p;
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  const id = ctx.getImageData(0, 0, c.width, c.height);
  p = { data: id.data, width: c.width, height: c.height };
  pixelCache.set(key, p);
  return p;
}

export const atlasOf = (scene: Phaser.Scene, key: AtlasKey): AtlasPixels => ({ key, ...pixelsOf(scene, key) });

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number): Phaser.Textures.CanvasTexture {
  const ex = scene.textures.exists(key) ? scene.textures.get(key) : null;
  if (ex) return ex as Phaser.Textures.CanvasTexture;
  return scene.textures.createCanvas(key, w, h)!;
}

export function putPixels(tex: Phaser.Textures.CanvasTexture, data: Uint8ClampedArray, w: number, h: number) {
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}

/** Create the two live overworld textures with the same frame layout as the original sheets (rows: down, up, left, right). */
export function initLooks(scene: Phaser.Scene) {
  const spec: [string, number, number, number][] = [[PRINCESS_LOOK, 24, 32, 8], [MERMAID_LOOK, 32, 32, 8]];
  for (const [key, fw, fh, cols] of spec) {
    if (scene.textures.exists(key)) continue;
    const tex = canvasTex(scene, key, fw * cols, fh * 4);
    for (let i = 0; i < cols * 4; i++) tex.add(i, 0, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh);
  }
}

/** Rewrite the overworld princess + mermaid from the equipped look: dress colour, hair colour/style, skin tone, tiara. */
export function applyOverworldLook(scene: Phaser.Scene, app: PrincessAppearance) {
  initLooks(scene);
  const style = (OW_STYLES as readonly string[]).includes(app.hairstyleId) ? app.hairstyleId : 'long';
  const remap = buildRemap(app);
  const out = new Uint8ClampedArray(192 * 128 * 4);
  const pj = `ow_${app.dressId}_${style}`;
  remapSheet(out, pixelsOf(scene, app.dressId.startsWith('pj_') && scene.textures.exists(pj) ? pj : owHairSheet(style)).data, remap);
  const crown = owCrownSheet(app.tiaraId);
  if (crown && scene.textures.exists(crown)) remapSheet(out, pixelsOf(scene, crown).data, remap);
  putPixels(scene.textures.get(PRINCESS_LOOK) as Phaser.Textures.CanvasTexture, out, 192, 128);
  // Mermaid keeps her hair colour and skin tone (no princess dress under the sea); hairstyle stays the mermaid's flowing hair.
  const mm = new Uint8ClampedArray(256 * 128 * 4);
  remapSheet(mm, pixelsOf(scene, 'mermaid_m').data, buildRemap(app, ['hair', 'skin']));
  putPixels(scene.textures.get(MERMAID_LOOK) as Phaser.Textures.CanvasTexture, mm, 256, 128);
}

/** A big princess preview (a canvas texture) that re-composes instantly when the look changes. */
export class PrincessPreview {
  readonly key: string;
  readonly w: number;
  readonly h: number;
  private tex: Phaser.Textures.CanvasTexture;
  constructor(private scene: Phaser.Scene, private kind: 'full' | 'port', key: string) {
    const meta = ATLAS[kind === 'full' ? 'wd_full' : 'wd_port'];
    this.key = key; this.w = meta.w; this.h = meta.h;
    this.tex = canvasTex(scene, key, meta.w, meta.h);
  }
  render(app: PrincessAppearance) {
    const atlas = atlasOf(this.scene, this.kind === 'full' ? 'wd_full' : 'wd_port');
    putPixels(this.tex, composePrincess(atlas, app, this.kind), this.w, this.h);
  }
}

/** A small pool of canvas textures for option thumbnails (reused every page, so memory stays flat). */
export class ThumbPool {
  private size: number;
  private prefix: string;
  constructor(private scene: Phaser.Scene, prefix: string, size = 12) { this.size = size; this.prefix = prefix; }
  key(i: number) { return `${this.prefix}${i % this.size}`; }

  /** Draw the equipped look with `slot` swapped to `id`, cropped to the part of her that slot changes. Returns the integer scale used. */
  drawOption(i: number, app: PrincessAppearance, slot: AppearanceSlot, id: string, box: { w: number; h: number }): number {
    const crop = THUMB_CROP[slot] ?? THUMB_CROP.dress;
    const a = { ...app, [FIELD[slot]]: id };
    const atlas = atlasOf(this.scene, crop.kind === 'full' ? 'wd_full' : 'wd_port');
    const full = composePrincess(atlas, a, crop.kind);
    const meta = ATLAS[atlas.key];
    const w = crop.w * crop.k, h = crop.h * crop.k;
    const tex = canvasTex(this.scene, this.key(i), 100, 84);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 100, 84);
    const src = document.createElement('canvas'); src.width = meta.w; src.height = meta.h;
    const sctx = src.getContext('2d')!; const im = sctx.createImageData(meta.w, meta.h); im.data.set(full); sctx.putImageData(im, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const ox = Math.floor((box.w - w) / 2), oy = Math.floor((box.h - h) / 2);
    ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, ox, oy, w, h);
    tex.refresh();
    return crop.k;
  }

  /** Colour swatch (hair / dress / skin) drawn as four ramp bands inside a rounded capsule. */
  drawSwatch(i: number, ramp: readonly string[], w = 40, h = 64) {
    const tex = canvasTex(this.scene, this.key(i), 100, 84);
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 100, 84);
    const x0 = 0, y0 = 0;
    ctx.save();
    ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(x0, y0, w, h, 10); ctx.clip();
    const bands = [ramp[1], ramp[0], ramp[2], ramp[3]];
    const hs = [h * 0.42, h * 0.2, h * 0.22, h * 0.16];
    let y = y0;
    bands.forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(x0, y, w, hs[k] + 1); y += hs[k]; });
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x0 + 5, y0 + 4, 5, h * 0.5);
    ctx.restore();
    ctx.lineWidth = 3; ctx.strokeStyle = '#40255a'; ctx.beginPath(); (ctx as CanvasRenderingContext2D).roundRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3, 9); ctx.stroke();
    tex.refresh();
  }
}

export { defaultAppearance };

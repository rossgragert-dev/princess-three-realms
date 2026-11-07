// v0.4d.2: the two big creative panels — the Royal Kitchen "decorate it" table and the Royal Gallery canvas.
// Picture-only (no reading, no money, no failing). Both are drag-or-tap and always replayable.
import Phaser from 'phaser';
import { makeButton, pic, roundedPanel } from './touchTargets';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { PAINT_BG, PAINT_COLORS, PAINT_H, PAINT_W, BRUSH_SIZES, MAX_POINTS, MAX_STROKES, drawStamp, drawStrokes, type ArtStroke } from './paintStrokes';

export interface Layout { ox: number; oy: number }
export interface BakeSpec {
  base: string; baseScale: number;
  toppings: readonly string[];
  /** Scoops stack upward from the cone instead of landing anywhere on the plate. */
  stack?: boolean;
}
export interface BakeResult { placed: number }

/** Decorate a cake / cookie / pizza / ice cream. Resolves with how many things she put on, or null if she backed out. */
export function runBake(scene: Phaser.Scene, L: Layout, spec: BakeSpec): Promise<BakeResult | null> {
  return new Promise((resolve) => {
    const cx = 256 + L.ox, cy = 150 + L.oy;
    const root = scene.add.container(0, 0).setDepth(60);
    root.add(scene.add.rectangle(256 + L.ox, 192 + L.oy, 2000, 2000, 0x40255a, 0.55).setInteractive());
    root.add(roundedPanel(scene, cx - 200, cy - 118, 400, 236, 0xfff1d6, 0xf2994a, 22));
    const plate = scene.add.ellipse(cx, cy + 40, 210, 60, 0xffffff).setStrokeStyle(4, 0xd9d2e9);
    root.add(plate);
    const base = pic(scene, spec.base, cx, cy + (spec.stack ? 10 : 8), spec.baseScale);
    root.add(base);
    const placed: Phaser.GameObjects.Image[] = [];
    const radius = spec.stack ? 0 : 52 * (spec.baseScale / 3.4);
    const put = (key: string, x?: number, y?: number) => {
      if (placed.length >= 40) return;
      let px = x, py = y;
      if (spec.stack) { px = cx + Phaser.Math.Between(-3, 3); py = cy + 10 - spec.baseScale * 20 - 6 - Math.min(placed.length, 5) * 16; if (placed.length >= 5) return; }
      else if (px === undefined || py === undefined) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius; px = cx + Math.cos(a) * r; py = cy + 8 + Math.sin(a) * r * 0.8; }
      else { const dx = px - cx, dy = (py - (cy + 8)) / 0.8, d = Math.hypot(dx, dy); if (d > radius) { px = cx + (dx / d) * radius; py = cy + 8 + ((dy / d) * radius) * 0.8; } }
      const im = pic(scene, key, px, py - 30, 2.2).setScale(0.2); root.add(im); placed.push(im);
      scene.tweens.add({ targets: im, y: py, scale: 2.2, duration: dur(280), ease: 'Bounce.Out' });
      services.audio.sfx('pop');
    };
    const n = spec.toppings.length;
    spec.toppings.forEach((key, i) => {
      const x = cx + (i - (n - 1) / 2) * Math.min(56, 360 / n), y = cy + 98;
      const holder = scene.add.container(x, y); holder.add(roundedPanel(scene, -24, -24, 48, 48, 0xffffff, 0xf2994a, 12)); root.add(holder);
      const chip = pic(scene, key, x, y, 2.2).setDepth(61).setInteractive({ draggable: true, useHandCursor: true }); root.add(chip);
      let dragged = false;
      chip.on('dragstart', () => { dragged = false; chip.setDepth(66); });
      chip.on('drag', (_p: unknown, dx: number, dy: number) => { dragged = true; chip.setPosition(dx, dy); });
      chip.on('dragend', () => { if (dragged && Math.abs(chip.x - cx) < 130 && chip.y < cy + 70) put(key, chip.x, chip.y); chip.setPosition(x, y).setDepth(61); });
      chip.on('pointerup', () => { if (!dragged) put(key); dragged = false; });
    });
    const finish = (v: BakeResult | null) => { root.destroy(true); back.container.destroy(); done.container.destroy(); undo.container.destroy(); resolve(v); };
    const back = makeButton(scene, 40 + L.ox, 36 + L.oy, 'icon_back', 1.5, () => finish(null)); back.container.setDepth(62);
    const done = makeButton(scene, 472 + L.ox, 330 + L.oy, 'icon_check', 1.8, () => finish({ placed: placed.length })); done.container.setDepth(62);
    const undo = makeButton(scene, 40 + L.ox, 330 + L.oy, 'icon_undo', 1.5, () => { placed.pop()?.destroy(); }); undo.container.setDepth(62);
  });
}

/** The painting canvas. Resolves with the strokes (saved on the check button) or null if she backs out. */
export function runPaint(scene: Phaser.Scene, L: Layout, initial: readonly ArtStroke[]): Promise<ArtStroke[] | null> {
  return new Promise((resolve) => {
    const strokes: ArtStroke[] = initial.map((s) => ({ ...s, p: [...s.p] }));
    let total = strokes.reduce((a, s) => a + s.p.length / 2, 0);
    const cx = 256 + L.ox, ax = cx - PAINT_W / 2 - 24, ay = 40 + L.oy;
    const root = scene.add.container(0, 0).setDepth(60);
    root.add(scene.add.rectangle(256 + L.ox, 192 + L.oy, 2000, 2000, 0x40255a, 0.6).setInteractive());
    root.add(roundedPanel(scene, ax - 10, ay - 10, PAINT_W + 20 + 48, PAINT_H + 20, 0xe8d4a8, 0x8f5c1a, 14));
    const g = scene.add.graphics(); root.add(g);
    const x0 = ax, y0 = ay;
    g.fillStyle(PAINT_BG, 1).fillRect(x0, y0, PAINT_W, PAINT_H);
    const redraw = () => { g.clear(); g.fillStyle(PAINT_BG, 1).fillRect(x0, y0, PAINT_W, PAINT_H); drawStrokes(g, strokes, x0, y0, 1); };
    redraw();
    let color = 0, size = 1, tool = 0; // tool: 0 brush, 1 eraser, 2 star, 3 heart, 4 flower
    let cur: ArtStroke | null = null;
    const zone = scene.add.zone(x0 + PAINT_W / 2, y0 + PAINT_H / 2, PAINT_W, PAINT_H).setInteractive({ draggable: false }); root.add(zone);
    const local = (p: Phaser.Input.Pointer) => ({ x: Phaser.Math.Clamp(Math.round(p.x - x0), 0, PAINT_W), y: Phaser.Math.Clamp(Math.round(p.y - y0), 0, PAINT_H) });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (strokes.length >= MAX_STROKES || total >= MAX_POINTS) return;
      const { x, y } = local(p);
      cur = { c: color, s: size, k: tool, p: [x, y] }; strokes.push(cur); total++;
      if (tool >= 2) { drawStamp(g, tool, x0 + x, y0 + y, 10 + BRUSH_SIZES[size] * 2, PAINT_COLORS[color]); services.audio.sfx('pop'); cur = null; }
      else { g.fillStyle(tool === 1 ? PAINT_BG : PAINT_COLORS[color], 1).fillCircle(x0 + x, y0 + y, (tool === 1 ? 1.6 : 1) * BRUSH_SIZES[size]); }
    });
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!cur || !p.isDown || total >= MAX_POINTS) return;
      const { x, y } = local(p), n = cur.p.length;
      if (Math.hypot(x - cur.p[n - 2], y - cur.p[n - 1]) < 3) return;
      const px = cur.p[n - 2], py = cur.p[n - 1]; cur.p.push(x, y); total++;
      const r = (cur.k === 1 ? 1.6 : 1) * BRUSH_SIZES[cur.s], steps = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / Math.max(1, r * 0.6)));
      g.fillStyle(cur.k === 1 ? PAINT_BG : PAINT_COLORS[cur.c], 1);
      for (let j = 1; j <= steps; j++) g.fillCircle(x0 + px + ((x - px) * j) / steps, y0 + py + ((y - py) * j) / steps, r);
    });
    const end = () => { cur = null; };
    zone.on('pointerup', end); zone.on('pointerout', end);
    // palette column (right of the canvas) and tool row (below)
    const sel: Phaser.GameObjects.GameObject[] = [];
    const ring = scene.add.circle(0, 0, 13).setStrokeStyle(3, 0x3a2a5a); root.add(ring);
    PAINT_COLORS.forEach((col, i) => {
      const sx = x0 + PAINT_W + 24, sy = y0 + 14 + i * 28;
      const sw = scene.add.circle(sx, sy, 10, col).setStrokeStyle(2, 0xffffff).setInteractive({ useHandCursor: true }); root.add(sw); sel.push(sw);
      sw.on('pointerdown', () => { color = i; if (tool === 1) tool = 0; ring.setPosition(sx, sy); services.audio.sfx('pop'); });
      if (i === 0) ring.setPosition(sx, sy);
    });
    const toolRow = y0 + PAINT_H + 28 + 0, bx = x0 + 6;
    const mk = (i: number, label: () => Phaser.GameObjects.GameObject, on: () => void) => {
      const bgc = scene.add.rectangle(bx + i * 46, toolRow, 38, 38, 0xfff6e4).setStrokeStyle(2, 0x8f5c1a).setInteractive({ useHandCursor: true }); root.add(bgc);
      const o = label(); root.add(o); bgc.on('pointerdown', () => { services.audio.sfx('pop'); on(); });
    };
    const sizeDot = (i: number) => () => scene.add.circle(bx + i * 46, toolRow, 3 + i * 3, 0x3a2a5a);
    for (let i = 0; i < 3; i++) mk(i, sizeDot(i), () => { size = i; if (tool > 1) tool = 0; });
    mk(3, () => pic(scene, 'icon_none', bx + 3 * 46, toolRow, 1), () => { tool = 1; });
    const stampBtn = (i: number, kind: number) => mk(i, () => { const gg = scene.add.graphics(); drawStamp(gg, kind, bx + i * 46, toolRow, 9, 0xff5a6e); return gg; }, () => { tool = kind; });
    stampBtn(4, 2); stampBtn(5, 3); stampBtn(6, 4);
    mk(7, () => pic(scene, 'icon_undo', bx + 7 * 46, toolRow, 1), () => { const s = strokes.pop(); if (s) { total -= s.p.length / 2; redraw(); } });
    mk(8, () => pic(scene, 'icon_trash', bx + 8 * 46, toolRow, 1), () => { strokes.length = 0; total = 0; redraw(); });
    const finish = (v: ArtStroke[] | null) => { root.destroy(true); back.container.destroy(); ok.container.destroy(); resolve(v); };
    const back = makeButton(scene, 40 + L.ox, 36 + L.oy, 'icon_back', 1.5, () => finish(null)); back.container.setDepth(62);
    const ok = makeButton(scene, 472 + L.ox, 330 + L.oy, 'icon_check', 1.8, () => finish(strokes.map((s) => ({ ...s, p: [...s.p] })))); ok.container.setDepth(62);
  });
}

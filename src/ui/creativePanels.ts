// v0.4d.2: the two big creative panels — the Royal Kitchen "decorate it" table and the Royal Gallery canvas.
// Picture-only (no reading, no money, no failing). Both are drag-or-tap and always replayable.
import Phaser from 'phaser';
import { UI } from '../content/frameIndex';
import { MAX_SCOOPS, TOPPING_SCALE, place, radiusOf, spotFromOffset, toppingOffset, type FoodSpec, type Topping } from '../world/foodDesign';
import { makeButton, pic, roundedPanel } from './touchTargets';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { PAINT_BG, PAINT_COLORS, PAINT_H, PAINT_W, BRUSH_SIZES, MAX_POINTS, MAX_STROKES, drawStamp, drawStrokes, type ArtStroke } from './paintStrokes';

export interface Layout { ox: number; oy: number }
export type BakeSpec = FoodSpec;
/** Read-only handle for tests. */
export const bakeProbe: { cards: { key: string; x: number; y: number }[]; selected: string; food: { cx: number; cy: number; rx: number; stack: boolean }; count: number; hint: number } = { cards: [], selected: '', food: { cx: 0, cy: 0, rx: 0, stack: false }, count: 0, hint: 0 };

/**
 * Decorate a cake / cookie / pizza / ice cream. Tap a topping picture to select it (gold box + check), then tap a spot on the food to put it
 * exactly there; drag also works. Tapping off the food only wiggles the selected card. Resolves with the toppings when she presses the check,
 * or null if she backs out (the finished dish on the stand is then left untouched).
 */
export function runBake(scene: Phaser.Scene, L: Layout, spec: BakeSpec, initial: readonly Topping[] = []): Promise<Topping[] | null> {
  return new Promise((resolve) => {
    const cx = 256 + L.ox, cy = 150 + L.oy;
    const root = scene.add.container(0, 0).setDepth(60);
    root.add(scene.add.rectangle(256 + L.ox, 192 + L.oy, 2000, 2000, 0x40255a, 0.55).setInteractive());
    root.add(roundedPanel(scene, cx - 200, cy - 118, 400, 236, 0xfff1d6, 0xf2994a, 22));
    root.add(scene.add.ellipse(cx, cy + 40, 210, 60, 0xffffff).setStrokeStyle(4, 0xd9d2e9));
    const by = cy + (spec.stack ? 10 : 8);
    const base = pic(scene, spec.base, cx, by, spec.baseScale);
    root.add(base);
    const list: Topping[] = [];
    const imgs: Phaser.GameObjects.Image[] = [];
    const drop = (t: Topping, animate: boolean) => {
      const o = toppingOffset(spec, t, imgs.length);
      const x = cx + o.dx, y = by + o.dy;
      const im = pic(scene, t.key, x, animate ? y - 30 : y, TOPPING_SCALE);
      root.add(im); imgs.push(im);
      if (animate) { im.setScale(0.2); scene.tweens.add({ targets: im, y, scale: TOPPING_SCALE, duration: dur(280), ease: 'Bounce.Out' }); }
    };
    for (const t of initial) { list.push(t); drop(t, false); }
    bakeProbe.count = list.length;
    const add = (key: string, dx: number, dy: number): boolean => {
      const sp = spotFromOffset(spec, dx, dy);
      if (!sp) return false;
      const next = place(spec, list, key, sp.u, sp.v);
      if (!next) return false;
      const t = next[next.length - 1]; list.push(t); drop(t, true); services.audio.sfx('pop'); bakeProbe.count = list.length;
      return true;
    };
    // ---- the picture cards: the selected one gets a gold frame and a check
    let selected = spec.toppings[0];
    const holders = new Map<string, { frame: Phaser.GameObjects.Graphics; check: Phaser.GameObjects.Image; chip: Phaser.GameObjects.Image }>();
    const n = spec.toppings.length;
    const gap = Math.min(60, 372 / n);
    const sel = (key: string) => {
      selected = key; bakeProbe.selected = key;
      holders.forEach((h, k) => { h.frame.setVisible(k === key); h.check.setVisible(k === key); h.chip.setScale(k === key ? 2.6 : 2.2); });
      services.audio.sfx('pop');
    };
    const wiggle = () => { const h = holders.get(selected); if (h) scene.tweens.add({ targets: h.chip, angle: { from: -12, to: 12 }, duration: dur(90), yoyo: true, repeat: 1, onComplete: () => h.chip.setAngle(0) }); bakeProbe.hint++; };
    bakeProbe.cards = [];
    spec.toppings.forEach((key, i) => {
      const x = cx + (i - (n - 1) / 2) * gap, y = cy + 88;
      const card = scene.add.container(x, y); card.add(roundedPanel(scene, -28, -28, 56, 56, 0xffffff, 0xf2994a, 12)); root.add(card);
      const frame = scene.add.graphics().lineStyle(5, 0xffc61a, 1).strokeRoundedRect(x - 30, y - 30, 60, 60, 14).setVisible(false); root.add(frame);
      const chip = pic(scene, key, x, y, 2.2).setInteractive({ draggable: true, useHandCursor: true }); root.add(chip);
      const check = scene.add.image(x + 22, y - 22, 'ui', UI.icon_check).setScale(0.55).setVisible(false); root.add(check);
      holders.set(key, { frame, check, chip }); bakeProbe.cards.push({ key, x, y });
      let dragged = false;
      chip.on('dragstart', () => { dragged = false; sel(key); chip.setDepth(66); });
      chip.on('drag', (_p: unknown, dx: number, dy: number) => { if (Math.hypot(dx - x, dy - y) > 8) dragged = true; chip.setPosition(dx, dy); });
      chip.on('dragend', () => { if (dragged) add(key, chip.x - cx, chip.y - by); chip.setPosition(x, y).setDepth(61); });
      chip.on('pointerup', () => { if (!dragged) sel(key); dragged = false; });
    });
    sel(selected);
    // ---- tap a spot on the food
    const zw = spec.stack ? 110 : radiusOf(spec) * 2 + 20, zh = spec.stack ? spec.baseScale * 20 + 22 + MAX_SCOOPS * 16 + spec.baseScale * 20 : radiusOf(spec) * 1.6 + 20;
    const zcy = spec.stack ? by - (zh / 2 - spec.baseScale * 20) : by;
    const zone = scene.add.zone(cx, zcy, zw, zh).setInteractive(); root.add(zone);
    bakeProbe.food = { cx, cy: by, rx: radiusOf(spec), stack: !!spec.stack };
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => { if (!add(selected, p.x - cx, p.y - by)) wiggle(); });
    const finish = (v: Topping[] | null) => { root.destroy(true); back.container.destroy(); done.container.destroy(); undo.container.destroy(); bakeProbe.cards = []; resolve(v); };
    const back = makeButton(scene, 40 + L.ox, 36 + L.oy, 'icon_back', 1.5, () => finish(null)); back.container.setDepth(62);
    const done = makeButton(scene, 472 + L.ox, 330 + L.oy, 'icon_check', 1.8, () => finish(list.map((t) => ({ ...t })))); done.container.setDepth(62);
    const undo = makeButton(scene, 40 + L.ox, 330 + L.oy, 'icon_undo', 1.5, () => { if (!list.length) return; list.pop(); imgs.pop()?.destroy(); bakeProbe.count = list.length; }); undo.container.setDepth(62);
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

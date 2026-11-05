import Phaser from 'phaser';
import { ITEM, UI, type ItemName, type UiName } from '../content/frameIndex';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';

export interface Btn {
  container: Phaser.GameObjects.Container;
  setEnabled(v: boolean): void;
  setVisible(v: boolean): void;
  pulse(on: boolean): void;
  hit(x: number, y: number): boolean;
}

/** Minimum touch size in logical px (512x384 canvas; ~2x on an iPad = 112 CSS px, comfortably above 56). */
export const MIN_HIT = 60;

/** A picture-only round button. `scale` multiplies the 32px icon; the hit area is never smaller than MIN_HIT. */
export function makeButton(scene: Phaser.Scene, x: number, y: number, icon: UiName, scale: number, onTap: () => void): Btn {
  const img = scene.add.image(0, 0, 'ui', UI[icon]).setScale(scale);
  const size = Math.max(MIN_HIT, 32 * scale + 12);
  const c = scene.add.container(x, y, [img]);
  c.setSize(size, size);
  c.setInteractive({ useHandCursor: true });
  let enabled = true;
  let pulseTween: Phaser.Tweens.Tween | undefined;
  c.on('pointerdown', () => {
    if (!enabled) return;
    services.audio.sfx('pop');
    scene.tweens.add({ targets: img, scale: scale * 0.86, duration: 70, yoyo: true });
    onTap();
  });
  return {
    container: c,
    setEnabled(v) { enabled = v; img.setAlpha(v ? 1 : 0.35); },
    setVisible(v) { c.setVisible(v); c.setActive(v); if (v) c.setInteractive(); else c.disableInteractive(); },
    pulse(on) {
      pulseTween?.stop(); pulseTween = undefined; img.setScale(scale);
      if (on) pulseTween = scene.tweens.add({ targets: img, scale: scale * 1.18, duration: dur(450), yoyo: true, repeat: -1 });
    },
    hit(px, py) {
      if (!c.visible || !c.active) return false;
      return Math.abs(px - c.x) <= size / 2 && Math.abs(py - c.y) <= size / 2;
    }
  };
}

/** Draws a picture by name: `icon_*` come from the UI sheet, everything else from the items sheet. */
export function pic(scene: Phaser.Scene, name: string, x: number, y: number, scale: number): Phaser.GameObjects.Image {
  return name.startsWith('icon_')
    ? scene.add.image(x, y, 'ui', UI[name as UiName]).setScale(scale)
    : scene.add.image(x, y, 'items', ITEM[name as ItemName]).setScale(scale);
}

export function roundedPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = 0xfff6e4, stroke = 0xa06bff, r = 14): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x40255a, 0.35).fillRoundedRect(x + 3, y + 4, w, h, r);
  g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, r);
  g.lineStyle(4, stroke, 1).strokeRoundedRect(x, y, w, h, r);
  return g;
}

export const sleep = (scene: Phaser.Scene, ms: number) => new Promise<void>((res) => scene.time.delayedCall(ms, () => res()));

/** A few pretty sparkles that fade; honours the reduced-effects setting. */
export function burst(scene: Phaser.Scene, x: number, y: number, n = 10, depth = 200) {
  const count = services.save.state.settings.reducedEffects ? Math.ceil(n / 3) : n;
  for (let i = 0; i < count; i++) {
    const s = scene.add.image(x, y, 'items', ITEM.sparkle0 + (i % 4)).setDepth(depth).setScale(1 + (i % 2));
    const a = (Math.PI * 2 * i) / count;
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * (28 + (i % 3) * 10), y: y + Math.sin(a) * (24 + (i % 3) * 8), alpha: 0, duration: 650, onComplete: () => s.destroy() });
  }
}

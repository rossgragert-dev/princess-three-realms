import Phaser from 'phaser';
import {
  OPTION_EARN, WAND_COLORS, WAND_HEADS, WAND_TINT, WAND_TRAILS, hasOption, syncWandUnlocks, type EquippedWand, type WandColor, type WandHead, type WandTrail
} from '../content/family';
import { UI, type UiName } from '../content/frameIndex';
import { services } from '../systems/services';
import { dur, reducedEffects } from '../systems/accessibility';
import { burst, makeButton, roundedPanel } from '../ui/touchTargets';
import { fullBackdrop, useStage } from '../ui/stage';

type Kind = 'head' | 'color' | 'trail';
const KINDS: Kind[] = ['head', 'color', 'trail'];
const CARD = 56;       // drawn size; the touch box is the full 60 px cell
const CELL = 60;
const lastTab = { v: 0 };
const HEX = (c: WandColor) => WAND_TINT[c][0];

/**
 * The Queen's Wand Workshop: big picture swatches for the wand's head, colour and sparkle trail, with a live animated preview.
 * Every tap equips and saves right away. Locked choices show a dark shape, a padlock and a picture of how to earn them.
 * Cosmetic only: the equipped wand never changes how far or in which direction a spell travels.
 */
export class WandWorkshopScene extends Phaser.Scene {
  private tab = 0;
  private closing = false;
  private openedAt = 0;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private cards: { id: string; kind: Kind; value: string; x: number; y: number; owned: boolean; img?: Phaser.GameObjects.GameObject }[] = [];
  private tabPos: { x: number; y: number; g: Phaser.GameObjects.Graphics }[] = [];
  private btnPos: Record<string, { x: number; y: number }> = {};
  private previewObjs: Phaser.GameObjects.GameObject[] = [];
  private demo?: Phaser.Time.TimerEvent;
  private madeThisVisit = 0;
  constructor() { super('WandWorkshop'); }

  private get st() { return services.save.state; }
  private get wand(): EquippedWand { return this.st.equippedWand; }
  private get kind(): Kind { return KINDS[this.tab]; }

  create() {
    this.closing = false; this.cards = []; this.objs = []; this.tabPos = []; this.btnPos = {}; this.madeThisVisit = 0; this.previewObjs = [];
    this.openedAt = this.time.now; this.tab = lastTab.v;
    const st = this.st;
    st.activities.workshop.visits++;
    syncWandUnlocks(st);
    services.save.save();
    useStage(this);
    fullBackdrop(this, 0xffe3f1, 0xd8c8ff);
    this.add.existing(roundedPanel(this, 8, 56, 222, 320, 0x6a4fb0, 0xe2a53a).setDepth(1));
    this.add.existing(roundedPanel(this, 238, 8, 266, 368).setDepth(1));
    this.add.image(119, 316, 'wand_bench').setScale(3).setDepth(2).setAlpha(0.9);
    const back = makeButton(this, 32, 28, 'icon_back', 0.9, () => this.close());
    back.container.setDepth(30); this.btnPos.back = { x: 32, y: 28 };
    this.buildTabs();
    this.buildAccept();
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.demo?.remove();
      delete (window as unknown as { __station?: unknown }).__station;
    });
    (window as unknown as { __station?: unknown }).__station = {
      key: 'WandWorkshop', tab: () => this.kind, tabs: () => this.tabPos.map((t, i) => ({ slot: KINDS[i], x: t.x, y: t.y })),
      cards: () => this.cards.map((c) => ({ id: c.id, kind: c.kind, value: c.value, x: c.x, y: c.y, w: CELL, h: CELL, owned: c.owned, equipped: this.isEquipped(c.kind, c.value) })),
      buttons: () => ({ ...this.btnPos }), wand: () => ({ ...this.wand }), made: () => this.madeThisVisit, closing: () => this.closing,
      choose: (k: Kind, v: string) => this.choose(k, v)
    };
    this.cameras.main.fadeIn(dur(200));
    services.audio.sfx('sparkle');
  }

  // ------------------------------------------------------------------ pieces
  private isEquipped(k: Kind, v: string) { return (k === 'head' ? this.wand.headId : k === 'color' ? this.wand.colorId : this.wand.trailId) === v; }

  private buildTabs() {
    KINDS.forEach((k, i) => {
      const x = 270 + i * 72 + 24, y = 40;
      const g = this.add.graphics().setDepth(3);
      const z = this.add.zone(x, y, 66, 62).setDepth(25).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => { if (this.tab !== i) { this.tab = i; lastTab.v = i; services.audio.sfx('pop'); this.render(); } });
      this.tabPos.push({ x, y, g });
      this.btnPos[`tab:${k}`] = { x, y };
    });
  }

  private tabIcon(k: Kind, x: number, y: number): Phaser.GameObjects.GameObject {
    if (k === 'head') return this.add.image(x, y, `wand_${this.wand.headId}_${this.wand.colorId}`).setScale(1.6).setDepth(5);
    if (k === 'trail') {
      const bg = this.add.graphics().setDepth(4).fillStyle(0x4a2f8f, 1).fillCircle(x, y, 20);
      this.objs.push(bg);
      return this.add.image(x, y, `trail_${this.wand.trailId}`).setScale(3.4).setDepth(5);
    }
    const g = this.add.graphics().setDepth(5);
    if (this.wand.colorId === 'rainbow') WAND_TINT.rainbow.forEach((c, i) => g.fillStyle(c, 1).slice(x, y, 16, (Math.PI * 2 * i) / 6, (Math.PI * 2 * (i + 1)) / 6, false).fillPath());
    else g.fillStyle(HEX(this.wand.colorId), 1).fillCircle(x, y, 16);
    g.lineStyle(2, 0xffffff, 0.9).strokeCircle(x, y, 16);
    return g;
  }

  private buildAccept() {
    const x = 432, y = 350;
    const c = this.add.container(x, y).setDepth(30);
    const g = this.add.graphics();
    g.fillStyle(0x40255a, 0.35).fillRoundedRect(-62, -22, 128, 52, 26);
    g.fillStyle(0x6fdc7a, 1).fillRoundedRect(-64, -26, 128, 52, 26).lineStyle(4, 0x2b8a3e, 1).strokeRoundedRect(-64, -26, 128, 52, 26);
    const ic = this.add.image(0, 0, 'ui', UI.icon_check).setScale(1.5);
    c.add([g, ic]).setSize(128, 52).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (this.time.now - this.openedAt > 350) this.close(); });
    this.btnPos.accept = { x, y };
  }

  // ------------------------------------------------------------------ drawing
  private render() {
    this.objs.forEach((o) => o.destroy()); this.objs = []; this.cards = [];
    this.tabPos.forEach((t, i) => {
      t.g.clear();
      t.g.fillStyle(i === this.tab ? 0xfff0b8 : 0xe8dcff, 1).fillRoundedRect(t.x - 31, t.y - 28, 62, 56, 12);
      if (i === this.tab) t.g.lineStyle(4, 0xe2a53a, 1).strokeRoundedRect(t.x - 31, t.y - 28, 62, 56, 12);
      this.objs.push(this.tabIcon(KINDS[i], t.x, t.y));
    });
    const list: string[] = this.kind === 'head' ? [...WAND_HEADS] : this.kind === 'color' ? [...WAND_COLORS] : [...WAND_TRAILS];
    const perRow = 4, x0 = 238 + 133 - (perRow * CELL) / 2 + CELL / 2, y0 = 126;
    list.forEach((v, i) => {
      const x = x0 + (i % perRow) * CELL, y = y0 + Math.floor(i / perRow) * (CELL + 8);
      this.card(this.kind, v, x, y);
    });
    this.drawPreview();
  }

  private card(kind: Kind, value: string, x: number, y: number) {
    const id = `${kind}:${value}`;
    const owned = hasOption(this.st.unlockedWand, id), eq = this.isEquipped(kind, value);
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(owned ? (kind === 'trail' ? 0x4a2f8f : 0xffffff) : 0x6a5a86, 1).fillRoundedRect(x - CARD / 2, y - CARD / 2, CARD, CARD, 10);
    g.lineStyle(eq ? 5 : 2, eq ? 0xffd93d : 0xb9a6e8, 1).strokeRoundedRect(x - CARD / 2, y - CARD / 2, CARD, CARD, 10);
    this.objs.push(g);
    const img = this.optionPic(kind, value, x, y, owned);
    this.objs.push(img);
    if (!owned) {
      const lock = this.add.image(x + 17, y + 17, 'ui', UI.icon_lock).setScale(0.8).setDepth(8); this.objs.push(lock);
      const hint = OPTION_EARN[id]?.hint;
      if (hint) { const h = this.hintPic(hint, x - 15, y - 15); this.objs.push(h); }
    } else if (eq) {
      const ck = this.add.image(x + 18, y - 18, 'ui', UI.icon_check).setScale(0.7).setDepth(8); this.objs.push(ck);
    }
    const z = this.add.zone(x, y, CELL, CELL).setDepth(20).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => { if (this.time.now - this.openedAt < 250) return; if (owned) this.choose(kind, value); else this.wiggle(img); });
    this.objs.push(z);
    this.cards.push({ id, kind, value, x, y, owned, img });
  }

  private optionPic(kind: Kind, value: string, x: number, y: number, owned: boolean): Phaser.GameObjects.GameObject {
    let o: Phaser.GameObjects.GameObject;
    if (kind === 'head') o = this.add.image(x, y, `wand_${value}_${this.wand.colorId}`).setScale(1.7);
    else if (kind === 'trail') o = this.add.image(x, y, `trail_${value}`).setScale(4.2);
    else {
      const gr = this.add.graphics();
      if (value === 'rainbow') WAND_TINT.rainbow.forEach((c, i) => gr.fillStyle(c, 1).slice(x, y, 19, (Math.PI * 2 * i) / 6, (Math.PI * 2 * (i + 1)) / 6, false).fillPath());
      else gr.fillStyle(HEX(value as WandColor), 1).fillCircle(x, y, 19);
      gr.lineStyle(2, 0x6a4a9a, 0.8).strokeCircle(x, y, 19);
      o = gr;
    }
    (o as Phaser.GameObjects.GameObject & { setDepth(n: number): unknown }).setDepth(6);
    if (!owned) { if (o instanceof Phaser.GameObjects.Image) o.setTintFill(0x2a1d44).setAlpha(0.8); else (o as Phaser.GameObjects.Graphics).setAlpha(0.18); }
    return o;
  }

  private hintPic(key: string, x: number, y: number): Phaser.GameObjects.Image {
    const im = key.startsWith('icon_') ? this.add.image(x, y, 'ui', UI[key as UiName]).setScale(0.6) : this.add.image(x, y, key).setScale(key.startsWith('trail_') ? 1.6 : 0.7);
    return im.setDepth(9);
  }

  private wiggle(o: Phaser.GameObjects.GameObject) {
    services.audio.sfx('pop');
    this.tweens.add({ targets: o, x: '+=4', duration: 60, yoyo: true, repeat: 2 });
  }

  // ------------------------------------------------------------------ choose + preview
  private choose(kind: Kind, value: string) {
    const id = `${kind}:${value}`;
    if (!hasOption(this.st.unlockedWand, id)) return;
    const w = this.wand;
    if (kind === 'head') w.headId = value as WandHead; else if (kind === 'color') w.colorId = value as WandColor; else w.trailId = value as WandTrail;
    const first = this.st.activities.workshop.made === 0;
    this.st.activities.workshop.made++; this.madeThisVisit++;
    services.save.save();
    services.audio.sfx('chime');
    this.render();
    if (!reducedEffects()) burst(this, 119, 170, 10, 40);
    if (first) this.firstSurprise();
  }

  /** A small first-time surprise: a few hearts float up from the new wand. */
  private firstSurprise() {
    const n = reducedEffects() ? 2 : 6;
    for (let i = 0; i < n; i++) {
      const h = this.add.image(119 + (i - n / 2) * 18, 190, 'fx_heart').setScale(2).setDepth(40);
      this.tweens.add({ targets: h, y: 90 - (i % 3) * 14, alpha: 0, duration: dur(1400), delay: i * 90, onComplete: () => h.destroy() });
    }
  }

  private drawPreview() {
    this.previewObjs.forEach((o) => o.destroy()); this.previewObjs = [];
    this.demo?.remove();
    const w = this.wand, cx = 90, cy = 188;
    // the shaft leans right; its top tip (centre + rotated half-length) is exactly where the head sits
    const tilt = 22, half = 64, rad = (tilt * Math.PI) / 180;
    const shaft = this.add.image(cx, cy + 40, 'wand_shaft').setScale(3.2).setAngle(tilt).setDepth(4);
    const head = this.add.image(cx + Math.sin(rad) * half, cy + 40 - Math.cos(rad) * half - 6, `wand_${w.headId}_${w.colorId}`).setScale(3.4).setAngle(tilt).setDepth(5);
    this.previewObjs.push(shaft, head);
    if (!reducedEffects()) this.tweens.add({ targets: head, angle: { from: tilt - 7, to: tilt + 7 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.demo = this.time.addEvent({ delay: reducedEffects() ? 2200 : 1500, loop: true, callback: () => this.demoShot(head.x, head.y) });
    this.demoShot(head.x, head.y);
  }

  /** A looping pretend spell so she can see exactly how the colour and trail will look. Straight to the right, like the real one. */
  private demoShot(sx: number, sy: number) {
    const w = this.wand, tints = WAND_TINT[w.colorId];
    const bolt = this.add.image(sx + 10, sy, `bolt_${w.colorId}`).setScale(2).setDepth(9);
    this.previewObjs.push(bolt);
    let last = 0, ti = 0;
    this.tweens.add({
      targets: bolt, x: 214, duration: dur(900), ease: 'Sine.Out',
      onUpdate: () => {
        if (reducedEffects() || this.time.now - last < 70) return;
        last = this.time.now;
        const t = this.add.image(bolt.x, bolt.y + Phaser.Math.Between(-3, 3), `trail_${w.trailId}`).setScale(2.2).setDepth(8);
        if (w.colorId === 'rainbow') t.setTint(tints[ti++ % tints.length]);
        this.tweens.add({ targets: t, alpha: 0, y: t.y + (w.trailId === 'bubble' ? -12 : 10), duration: 500, onComplete: () => t.destroy() });
      },
      onComplete: () => { bolt.destroy(); }
    });
  }

  // ------------------------------------------------------------------ leaving
  private close() {
    if (this.closing) return;
    this.closing = true;
    this.demo?.remove();
    services.save.save();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.get('World').events.emit('station-closed');
    this.scene.stop();
  }
}

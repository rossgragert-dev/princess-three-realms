import Phaser from 'phaser';
import { CATALOG, DRESS_COLORS, FIELD, HAIR_COLORS, SKIN_TONES, isOwned, selectOption, type AppearanceSlot, type OptionDef } from '../content/appearance';
import { ITEM, UI, type UiName } from '../content/frameIndex';
import { PrincessPreview, ThumbPool } from '../art/looks';
import { services } from '../systems/services';
import { dur, reducedEffects } from '../systems/accessibility';
import { burst, makeButton, pic, roundedPanel, type Btn } from '../ui/touchTargets';

type GO = Phaser.GameObjects.GameObject;

export interface StationCfg {
  key: 'Wardrobe' | 'Vanity';
  kind: 'full' | 'port';
  tabs: AppearanceSlot[];
  tabIcons: Record<string, UiName>;
  other: 'Wardrobe' | 'Vanity';
  otherIcon: UiName;
}

const COLOR_SLOTS: Partial<Record<AppearanceSlot, readonly { id: string; ramp: readonly string[] }[]>> = {
  dressColor: DRESS_COLORS, hairColor: HAIR_COLORS, skinTone: SKIN_TONES
};
const lastTab: Record<string, number> = {};

/**
 * Shared full-screen customisation scene (Royal Wardrobe / Enchanted Vanity).
 * Picture-only: tabs, pageable picture cards (real thumbnails of her wearing each), equipped = gold frame + check,
 * locked = dark silhouette + padlock + picture of where it comes from. Every tap saves immediately.
 */
export abstract class StationScene extends Phaser.Scene {
  private preview!: PrincessPreview;
  private previewImg!: Phaser.GameObjects.Image;
  private thumbs!: ThumbPool;
  private tab = 0;
  private page = 0;
  private closing = false;
  private openedAt = 0;
  private pageObjs: GO[] = [];
  private tabObjs: { slot: AppearanceSlot; x: number; y: number; ring: Phaser.GameObjects.Graphics }[] = [];
  private cards: { id: string; x: number; y: number; w: number; h: number; owned: boolean }[] = [];
  private down: { x: number; y: number; id: string | null; inGrid: boolean } | null = null;
  private pagerBtns: Btn[] = [];
  private pageDots: GO[] = [];
  private twirling = false;
  private btnPos: Record<string, { x: number; y: number }> = {};

  constructor(private cfg: StationCfg) { super(cfg.key); }

  private get app() { return services.save.state.appearance; }
  private get wardrobe() { return services.save.state.wardrobe; }
  private get slot(): AppearanceSlot { return this.cfg.tabs[this.tab]; }
  private get isColor() { return !!COLOR_SLOTS[this.slot]; }
  private get perPage() { return this.isColor ? 12 : 6; }
  private get options(): OptionDef[] { return CATALOG[this.slot]; }
  private get pages() { return Math.max(1, Math.ceil(this.options.length / this.perPage)); }

  protected abstract drawBackdrop(): void;

  create() {
    this.closing = false; this.twirling = false; this.down = null;
    this.openedAt = this.time.now;
    this.tab = Math.min(lastTab[this.cfg.key] ?? 0, this.cfg.tabs.length - 1);
    this.page = 0;
    this.pageObjs = []; this.tabObjs = []; this.cards = []; this.pagerBtns = []; this.pageDots = []; this.btnPos = {};
    const full = this.cfg.kind === 'full';

    this.drawBackdrop();
    // preview ---------------------------------------------------------
    this.preview = new PrincessPreview(this, this.cfg.kind, full ? 'wd_preview_full' : 'wd_preview_port');
    this.preview.render(this.app);
    const px = full ? 124 : 126, py = full ? 340 : 196;
    this.previewImg = this.add.image(px, py, this.preview.key).setScale(2).setOrigin(0.5, full ? 1 : 0.5).setDepth(5);
    this.previewImg.setInteractive({ useHandCursor: true });
    this.previewImg.on('pointerdown', () => this.twirl());

    // controls panel --------------------------------------------------
    this.add.existing(roundedPanel(this, 252, 8, 254, 368).setDepth(2));
    this.buildTabs();
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);

    const back = makeButton(this, 32, 30, 'icon_back', 0.9, () => this.close());
    back.container.setDepth(20); this.btnPos.back = { x: 32, y: 30 };
    const sw = makeButton(this, 290, 352, this.cfg.otherIcon, 0.9, () => this.switchStation());
    sw.container.setDepth(20); this.btnPos.switch = { x: 290, y: 352 };
    this.buildAccept();
    this.buildPager();
    this.renderPage();
    this.startTwinkles();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.onDown, this);
      this.input.off('pointerup', this.onUp, this);
      delete (window as unknown as { __station?: unknown }).__station;
    });
    (window as unknown as { __station?: unknown }).__station = this.debugHook();
    this.cameras.main.fadeIn(dur(200));
  }

  // ------------------------------------------------------------------ tabs
  private buildTabs() {
    const n = this.cfg.tabs.length;
    const top = 18, bottom = 324, step = (bottom - top) / n, h = Math.min(66, step - 4), x = 276;
    this.cfg.tabs.forEach((slot, i) => {
      const y = top + step * i + step / 2;
      const g = this.add.graphics().setDepth(4);
      this.add.rectangle(x, y, 46, h, 0xffffff, 0.001).setDepth(3);
      const icon = pic(this, this.cfg.tabIcons[slot], x, y, h >= 56 ? 1.3 : 1).setDepth(6);
      void icon;
      const zone = this.add.zone(x, y, 48, h + 2).setDepth(9).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.selectTab(i));
      this.tabObjs.push({ slot, x, y, ring: g });
    });
    this.drawTabs(h);
  }

  private drawTabs(hh?: number) {
    const n = this.cfg.tabs.length;
    const step = (324 - 18) / n, h = hh ?? Math.min(66, step - 4);
    this.tabObjs.forEach((t, i) => {
      const on = i === this.tab;
      t.ring.clear();
      t.ring.fillStyle(on ? 0xffe27a : 0xf1e6ff, 1).fillRoundedRect(t.x - 23, t.y - h / 2, 46, h, 10);
      t.ring.lineStyle(on ? 4 : 2, on ? 0xff8a1f : 0xc9b8ff, 1).strokeRoundedRect(t.x - 23, t.y - h / 2, 46, h, 10);
      if (on) t.ring.fillStyle(0xff8a1f, 1).fillTriangle(t.x + 23, t.y - 7, t.x + 23, t.y + 7, t.x + 31, t.y);
    });
  }

  private selectTab(i: number) {
    if (this.closing || i === this.tab) return;
    this.tab = i; this.page = 0; lastTab[this.cfg.key] = i;
    services.audio.sfx('pop');
    this.drawTabs();
    this.renderPage();
  }

  // ------------------------------------------------------------------ cards
  private clearPage() {
    this.pageObjs.forEach((o) => o.destroy()); this.pageObjs = [];
    this.cards = [];
  }
  private keep<T extends GO>(o: T): T { this.pageObjs.push(o); return o; }

  private renderPage() {
    this.clearPage();
    const slot = this.slot;
    const start = this.page * this.perPage;
    const list = this.options.slice(start, start + this.perPage);
    const equipped = this.app[FIELD[slot]];
    const colors = COLOR_SLOTS[slot];
    list.forEach((opt, i) => {
      const owned = isOwned(slot, opt.id, this.wardrobe.unlocked);
      const on = opt.id === equipped;
      let cx: number, cy: number, w: number, h: number;
      if (colors) { cx = 328 + (i % 4) * 48; cy = 56 + Math.floor(i / 4) * 80; w = 44; h = 72; }
      else { cx = 354 + (i % 2) * 98; cy = 56 + Math.floor(i / 2) * 84; w = 92; h = 80; }
      this.cards.push({ id: opt.id, x: cx, y: cy, w, h, owned });
      const bg = this.keep(this.add.graphics().setDepth(7));
      if (!colors) {
        bg.fillStyle(0xffffff, 1).fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
        bg.lineStyle(on ? 5 : 2, on ? 0xffb300 : 0xd9cdf2, 1).strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      }
      if (colors) {
        const ramp = colors.find((c) => c.id === opt.id)!.ramp;
        this.thumbs.drawSwatch(i, ramp, 40, 64);
        const im = this.keep(this.add.image(cx - 20, cy - 32, this.thumbs.key(i)).setOrigin(0, 0).setDepth(8));
        im.setCrop(0, 0, 40, 64);
        if (on) { bg.lineStyle(5, 0xffb300, 1).strokeRoundedRect(cx - 24, cy - 36, 48, 72, 12); }
      } else if (opt.id === 'none') {
        this.keep(pic(this, 'icon_none', cx, cy, 2).setDepth(8));
      } else {
        this.thumbs.drawOption(i, this.app, slot, opt.id, { w: 88, h: 80 });
        const im = this.keep(this.add.image(cx - 44, cy - 40, this.thumbs.key(i)).setOrigin(0, 0).setDepth(8));
        im.setCrop(0, 0, 88, 80);
        if (!owned) im.setTintFill(0x5a4a7a).setAlpha(0.6);
      }
      if (!owned) {
        this.keep(pic(this, 'icon_lock', cx + w / 2 - 14, cy + h / 2 - 14, 0.6).setDepth(10));
        if (opt.hintIcon) {
          const hint = this.keep(pic(this, opt.hintIcon, cx - w / 2 + 16, cy + h / 2 - 16, opt.hintIcon.startsWith('icon_') ? 0.75 : 1.6).setDepth(10));
          void hint;
        }
      }
      if (on) {
        const bx = cx + w / 2 - 10, by = cy - h / 2 + 10;
        const badge = this.keep(this.add.graphics().setDepth(11));
        badge.fillStyle(0xffb300, 1).fillCircle(bx, by, 13).lineStyle(2, 0x40255a, 1).strokeCircle(bx, by, 13);
        this.keep(pic(this, 'icon_check', bx, by, 0.6).setDepth(12));
      }
    });
    this.updatePager();
  }

  // ------------------------------------------------------------------ pager
  private buildPager() {
    const prev = makeButton(this, 330, 296, 'icon_left', 0.8, () => this.turn(-1));
    const next = makeButton(this, 474, 296, 'icon_right', 0.8, () => this.turn(1));
    [prev, next].forEach((b) => b.container.setDepth(20));
    this.pagerBtns = [prev, next];
    this.btnPos.prev = { x: 330, y: 296 }; this.btnPos.next = { x: 474, y: 296 };
  }
  private updatePager() {
    const show = this.pages > 1;
    this.pagerBtns.forEach((b) => b.setVisible(show));
    this.pagerBtns[0].setEnabled(this.page > 0);
    this.pagerBtns[1].setEnabled(this.page < this.pages - 1);
    this.pageDots.forEach((d) => d.destroy()); this.pageDots = [];
    if (!show) return;
    for (let i = 0; i < this.pages; i++) {
      const x = 402 + (i - (this.pages - 1) / 2) * 18;
      this.pageDots.push(this.add.circle(x, 296, i === this.page ? 7 : 5, i === this.page ? 0xff8a1f : 0xc9b8ff).setDepth(20).setStrokeStyle(2, 0x40255a));
    }
  }
  private turn(d: number) {
    if (this.closing) return;
    const p = Phaser.Math.Clamp(this.page + d, 0, this.pages - 1);
    if (p === this.page) return;
    this.page = p; this.renderPage();
  }

  // ------------------------------------------------------------------ pointer: select on release, swipe to page
  private cardAt(x: number, y: number) {
    return this.cards.find((c) => Math.abs(x - c.x) <= c.w / 2 && Math.abs(y - c.y) <= c.h / 2) ?? null;
  }
  private onDown(p: Phaser.Input.Pointer) {
    const inGrid = p.x >= 296 && p.y < 276 && p.y > 10;
    this.down = { x: p.x, y: p.y, id: inGrid ? (this.cardAt(p.x, p.y)?.id ?? null) : null, inGrid };
  }
  private onUp(p: Phaser.Input.Pointer) {
    const d = this.down; this.down = null;
    if (!d || !d.inGrid || this.closing) return;
    const dx = p.x - d.x, dy = p.y - d.y;
    if (Math.abs(dx) > 40 && Math.abs(dy) < 40) { this.turn(dx < 0 ? 1 : -1); return; }
    if (Math.hypot(dx, dy) > 14) return;
    const c = this.cardAt(p.x, p.y);
    if (c && d.id === c.id) this.choose(c.id);
  }

  private choose(id: string) {
    if (this.closing) return;
    const slot = this.slot;
    const c = this.cards.find((q) => q.id === id);
    if (!c) return;
    if (!c.owned) { this.wiggle(c); return; }
    if (this.app[FIELD[slot]] === id) { this.twirl(); return; }
    if (!selectOption(this.app, this.wardrobe, slot, id)) return;
    services.save.save();
    services.audio.sfx('sparkle');
    this.preview.render(this.app);
    this.renderPage();
    burst(this, this.previewImg.x, this.previewImg.y - (this.cfg.kind === 'full' ? 150 : 60), 8, 30);
  }

  private wiggle(c: { x: number; y: number }) {
    services.audio.sfx('pop');
    const dot = this.add.image(c.x, c.y, 'ui', UI.icon_lock).setDepth(30).setScale(1.5);
    this.tweens.add({ targets: dot, angle: { from: -14, to: 14 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => dot.destroy() });
  }

  private twirl() {
    if (this.twirling || this.closing) return;
    this.twirling = true;
    services.audio.sfx('sparkle');
    burst(this, this.previewImg.x, this.previewImg.y - (this.cfg.kind === 'full' ? 140 : 60), 12, 30);
    if (reducedEffects()) { this.twirling = false; return; }
    this.tweens.add({ targets: this.previewImg, scaleX: -2, duration: 260, yoyo: true, ease: 'Sine.InOut', onComplete: () => { this.previewImg.setScale(2); this.twirling = false; } });
  }

  private startTwinkles() {
    if (reducedEffects()) return;
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(30 + ((i * 41) % 190), 60 + ((i * 53) % 260), 'items', ITEM.sparkle0 + (i % 4)).setDepth(3).setAlpha(0);
      this.tweens.add({ targets: s, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, delay: i * 260 });
    }
  }

  // ------------------------------------------------------------------ accept / switch / close
  private buildAccept() {
    const x = 432, y = 350;
    const c = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(0x40255a, 0.35).fillRoundedRect(-62, -22, 128, 52, 26);
    g.fillStyle(0x6fdc7a, 1).fillRoundedRect(-64, -26, 128, 52, 26).lineStyle(4, 0x2b8a3e, 1).strokeRoundedRect(-64, -26, 128, 52, 26);
    const ic = this.add.image(0, 0, 'ui', UI.icon_check).setScale(1.5);
    c.add([g, ic]).setSize(128, 52).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (this.time.now - this.openedAt > 350) this.close(); });
    if (!reducedEffects()) this.tweens.add({ targets: ic, scale: 1.7, duration: 700, yoyo: true, repeat: -1 });
    this.btnPos.accept = { x, y };
  }

  private switchStation() {
    if (this.closing || this.time.now - this.openedAt < 350) return;
    this.closing = true;
    services.save.save();
    const other = this.cfg.other;
    this.cameras.main.fadeOut(dur(160));
    this.time.delayedCall(dur(170), () => {
      this.scene.stop();
      this.scene.launch(other);
      this.scene.bringToTop(other);
    });
  }

  private close() {
    if (this.closing) return;
    this.closing = true;
    services.save.save();
    services.audio.stopVoice();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.get('World').events.emit('station-closed');
    this.scene.stop();
  }

  // ------------------------------------------------------------------ test hook
  private debugHook() {
    return {
      key: this.cfg.key,
      tab: () => this.tab,
      page: () => this.page,
      pages: () => this.pages,
      slot: () => this.slot,
      tabs: () => this.tabObjs.map((t) => ({ slot: t.slot, x: t.x, y: t.y })),
      cards: () => this.cards.map((c) => ({ ...c, equipped: this.app[FIELD[this.slot]] === c.id })),
      buttons: () => ({ ...this.btnPos }),
      previewPos: () => ({ x: this.previewImg.x, y: this.previewImg.y }),
      closing: () => this.closing,
      appearance: () => ({ ...this.app })
    };
  }

  init() { this.thumbs = new ThumbPool(this, `thumb_${this.cfg.key}_`, 12); }
}

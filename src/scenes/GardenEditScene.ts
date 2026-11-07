import Phaser from 'phaser';
import { GARDEN_ITEMS, GGROUPS, GITEM, LAWNS, tilesOf, type GGroup, type GItem, type GPlaced } from '../content/gardenCatalog';
import type { GardenEditor } from '../world/gardenRules';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { stagePoint as sp, useStage, stageOf } from '../ui/stage';
import { burst, makeButton, roundedPanel, pic, type Btn } from '../ui/touchTargets';

/** What the world gives the garden editor. */
export interface GardenHost {
  gardenEditor: GardenEditor | undefined;
  toScreen(wx: number, wy: number): { x: number; y: number };
  tileAtScreen(px: number, py: number): { x: number; y: number };
  gardenChanged(layout: GPlaced[], pop?: string): void;
  showLawn(i: number): void;
  endGardenEdit(): void;
}
type Sel = { mode: 'new'; item: string } | { mode: 'move'; id: string; item: string };
const GROUP_ICON: Record<GGroup, string> = { flowers: 'px_gd_rose', trees: 'px_gd_tree', structures: 'px_gd_birdbath', ornaments: 'px_gd_gnome' };
const PANEL_Y = 298, CARD_X0 = 66, CARD_GAP = 54, PER_PAGE = 8;

/**
 * Garden design mode: the same flow as decorating the bedroom (picture catalog, tap or drag to aim, green/red outline,
 * big check) for the garden lawns. Rules live in content/gardenCatalog.ts and world/gardenRules.ts.
 */
export class GardenEditScene extends Phaser.Scene {
  private host!: GardenHost;
  private group: GGroup = 'flowers';
  private page = 0;
  private lawn = 0;
  private sel: Sel | null = null;
  private ghost: { x: number; y: number } | null = null;
  private status: { ok: boolean; why?: string } = { ok: false };
  private ghostImg?: Phaser.GameObjects.Image;
  private marks!: Phaser.GameObjects.Graphics;
  private statusIcon?: Phaser.GameObjects.Image;
  private cardsLayer!: Phaser.GameObjects.Container;
  private tabsLayer!: Phaser.GameObjects.Container;
  private btn: Record<string, Btn> = {};
  private dragging = false;
  private busyUntil = 0;
  private closing = false;
  cardPos: { id: string; x: number; y: number }[] = [];

  constructor() { super('GardenEdit'); }
  init(data: { world: GardenHost; lawn?: number }) { this.host = data.world; this.sel = null; this.ghost = null; this.page = 0; this.group = 'flowers'; this.lawn = data.lawn ?? 0; this.dragging = false; this.busyUntil = 0; this.closing = false; }
  private get editor() { return this.host.gardenEditor!; }
  private ts(wx: number, wy: number) { const s = this.host.toScreen(wx, wy), o = stageOf(this, 'bottom'); return { x: s.x - o.x, y: s.y - o.y }; }

  create() {
    useStage(this, 'bottom');
    this.cameras.main.fadeIn(dur(160));
    this.marks = this.add.graphics().setDepth(5);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => { if (!over.length && sp(this, p).y < PANEL_Y - 2 && sp(this, p).x < 452) { this.dragging = true; this.tapRoom(p); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.dragging && this.sel && sp(this, p).y < PANEL_Y - 2) this.aim(this.host.tileAtScreen(p.x, p.y)); });
    const up = () => { this.dragging = false; };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up); this.input.on('pointercancel', up);
    roundedPanel(this, 4, PANEL_Y, 504, 82, 0xeaffea, 0x45b36a, 14).setDepth(10);
    this.tabsLayer = this.add.container(0, 0).setDepth(11);
    this.cardsLayer = this.add.container(0, 0).setDepth(11);
    const arrow = (x: number, dir: number) => { const b = makeButton(this, x, 352, 'icon_back', 0.62, () => { this.page += dir; this.buildCards(); }); b.container.setDepth(12); if (dir > 0) b.container.getAt<Phaser.GameObjects.Image>(0).setFlipX(true); return b; };
    this.btn.prev = arrow(24, -1); this.btn.next = arrow(488, 1);
    const col = (name: string, y: number, icon: Parameters<typeof makeButton>[3], sc: number, fn: () => void) => { const b = makeButton(this, 482, y, icon, sc, fn); b.container.setDepth(12); this.btn[name] = b; };
    col('done', 30, 'icon_back', 1.0, () => this.finish());
    col('lawn', 92, 'icon_unicorn', 0.9, () => this.nextLawn());
    col('undo', 150, 'icon_undo', 0.95, () => this.undo());
    col('trash', 208, 'icon_trash', 0.95, () => this.putAway());
    col('accept', 262, 'icon_check', 1.3, () => this.accept());
    col('cancel', 262, 'icon_cross', 0.9, () => this.deselect());
    this.btn.cancel.container.setPosition(430, 262);
    this.buildTabs(); this.buildCards(); this.refreshUi(); this.redraw();
    (window as unknown as { __gedit?: unknown }).__gedit = this.debugHook();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { delete (window as unknown as { __gedit?: unknown }).__gedit; });
  }

  private items() { return GARDEN_ITEMS.filter((i) => i.group === this.group); }
  private buildTabs() {
    this.tabsLayer.removeAll(true);
    GGROUPS.forEach((g, i) => {
      const x = 40 + i * 62, y = 314, on = g === this.group;
      const bg = this.add.graphics();
      bg.fillStyle(on ? 0xffe27a : 0xdff5e4, 1).fillRoundedRect(-27, -14, 54, 28, 10); bg.lineStyle(on ? 4 : 2, on ? 0xff9a00 : 0x9fd9ae, 1).strokeRoundedRect(-27, -14, 54, 28, 10);
      const img = this.add.image(0, 0, GROUP_ICON[g]); img.setScale(Math.min(1, 24 / Math.max(img.width, img.height)));
      const c = this.add.container(x, y, [bg, img]).setSize(56, 32).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => { if (this.group === g) return; services.audio.sfx('pop'); this.group = g; this.page = 0; this.buildTabs(); this.buildCards(); });
      this.tabsLayer.add(c);
    });
  }
  private buildCards() {
    this.cardsLayer.removeAll(true); this.cardPos = [];
    const items = this.items(), pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    this.page = Math.max(0, Math.min(this.page, pages - 1));
    this.btn.prev.setVisible(this.page > 0); this.btn.next.setVisible(this.page < pages - 1);
    items.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE).forEach((def, i) => {
      const x = CARD_X0 + i * CARD_GAP, y = 352;
      const full = this.editor.layout.filter((p) => p.item === def.id).length >= def.max;
      const chosen = this.sel?.mode === 'new' && this.sel.item === def.id;
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 1).fillRoundedRect(-24, -27, 48, 54, 10); g.lineStyle(chosen ? 5 : 3, chosen ? 0xffc800 : 0x9fd9ae, 1).strokeRoundedRect(-24, -27, 48, 54, 10);
      const img = this.add.image(0, 0, def.key, def.key === 'px_gd_pinwheel' ? 0 : undefined); img.setScale(Math.min(2, 40 / Math.max(img.width, img.height)));
      if (full) img.setAlpha(0.45);
      const c = this.add.container(x, y, [g, img]).setSize(50, 56).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.pickCard(def, full, c));
      this.cardsLayer.add(c); this.cardPos.push({ id: def.id, x, y });
    });
  }
  private pickCard(def: GItem, full: boolean, c: Phaser.GameObjects.Container) {
    if (full) { services.audio.sfx('pop'); this.tweens.add({ targets: c, x: c.x + 5, duration: 55, yoyo: true, repeat: 3 }); return; }
    services.audio.sfx('sparkle');
    this.sel = { mode: 'new', item: def.id };
    const l = LAWNS[this.lawn], t = this.nearestOk(def.id, Math.floor((l.x0 + l.x1) / 2), Math.floor((l.y0 + l.y1) / 2));
    this.ghost = t; this.evaluate(); this.buildCards(); this.refreshUi(); this.redraw();
  }
  private nearestOk(item: string, cx: number, cy: number, skip?: string): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null, bd = 1e9;
    const l = LAWNS[this.lawn];
    for (let y = l.y0; y <= l.y1; y++) for (let x = l.x0; x <= l.x1; x++) {
      const d = Math.hypot(x - cx, y - cy); if (d >= bd) continue;
      if (this.editor.check(item, x, y, skip).ok) { best = { x, y }; bd = d; }
    }
    return best;
  }

  private tapRoom(p: Phaser.Input.Pointer) {
    const t = this.host.tileAtScreen(p.x, p.y);
    if (this.sel) { this.aim(t); return; }
    const hit = this.pieceAt(t); if (!hit) return;
    services.audio.sfx('pop');
    this.sel = { mode: 'move', id: hit.id, item: hit.item }; this.ghost = { x: hit.x, y: hit.y };
    this.evaluate(); this.buildCards(); this.refreshUi(); this.redraw();
  }
  private pieceAt(t: { x: number; y: number }): GPlaced | undefined {
    return this.editor.layout.find((p) => tilesOf(GITEM[p.item], p.x, p.y).some((q) => q.x === t.x && q.y === t.y));
  }
  private aim(tap: { x: number; y: number }) {
    if (!this.sel) return;
    const it = GITEM[this.sel.item];
    this.ghost = { x: tap.x - Math.floor((it.w - 1) / 2), y: tap.y };
    this.evaluate(); this.refreshUi(); this.redraw();
  }
  private evaluate() {
    if (!this.sel || !this.ghost) { this.status = { ok: false }; return; }
    this.status = this.editor.check(this.sel.item, this.ghost.x, this.ghost.y, this.sel.mode === 'move' ? this.sel.id : undefined);
  }
  private redraw() {
    this.marks.clear(); this.ghostImg?.destroy(); this.ghostImg = undefined; this.statusIcon?.destroy(); this.statusIcon = undefined;
    // the lawn being designed gets a soft frame
    const l = LAWNS[this.lawn], a = this.ts(l.x0 * 16, l.y0 * 16), b = this.ts((l.x1 + 1) * 16, (l.y1 + 1) * 16);
    this.marks.lineStyle(2, 0xffffff, 0.6).strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (!this.sel || !this.ghost) return;
    const it = GITEM[this.sel.item], ok = this.status.ok, g = this.ghost;
    const at = this.ts(g.x * 16 + 8 * it.w, (g.y + 1) * 16);
    this.ghostImg = this.add.image(at.x, at.y, it.key, it.key === 'px_gd_pinwheel' ? 0 : undefined).setOrigin(0.5, 1).setDepth(8).setAlpha(ok ? 0.85 : 0.5).setTint(ok ? 0xc8ffc8 : 0xff9a9a);
    const o0 = this.ts(g.x * 16, g.y * 16), o1 = this.ts((g.x + it.w) * 16, (g.y + 1) * 16);
    this.marks.lineStyle(3, ok ? 0x45d96a : 0xff5a6e, 0.95).fillStyle(ok ? 0x45d96a : 0xff5a6e, 0.2).fillRect(o0.x, o0.y, o1.x - o0.x, o1.y - o0.y).strokeRect(o0.x, o0.y, o1.x - o0.x, o1.y - o0.y);
    const c = this.ts((g.x + it.w / 2) * 16, g.y * 16 - 16);
    this.statusIcon = pic(this, ok ? 'icon_check' : 'icon_cross', c.x, c.y, 0.5).setDepth(9);
  }
  private refreshUi() {
    const has = !!this.sel, ok = has && !!this.ghost && this.status.ok;
    this.btn.accept.setVisible(has); this.btn.accept.setEnabled(ok); this.btn.accept.pulse(ok);
    this.btn.cancel.setVisible(has); this.btn.trash.setVisible(this.sel?.mode === 'move');
    this.btn.undo.setEnabled(this.editor.canUndo); this.btn.lawn.setVisible(!has);
  }
  private ready() { if (this.time.now < this.busyUntil) return false; this.busyUntil = this.time.now + 140; return true; }
  private accept() {
    if (!this.sel || !this.ghost || !this.status.ok || !this.ready()) return;
    const g = this.ghost; let popId: string | undefined;
    if (this.sel.mode === 'new') { const r = this.editor.place(this.sel.item, g.x, g.y); if ('ok' in r) { this.status = r; this.refreshUi(); return; } popId = r.id; }
    else { const r = this.editor.move(this.sel.id, g.x, g.y); if (!r.ok) { this.status = r; this.refreshUi(); return; } popId = this.sel.id; }
    services.audio.sfx('chime');
    const c = this.ts((g.x + 0.5) * 16, (g.y + 0.5) * 16); burst(this, c.x, c.y, 10, 20);
    this.host.gardenChanged(this.editor.layout, popId);
    if (this.sel.mode === 'move') this.sel = null; else this.ghost = null; // a new piece stays selected: plant again and again
    this.evaluate(); this.buildCards(); this.refreshUi(); this.redraw();
  }
  private deselect() { this.sel = null; this.ghost = null; this.evaluate(); this.buildCards(); this.refreshUi(); this.redraw(); }
  private putAway() {
    if (this.sel?.mode !== 'move' || !this.ready()) return;
    services.audio.sfx('pop');
    if (this.editor.putAway(this.sel.id)) this.host.gardenChanged(this.editor.layout);
    this.deselect();
  }
  private undo() { if (!this.ready()) return; if (this.editor.undo()) { services.audio.sfx('pop'); this.host.gardenChanged(this.editor.layout); } this.deselect(); }
  private nextLawn() { this.lawn = (this.lawn + 1) % LAWNS.length; services.audio.sfx('pop'); this.host.showLawn(this.lawn); this.redraw(); }
  private finish() { if (this.closing) return; this.closing = true; this.host.endGardenEdit(); }

  private debugHook() {
    const o = () => stageOf(this, 'bottom');
    return {
      group: () => this.group, lawn: () => this.lawn,
      groups: () => GGROUPS.map((g, i) => ({ id: g, x: 40 + i * 62 + o().x, y: 314 + o().y })),
      cards: () => this.cardPos.map((c) => ({ ...c, x: c.x + o().x, y: c.y + o().y })),
      buttons: () => Object.fromEntries(Object.entries(this.btn).map(([k, b]) => [k, { x: b.container.x + o().x, y: b.container.y + o().y, visible: b.container.visible }])),
      ghost: () => (this.ghost ? { ...this.ghost } : null), status: () => ({ ...this.status }),
      layout: () => this.editor.layout.map((p) => ({ ...p })),
      tileToScreen: (x: number, y: number) => this.host.toScreen(x * 16 + 8, y * 16 + 8)
    };
  }
}

import Phaser from 'phaser';
import { FURNITURE, GROUPS, anchorFor, checkPlacement, lockedIn, nearestValid, ownedIn, spot, tableUnder, tilesOf, type Check, type FGroup, type FurnitureDef, type LayoutEditor, type PlacedItem, type Tile } from '../content/furniture';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { stagePoint as sp, useStage, stageOf } from '../ui/stage';
import { burst, makeButton, pic, roundedPanel, type Btn } from '../ui/touchTargets';

/** What the world gives the editor. */
export interface DecorateHost {
  editor: LayoutEditor | undefined;
  toScreen(wx: number, wy: number): { x: number; y: number };
  tileAtScreen(px: number, py: number): Tile;
  layoutChanged(layout: PlacedItem[], pop?: string): void;
  endDecorate(): void;
}

type Sel = { mode: 'new'; item: string } | { mode: 'move'; id: string; item: string };

const GROUP_ICON: Record<FGroup, string> = { beds: 'bed', tables: 'round_table', seats: 'pink_chair', rugs: 'plain_rug', plants: 'tulip_pot', toys: 'teddy_bear', lights: 'floor_lamp', storage: 'dresser', wall: 'star_banner' };
const PANEL_Y = 298;
const CARD_X0 = 66, CARD_GAP = 54, PER_PAGE = 8;

/**
 * Decorate mode: the room stays visible above a picture catalog. Pick a piece, tap where it should go (or drag), see a green
 * outline when it fits (red with a "try here" marker when it does not), press the big check. Tap a placed piece to move it,
 * flip it or put it away. All rules live in content/furniture.ts; this scene only draws and listens.
 */
export class DecorateScene extends Phaser.Scene {
  private host!: DecorateHost;
  private group: FGroup = 'beds';
  private page = 0;
  private sel: Sel | null = null;
  private ghost: { x: number; y: number; flip: boolean } | null = null;
  private status: Check = { ok: false };
  private suggest: Tile | null = null;
  private ghostImg?: Phaser.GameObjects.Image;
  private marks!: Phaser.GameObjects.Graphics;
  private statusIcon?: Phaser.GameObjects.Image;
  private cardsLayer!: Phaser.GameObjects.Container;
  private tabsLayer!: Phaser.GameObjects.Container;
  private btn: Record<string, Btn> = {};
  private dragging = false;
  private busyUntil = 0;
  /** Card positions for the browser test drivers. */
  cardPos: { id: string; x: number; y: number; owned: boolean }[] = [];

  constructor() { super('Decorate'); }

  init(data: { world: DecorateHost }) { this.host = data.world; this.sel = null; this.ghost = null; this.page = 0; this.group = 'beds'; this.dragging = false; this.busyUntil = 0; this.closing = false; }

  private get editor() { return this.host.editor!; }
  private get unlocked() { return services.save.state.unlockedDecor; }

  /** A room pixel as a position in this scene's (stage-centred) coordinates. */
  private ts(wx: number, wy: number) { const s = this.host.toScreen(wx, wy), o = stageOf(this, 'bottom'); return { x: s.x - o.x, y: s.y - o.y }; }

  create() {
    useStage(this, 'bottom');
    this.cameras.main.fadeIn(dur(160));
    // the room area listens for taps and drags; everything on the panel and the button column is a normal button
    this.marks = this.add.graphics().setDepth(5);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => { if (!over.length && sp(this, p).y < PANEL_Y - 2 && sp(this, p).x < 452) { this.dragging = true; this.tapRoom(p); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.dragging && this.sel && sp(this, p).y < PANEL_Y - 2) this.aim(this.host.tileAtScreen(p.x, p.y)); });
    const up = () => { this.dragging = false; };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up); this.input.on('pointercancel', up);

    // bottom sheet
    roundedPanel(this, 4, PANEL_Y, 504, 82, 0xfff6e4, 0xa06bff, 14).setDepth(10);
    this.tabsLayer = this.add.container(0, 0).setDepth(11);
    this.cardsLayer = this.add.container(0, 0).setDepth(11);
    const arrow = (x: number, dir: number) => { const b = makeButton(this, x, 352, 'icon_back', 0.62, () => this.turn(dir)); b.container.setDepth(12); if (dir > 0) b.container.getAt<Phaser.GameObjects.Image>(0).setFlipX(true); return b; };
    this.btn.prev = arrow(24, -1); this.btn.next = arrow(488, 1);

    // right-hand column
    const col = (name: string, y: number, icon: Parameters<typeof makeButton>[3], sc: number, fn: () => void) => { const b = makeButton(this, 482, y, icon, sc, fn); b.container.setDepth(12); this.btn[name] = b; };
    col('done', 30, 'icon_back', 1.0, () => this.finish());
    col('undo', 92, 'icon_undo', 0.95, () => this.undo());
    col('flip', 150, 'icon_flip', 0.95, () => this.flip());
    col('trash', 208, 'icon_trash', 0.95, () => this.putAway());
    col('accept', 262, 'icon_check', 1.3, () => this.accept());
    col('cancel', 262, 'icon_cross', 0.9, () => this.deselect());
    this.btn.cancel.container.setPosition(430, 262);

    this.buildTabs(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks();

    (window as unknown as { __decor?: unknown }).__decor = this.debugHook();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { delete (window as unknown as { __decor?: unknown }).__decor; });
  }

  // ------------------------------------------------------------------ catalog
  private groupItems(): { def: FurnitureDef; owned: boolean }[] {
    return [...ownedIn(this.group, this.unlocked).map((def) => ({ def, owned: true })), ...lockedIn(this.group, this.unlocked).map((def) => ({ def, owned: false }))];
  }

  private buildTabs() {
    this.tabsLayer.removeAll(true);
    GROUPS.forEach((g, i) => {
      const x = 30 + i * 53, y = 314, on = g === this.group;
      const bg = this.add.graphics();
      bg.fillStyle(on ? 0xffe27a : 0xece4ff, 1).fillRoundedRect(-24, -14, 48, 28, 10); bg.lineStyle(on ? 4 : 2, on ? 0xff9a00 : 0xc9b8ff, 1).strokeRoundedRect(-24, -14, 48, 28, 10);
      const img = this.add.image(0, 0, GROUP_ICON[g]); img.setScale(Math.min(1, 22 / Math.max(img.width, img.height)) * 1);
      const c = this.add.container(x, y, [bg, img]).setSize(52, 32).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => { if (this.group === g) return; services.audio.sfx('pop'); this.group = g; this.page = 0; this.buildTabs(); this.buildCards(); });
      this.tabsLayer.add(c);
    });
  }

  private buildCards() {
    this.cardsLayer.removeAll(true);
    this.cardPos = [];
    const items = this.groupItems();
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    this.page = Math.min(this.page, pages - 1);
    this.btn.prev.setVisible(this.page > 0); this.btn.next.setVisible(this.page < pages - 1);
    items.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE).forEach(({ def, owned }, i) => {
      const x = CARD_X0 + i * CARD_GAP, y = 352;
      const inRoom = this.editor.layout.filter((p) => p.item === def.id).length;
      const full = inRoom >= def.max;
      const g = this.add.graphics();
      const chosen = this.sel?.mode === 'new' && this.sel.item === def.id;
      g.fillStyle(owned ? 0xffffff : 0xd9d2ee, 1).fillRoundedRect(-24, -27, 48, 54, 10);
      g.lineStyle(chosen ? 5 : 3, chosen ? 0xffc800 : 0xc9b8ff, 1).strokeRoundedRect(-24, -27, 48, 54, 10);
      const img = this.add.image(0, -2, def.key, def.frame);
      img.setScale(Math.min(2, 38 / Math.max(img.width, img.height)));
      const parts: Phaser.GameObjects.GameObject[] = [g, img];
      if (!owned) { img.setTintFill(0x6a4a8c).setAlpha(0.6); parts.push(pic(this, 'icon_lock', 11, 14, 0.62)); }
      else if (full) { img.setAlpha(0.45); parts.push(pic(this, 'icon_check', 13, 16, 0.5)); }
      const c = this.add.container(x, y, parts).setSize(50, 56).setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.pickCard(def, owned, full, c));
      this.cardsLayer.add(c);
      this.cardPos.push({ id: def.id, x, y, owned });
    });
  }

  private turn(dir: number) { this.page += dir; this.buildCards(); }

  private pickCard(def: FurnitureDef, owned: boolean, full: boolean, c: Phaser.GameObjects.Container) {
    if (!owned || full) { services.audio.sfx('pop'); this.tweens.add({ targets: c, x: c.x + 5, duration: 55, yoyo: true, repeat: 3 }); return; }
    services.audio.sfx('sparkle');
    this.sel = { mode: 'new', item: def.id };
    // first suggestion: the middle of the room, nudged to the nearest spot where it fits
    const t = nearestValid(this.editor.layout, this.unlocked, def.id, 12, 11) ?? nearestValid(this.editor.layout, this.unlocked, def.id, 12, 11, undefined, 14);
    this.ghost = t ? { x: t.x, y: t.y, flip: false } : null;
    this.evaluate();
    this.buildCards(); this.refreshUi(); this.redrawRoomMarks();
  }

  // ------------------------------------------------------------------ the room
  private tapRoom(p: Phaser.Input.Pointer) {
    const t = this.host.tileAtScreen(p.x, p.y);
    if (this.sel) { this.aim(t); return; }
    const hit = this.pieceAt(t);
    if (!hit) return;
    services.audio.sfx('pop');
    this.sel = { mode: 'move', id: hit.id, item: hit.item };
    this.ghost = { x: hit.x, y: hit.y, flip: !!hit.flip };
    this.evaluate(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks();
  }

  /** The topmost placed piece under a tapped tile. */
  private pieceAt(t: Tile): PlacedItem | undefined {
    const order: Record<string, number> = { small: 0, big: 1, wall: 2, window: 2, rug: 3 };
    let best: PlacedItem | undefined;
    for (const p of this.editor.layout) {
      const d = FURNITURE[p.item]; if (!d) continue;
      const hitTile = d.kind === 'wall' || d.kind === 'window' ? t.y <= 3 && t.y >= 1 && (d.kind === 'window' ? Math.abs(t.x - p.x - 0.5) < 1.6 : t.x >= p.x && t.x < p.x + d.w) : tilesOf(d, p.x, p.y).some((q) => q.x === t.x && q.y === t.y);
      if (!hitTile) continue;
      if (!best || order[d.kind] < order[FURNITURE[best.item].kind]) best = p;
    }
    return best;
  }

  private aim(tap: Tile) {
    if (!this.sel) return;
    const d = FURNITURE[this.sel.item];
    const a = anchorFor(d, tap.x, tap.y);
    this.ghost = { x: a.x, y: a.y, flip: this.ghost?.flip ?? false };
    this.evaluate(); this.refreshUi(); this.redrawRoomMarks();
  }

  private evaluate() {
    if (!this.sel || !this.ghost) { this.status = { ok: false }; this.suggest = null; return; }
    const skip = this.sel.mode === 'move' ? this.sel.id : undefined;
    // a table being moved takes its things along, so they do not count as in the way
    const base = skip ? this.editor.layout.filter((p) => p.id !== skip && !(FURNITURE[this.sel!.item].surface && FURNITURE[p.item]?.kind === 'small' && this.onMoving(p, skip))) : this.editor.layout;
    this.status = checkPlacement(base, this.unlocked, this.sel.item, this.ghost.x, this.ghost.y);
    this.suggest = this.status.ok ? null : nearestValid(base, this.unlocked, this.sel.item, this.ghost.x + Math.floor((FURNITURE[this.sel.item].w - 1) / 2), this.ghost.y + FURNITURE[this.sel.item].h - 1);
  }
  private onMoving(small: PlacedItem, tableId: string) {
    const t = this.editor.layout.find((p) => p.id === tableId); const td = t && FURNITURE[t.item];
    return !!td && tilesOf(td, t!.x, t!.y).some((q) => q.x === small.x && q.y === small.y);
  }

  private redrawRoomMarks() {
    this.marks.clear();
    this.ghostImg?.destroy(); this.ghostImg = undefined;
    this.statusIcon?.destroy(); this.statusIcon = undefined;
    // highlight the piece being moved at its old place
    if (this.sel?.mode === 'move') {
      const p = this.editor.layout.find((q) => q.id === (this.sel as { id: string }).id);
      if (p) this.outline(FURNITURE[p.item], p.x, p.y, 0xffffff, 0.35, 2);
    }
    if (!this.sel || !this.ghost) return;
    const d = FURNITURE[this.sel.item];
    const ok = this.status.ok;
    const table = d.kind === 'small' ? this.editor.layout.map((p) => ({ p, d: FURNITURE[p.item] })).find((q) => q.d.surface && tilesOf(q.d, q.p.x, q.p.y).some((t) => t.x === this.ghost!.x && t.y === this.ghost!.y))?.d : undefined;
    const at = spot(d, this.ghost.x, this.ghost.y, table);
    const sp = this.ts(at.x + (d.ox ?? 0), at.y + (d.dy ?? 0));
    this.ghostImg = this.add.image(sp.x, sp.y, d.key, d.frame).setOrigin(0.5, 1).setDepth(8).setAlpha(ok ? 0.85 : 0.5).setFlipX(this.ghost.flip);
    this.ghostImg.setTint(ok ? 0xc8ffc8 : 0xff9a9a);
    this.outline(d, this.ghost.x, this.ghost.y, ok ? 0x45d96a : 0xff5a6e, 0.95, 3);
    const c = this.ts((this.ghost.x + d.w / 2) * 16, (this.ghost.y - (d.kind === 'wall' || d.kind === 'window' ? 0 : 1)) * 16 - 14);
    this.statusIcon = pic(this, ok ? 'icon_check' : 'icon_cross', c.x, c.y, 0.5).setDepth(9);
    if (!ok && this.suggest) {
      this.outline(d, this.suggest.x, this.suggest.y, 0x45d96a, 0.8, 2, true);
    }
  }

  private outline(d: FurnitureDef, x: number, y: number, color: number, alpha: number, w: number, dashed = false) {
    const tiles = d.kind === 'wall' || d.kind === 'window' ? [{ x: x - (d.kind === 'window' ? 1 : 0), y: 1 }, ...Array.from({ length: d.kind === 'window' ? 2 : d.w }, (_, i) => ({ x: x - (d.kind === 'window' ? 1 : 0) + i, y: 1 }))] : tilesOf(d, x, y);
    const xs = tiles.map((t) => t.x), ys = tiles.map((t) => t.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = d.kind === 'wall' || d.kind === 'window' ? 1 : Math.min(...ys), y1 = d.kind === 'wall' || d.kind === 'window' ? 3 : Math.max(...ys) + 1;
    const a = this.ts(x0 * 16, y0 * 16), b = this.ts(x1 * 16, y1 * 16);
    this.marks.lineStyle(w, color, alpha);
    this.marks.fillStyle(color, dashed ? 0.1 : 0.18).fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (dashed) {
      for (let px = a.x; px < b.x; px += 8) { this.marks.lineBetween(px, a.y, Math.min(px + 4, b.x), a.y); this.marks.lineBetween(px, b.y, Math.min(px + 4, b.x), b.y); }
      for (let py = a.y; py < b.y; py += 8) { this.marks.lineBetween(a.x, py, a.x, Math.min(py + 4, b.y)); this.marks.lineBetween(b.x, py, b.x, Math.min(py + 4, b.y)); }
    } else this.marks.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }

  // ------------------------------------------------------------------ actions
  private refreshUi() {
    const has = !!this.sel;
    const ok = has && !!this.ghost && this.status.ok;
    this.btn.accept.setVisible(has); this.btn.accept.setEnabled(ok); this.btn.accept.pulse(ok);
    this.btn.cancel.setVisible(has);
    this.btn.flip.setVisible(has && !!this.sel && FURNITURE[this.sel.item].kind !== 'window');
    this.btn.trash.setVisible(this.sel?.mode === 'move');
    this.btn.undo.setEnabled(this.editor.canUndo);
  }

  private ready() { if (this.time.now < this.busyUntil) return false; this.busyUntil = this.time.now + 140; return true; }

  private accept() {
    if (!this.sel || !this.ghost || !this.status.ok || !this.ready()) return;
    const g = this.ghost;
    let popId: string | undefined;
    if (this.sel.mode === 'new') {
      const r = this.editor.place(this.sel.item, g.x, g.y, g.flip);
      if ('ok' in r) { this.status = r; this.refreshUi(); return; }
      popId = r.id;
    } else {
      const r = this.editor.move(this.sel.id, g.x, g.y, g.flip);
      if (!r.ok) { this.status = r; this.refreshUi(); return; }
      popId = this.sel.id;
    }
    services.audio.sfx('chime');
    const d = FURNITURE[this.sel.item];
    const c = this.ts((g.x + d.w / 2) * 16, (g.y + d.h / 2) * 16);
    burst(this, c.x, c.y, 10, 20);
    this.host.layoutChanged(this.editor.layout, popId);
    if (this.sel.mode === 'move') this.sel = null; else this.ghost = null; // keep a new piece selected so flowers can be planted again and again
    this.evaluate(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks();
  }

  private deselect() { this.sel = null; this.ghost = null; this.evaluate(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks(); }

  private flip() { if (!this.sel || !this.ghost) return; services.audio.sfx('pop'); this.ghost = { ...this.ghost, flip: !this.ghost.flip }; this.redrawRoomMarks(); }

  private putAway() {
    if (this.sel?.mode !== 'move' || !this.ready()) return;
    const id = this.sel.id;
    services.audio.sfx('pop');
    if (this.editor.putAway(id)) this.host.layoutChanged(this.editor.layout);
    this.sel = null; this.ghost = null; this.evaluate(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks();
  }

  private undo() {
    if (!this.ready()) return;
    if (this.editor.undo()) { services.audio.sfx('pop'); this.host.layoutChanged(this.editor.layout); }
    this.sel = null; this.ghost = null; this.evaluate(); this.buildCards(); this.refreshUi(); this.redrawRoomMarks();
  }

  private closing = false;
  private finish() {
    if (this.closing) return;
    this.closing = true;
    this.host.endDecorate();
  }

  // ------------------------------------------------------------------ test hook
  private debugHook() {
    return {
      group: () => this.group,
      groups: () => GROUPS.map((g, i) => ({ id: g, x: 30 + i * 53 + stageOf(this, 'bottom').x, y: 314 + stageOf(this, 'bottom').y })),
      cards: () => this.cardPos.map((c) => ({ ...c, x: c.x + stageOf(this, 'bottom').x, y: c.y + stageOf(this, 'bottom').y })),
      buttons: () => Object.fromEntries(Object.entries(this.btn).map(([k, b]) => [k, { x: b.container.x + stageOf(this, 'bottom').x, y: b.container.y + stageOf(this, 'bottom').y, visible: b.container.visible }])),
      sel: () => this.sel,
      ghost: () => (this.ghost ? { ...this.ghost } : null),
      status: () => ({ ...this.status }),
      suggest: () => (this.suggest ? { ...this.suggest } : null),
      layout: () => this.editor.layout.map((p) => ({ ...p })),
      tileToScreen: (x: number, y: number) => this.host.toScreen(x * 16 + 8, y * 16 + 8),
      table: (p: PlacedItem) => !!tableUnder(this.editor.layout, p)
    };
  }
}

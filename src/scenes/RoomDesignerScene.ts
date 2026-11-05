import Phaser from 'phaser';
import { FLOORS, WALLS, themedTile } from '../content/roomThemes';
import { decorById, slotById } from '../content/decorCatalog';
import { TILE, UI, type TileName } from '../content/frameIndex';
import { getMap } from '../world/maps';
import { effectiveTile } from '../world/navigation';
import { services } from '../systems/services';
import { dur, reducedEffects } from '../systems/accessibility';
import { burst, makeButton, roundedPanel } from '../ui/touchTargets';

type Tab = 'wall' | 'floor';
const K = 0.62;            // miniature scale
const OX = 8, OY = 56;     // where the miniature room sits (logical px)
const lastTab = { v: 0 };

/**
 * The room designer (paintbrush easel in the bedroom): a live miniature of the real room on the left, big picture
 * swatches of wallpapers and floors on the right. Tapping a swatch changes the room right away and saves. Picture-only.
 */
export class RoomDesignerScene extends Phaser.Scene {
  private tab: Tab = 'wall';
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private cardObjs: Phaser.GameObjects.GameObject[] = [];
  private tabRings: { x: number; y: number; g: Phaser.GameObjects.Graphics }[] = [];
  private cards: { id: string; x: number; y: number; w: number; h: number }[] = [];
  private down: { id: string | null } | null = null;
  private closing = false;
  private openedAt = 0;
  private btnPos: Record<string, { x: number; y: number }> = {};
  constructor() { super('RoomDesigner'); }

  private get theme() { return services.save.state.roomTheme; }

  create() {
    this.closing = false; this.openedAt = this.time.now; this.cards = []; this.cardObjs = []; this.tabRings = []; this.btnPos = {};
    this.tab = lastTab.v === 1 ? 'floor' : 'wall';
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0xffe3f1, 0xffe3f1, 0xe6d8ff, 0xe6d8ff, 1).fillRect(0, 0, 512, 384);
    g.fillStyle(0xe2a53a, 1).fillRoundedRect(OX - 6, OY - 6, 384 * K + 12, 288 * K + 12, 12);
    g.fillStyle(0xfff6e4, 1).fillRoundedRect(OX - 3, OY - 3, 384 * K + 6, 288 * K + 6, 9);
    this.buildMiniRoom();
    this.add.existing(roundedPanel(this, 252, 8, 254, 368).setDepth(2));
    this.buildTabs();
    const back = makeButton(this, 32, 28, 'icon_back', 0.9, () => this.close());
    back.container.setDepth(20); this.btnPos.back = { x: 32, y: 28 };
    this.buildAccept();
    this.renderCards();
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('pointerdown', this.onDown, this);
      this.input.off('pointerup', this.onUp, this);
      delete (window as unknown as { __station?: unknown }).__station;
    });
    (window as unknown as { __station?: unknown }).__station = {
      key: 'RoomDesigner', tab: () => this.tab, tabs: () => this.tabRings.map((t, i) => ({ slot: i ? 'floor' : 'wall', x: t.x, y: t.y })),
      cards: () => this.cards.map((c) => ({ ...c, owned: true, equipped: (this.tab === 'wall' ? this.theme.wallId : this.theme.floorId) === c.id })),
      buttons: () => ({ ...this.btnPos }), theme: () => ({ ...this.theme }), closing: () => this.closing
    };
    this.cameras.main.fadeIn(dur(200));
  }

  // ---------------------------------------------------------------- miniature of the real room
  private buildMiniRoom() {
    const st = services.save.state, map = getMap('bedroom');
    const data: number[][] = [];
    for (let y = 0; y < map.h; y++) {
      const row: number[] = [];
      for (let x = 0; x < map.w; x++) row.push(TILE[themedTile(effectiveTile(map, st.flags, x, y), this.theme)]);
      data.push(row);
    }
    const tm = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const ts = tm.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0, 0)!;
    this.layer = tm.createLayer(0, ts, OX, OY)!.setScale(K).setDepth(1);
    this.layer.setPosition(OX, OY);
    const put = (key: string, frame: number | undefined, x: number, bottom: number, depth: number, ox = 0, dy = 0) => {
      const img = this.add.image(OX + (x + ox) * K, OY + (bottom + dy) * K, key, frame).setOrigin(0.5, 1).setScale(K).setDepth(depth);
      return img;
    };
    for (const p of map.props) {
      if (p.showWhen && !st.flags[p.showWhen]) continue;
      if (!this.textures.exists(p.key)) continue;
      const bottom = (p.y + 1) * 16;
      put(p.key, p.key === 'items' ? p.frame : (this.textures.get(p.key).frameTotal > 2 ? 0 : undefined), p.x * 16 + 8 + (p.ox ?? 0), bottom, 5 + bottom / 1000);
    }
    for (const [slotId, decorId] of Object.entries(st.bedroom)) {
      const d = decorById(decorId), sl = slotById(slotId);
      if (!d || !sl || !this.textures.exists(d.sprite.key)) continue;
      const bottom = (sl.y + 1) * 16;
      put(d.sprite.key, d.sprite.frame, sl.x * 16 + 8 + (d.ox ?? 0), bottom, d.layer === 'floor' ? 2 : 6 + bottom / 1000, 0, d.dy ?? 0);
    }
  }

  private applyThemeToMini() {
    const st = services.save.state, map = getMap('bedroom');
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const base = effectiveTile(map, st.flags, x, y);
      const t: TileName = themedTile(base, this.theme);
      this.layer.putTileAt(TILE[t], x, y);
    }
  }

  // ---------------------------------------------------------------- tabs + swatches
  private buildTabs() {
    const items: [string, 'icon_wall' | 'icon_floor', number][] = [['wall', 'icon_wall', 80], ['floor', 'icon_floor', 170]];
    items.forEach(([, icon, y], i) => {
      const x = 276, g = this.add.graphics().setDepth(4);
      this.add.image(x, y, 'ui', UI[icon]).setScale(1.25).setDepth(6);
      const zone = this.add.zone(x, y, 50, 84).setDepth(9).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.selectTab(i === 0 ? 'wall' : 'floor'));
      this.tabRings.push({ x, y, g });
    });
    this.drawTabs();
  }
  private drawTabs() {
    this.tabRings.forEach((t, i) => {
      const on = (i === 0) === (this.tab === 'wall');
      t.g.clear();
      t.g.fillStyle(on ? 0xffe27a : 0xf1e6ff, 1).fillRoundedRect(t.x - 24, t.y - 38, 48, 76, 10);
      t.g.lineStyle(on ? 4 : 2, on ? 0xff8a1f : 0xc9b8ff, 1).strokeRoundedRect(t.x - 24, t.y - 38, 48, 76, 10);
      if (on) t.g.fillStyle(0xff8a1f, 1).fillTriangle(t.x + 24, t.y - 7, t.x + 24, t.y + 7, t.x + 32, t.y);
    });
  }
  private selectTab(t: Tab) {
    if (this.closing || t === this.tab) return;
    this.tab = t; lastTab.v = t === 'floor' ? 1 : 0;
    services.audio.sfx('pop');
    this.drawTabs(); this.renderCards();
  }

  private renderCards() {
    this.cardObjs.forEach((o) => o.destroy()); this.cardObjs = []; this.cards = [];
    const list = this.tab === 'wall' ? WALLS : FLOORS;
    const cur = this.tab === 'wall' ? this.theme.wallId : this.theme.floorId;
    list.forEach((def, i) => {
      const cx = 354 + (i % 2) * 98, cy = 54 + Math.floor(i / 2) * 64, w = 92, h = 58;
      this.cards.push({ id: def.id, x: cx, y: cy, w, h });
      const on = def.id === cur;
      const bg = this.add.graphics().setDepth(7);
      bg.fillStyle(0xffffff, 1).fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      bg.lineStyle(on ? 5 : 2, on ? 0xffb300 : 0xd9cdf2, 1).strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 10);
      this.cardObjs.push(bg);
      // a 4x2 patch of the real tiles (scale 1.5 = 24 px each): paper over skirting, or alternating floor tiles
      const names: TileName[] = this.tab === 'wall'
        ? [(def as typeof WALLS[0]).paper, (def as typeof WALLS[0]).paper, (def as typeof WALLS[0]).paper, (def as typeof WALLS[0]).paper, (def as typeof WALLS[0]).skirt, (def as typeof WALLS[0]).skirt, (def as typeof WALLS[0]).skirt, (def as typeof WALLS[0]).skirt]
        : [0, 1, 0, 1, 1, 0, 1, 0].map((k) => (k ? (def as typeof FLOORS[0]).b : (def as typeof FLOORS[0]).a));
      const s = 1.35, tw = 16 * s, x0 = cx - 2 * tw, y0 = cy - tw;
      const mask = this.make.graphics({ x: 0, y: 0 }, false).fillStyle(0xffffff).fillRoundedRect(cx - w / 2 + 5, cy - h / 2 + 5, w - 10, h - 10, 7);
      names.forEach((n, k) => {
        const im = this.add.image(x0 + (k % 4) * tw, y0 + Math.floor(k / 4) * tw, 'tiles', TILE[n]).setOrigin(0, 0).setScale(s).setDepth(8);
        im.setMask(mask.createGeometryMask());
        this.cardObjs.push(im);
      });
      this.cardObjs.push(mask);
      if (on) {
        const bx = cx + w / 2 - 9, by = cy - h / 2 + 9;
        const badge = this.add.graphics().setDepth(11);
        badge.fillStyle(0xffb300, 1).fillCircle(bx, by, 12).lineStyle(2, 0x40255a, 1).strokeCircle(bx, by, 12);
        const chk = this.add.image(bx, by, 'ui', UI.icon_check).setScale(0.55).setDepth(12);
        this.cardObjs.push(badge, chk);
      }
    });
  }

  // ---------------------------------------------------------------- pointer: choose on release
  private cardAt(x: number, y: number) { return this.cards.find((c) => Math.abs(x - c.x) <= c.w / 2 && Math.abs(y - c.y) <= c.h / 2) ?? null; }
  private onDown(p: Phaser.Input.Pointer) { this.down = { id: this.cardAt(p.x, p.y)?.id ?? null }; this.downAt = { x: p.x, y: p.y }; }
  private downAt = { x: 0, y: 0 };
  private onUp(p: Phaser.Input.Pointer) {
    const d = this.down; this.down = null;
    if (!d || !d.id || this.closing) return;
    if (Math.hypot(p.x - this.downAt.x, p.y - this.downAt.y) > 14) return;
    const c = this.cardAt(p.x, p.y);
    if (c && c.id === d.id) this.choose(c.id);
  }
  private choose(id: string) {
    const t = services.save.state.roomTheme;
    if (this.tab === 'wall') t.wallId = id; else t.floorId = id;
    services.save.save();
    services.audio.sfx('sparkle');
    this.applyThemeToMini();
    this.renderCards();
    if (!reducedEffects()) burst(this, OX + 192 * K, OY + 144 * K, 8, 30);
  }

  // ---------------------------------------------------------------- done
  private buildAccept() {
    const x = 432, y = 350;
    const c = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    g.fillStyle(0x40255a, 0.35).fillRoundedRect(-62, -22, 128, 52, 26);
    g.fillStyle(0x6fdc7a, 1).fillRoundedRect(-64, -26, 128, 52, 26).lineStyle(4, 0x2b8a3e, 1).strokeRoundedRect(-64, -26, 128, 52, 26);
    const ic = this.add.image(0, 0, 'ui', UI.icon_check).setScale(1.5);
    c.add([g, ic]).setSize(128, 52).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => { if (this.time.now - this.openedAt > 350) this.close(); });
    this.btnPos.accept = { x, y };
  }

  private close() {
    if (this.closing) return;
    this.closing = true;
    services.save.save();
    this.scene.resume('World');
    this.scene.resume('UI');
    this.scene.get('World').events.emit('station-closed');
    this.scene.stop();
  }
}

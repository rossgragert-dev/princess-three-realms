import Phaser from 'phaser';
import { applyOverworldLook } from '../art/looks';
import { themedTile } from '../content/roomThemes';
import type { Form, GameState, PuzzleDef, QuestFlag, SceneId } from '../types/game';
import type { MapDef, ObjDef, PropDef, Tile } from '../world/types';
import type { Line } from '../content/dialogue';
import { getMap } from '../world/maps';
import {
  approachTile, blockKey, effectiveTile, findPath, makeGrid, nearestPassable, safeSpawn, visibleObjects, withinRadius, type NavGrid
} from '../world/navigation';
import { guideTarget, OBJECTIVE_NARRATION } from '../world/guide';
import { interact, lampPlaced, onArrive, session, type StoryCtx } from '../world/story';
import { Player, tilePos } from '../actors/player';
import { narrationForPlan, planFormChange } from '../actors/transformations';
import { completeFlag, nextObjective } from '../systems/questEngine';
import { services, applySettingsToAudio } from '../systems/services';
import { reducedEffects, sparkleCount, dur } from '../systems/accessibility';
import { ACTIVITY_REWARD, TAG_SESSION_STARS, WAND_TINT, grantDecor, syncWandUnlocks } from '../content/family';
import { newTag, stepTag, type TagState } from '../world/tag';
import { COOLDOWN_MS, Effects, REACTIONS, SHOT_TILES_PER_SEC, facingVector, fly, ready, targetsOf, type SpellTarget } from '../world/spells';
import { FURNITURE, LayoutEditor, furnitureBlockedTiles, hasItem, spot, tableUnder, type PlacedItem } from '../content/furniture';
import { ITEM, TILE, UI } from '../content/frameIndex';
import type { UIScene } from './UIScene';

const T = 16;

interface InitData { scene?: SceneId; spawn?: string; resume?: boolean }

/** One scene class renders all five maps (data-driven). Heavy logic lives in the tested pure modules. */
export class WorldScene extends Phaser.Scene {
  private map!: MapDef;
  private grid!: NavGrid;
  private player!: Player;
  private ui!: UIScene;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private busy = false;
  private leaving = false;
  private idleMs = 0;
  private objSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private objPos = new Map<string, Tile>();
  private props: { def: PropDef; sprite: Phaser.GameObjects.Sprite }[] = [];
  private decorSprites: Phaser.GameObjects.GameObject[] = [];
  /** Tiles blocked by big furniture (rebuilt whenever the layout changes). */
  private furnBlocked = new Set<number>();
  editor?: LayoutEditor;
  private waterCells: { x: number; y: number; phase: number }[] = [];
  private waterTick = 0;
  private treeSprite?: Phaser.GameObjects.Sprite;
  private init0: InitData = {};

  constructor() { super('World'); }

  private get state(): GameState { return services.save.state; }

  init(data: InitData) { this.init0 = data ?? {}; }

  // ------------------------------------------------------------------ build
  create() {
    const st = this.state;
    const id = this.init0.scene ?? st.scene;
    this.map = getMap(id);
    this.leaving = false;
    this.busy = false;
    this.idleMs = 0;
    this.objSprites.clear(); this.objPos.clear(); this.props = []; this.decorSprites = []; this.furnBlocked = new Set(); this.revealQueue = []; this.waterCells = [];
    this.treeSprite = undefined;
    this.waterTick = 0;

    // keep the form valid for the place
    if (this.map.medium === 'water') st.form = 'mermaid';
    else if (st.form === 'mermaid' && !this.map.mermaidAllowed) st.form = 'princess';
    st.scene = id;

    this.cameras.main.setBackgroundColor(this.map.bg);
    this.buildGround();
    this.buildProps();
    this.buildObjects();

    this.refreshFurnBlocked();
    this.grid = makeGrid(this.map, st.flags, st.form, this.furnBlocked);
    const wanted = this.init0.resume && st.tile ? st.tile : this.map.spawns[this.init0.spawn ?? st.spawn];
    const start = safeSpawn(this.grid, wanted);
    this.player = new Player(this, st.form, start);
    this.player.teleport(start);
    this.state.tile = { ...start };

    this.setupCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.onResize));
    if (this.map.medium === 'water') this.addUnderwater();
    this.applyFlags(false);
    this.renderDecor();
    this.cameras.main.fadeIn(dur(300));

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onTap(p));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.input.off('pointerdown'); });

    services.audio.startMusic(this.map.music);
    services.save.save();
    this.connectUi();
    (window as unknown as { __ptr?: unknown }).__ptr = this.debugHook();
  }

  private connectUi() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui = this.scene.get('UI') as UIScene;
    this.scene.bringToTop('UI');
    const ready = () => {
      this.ui.handlers = {
        form: (f) => void this.changeForm(f),
        home: () => this.goHome(),
        hint: () => void this.hint(true),
        book: () => this.openOverlay('Stickerbook'),
        decorate: () => this.beginDecorate(),
        settings: () => this.openOverlay('ParentSettings'),
        action: () => this.actionPress(),
        magic: () => void this.magicPress()
      };
      this.ui.hideCount();
      this.ui.refresh();
      this.busy = true;
      void onArrive(this.ctx).then(async () => {
        if (this.map.id === 'bedroom' && this.state.wardrobe.pending.length && !this.revealQueue.some((q) => q.startsWith('w:'))) {
          // an older save may have finished many quests: celebrate the first three, quietly add the rest to her wardrobe
          const pend = this.state.wardrobe.pending;
          for (const w of pend.slice(0, 3)) this.revealQueue.push('w:' + w);
          this.state.wardrobe.pending = pend.slice(0, 3);
          services.save.save();
          await this.flushReveals();
        }
      }).finally(() => { this.busy = false; });
    };
    if (this.ui.sys.settings.status === Phaser.Scenes.RUNNING) ready();
    else this.ui.events.once(Phaser.Scenes.Events.CREATE, ready);
  }

  private buildGround() {
    const m = this.map, flags = this.state.flags;
    const data: number[][] = [];
    for (let y = 0; y < m.h; y++) {
      const row: number[] = [];
      for (let x = 0; x < m.w; x++) {
        const name = effectiveTile(m, flags, x, y);
        row.push(TILE[this.map.id === 'bedroom' ? themedTile(name, this.state.roomTheme) : name]);
        if (/^water[0-3]$/.test(name)) this.waterCells.push({ x, y, phase: (x + y) % 4 });
      }
      data.push(row);
    }
    const tm = this.make.tilemap({ data, tileWidth: T, tileHeight: T });
    const ts = tm.addTilesetImage('tiles', 'tiles', T, T, 0, 0, 0)!;
    this.layer = tm.createLayer(0, ts, 0, 0)!.setDepth(-10);
  }

  private makeSprite(key: string, x: number, y: number, frame?: number, anim?: string, scale = 1, originY = 1) {
    const s = this.add.sprite(x, y, key, frame).setOrigin(0.5, originY).setScale(scale);
    if (anim && this.anims.exists(anim)) s.play(anim);
    return s;
  }

  private buildProps() {
    for (const p of this.map.props) {
      const s = this.makeSprite(p.key, p.x * T + T / 2 + (p.ox ?? 0), (p.y + 1) * T, p.frame, p.anim);
      s.setDepth((p.y + 1) * T + (p.depthBias ?? 0));
      this.props.push({ def: p, sprite: s });
    }
    if (this.map.id === 'bedroom') {
      // picture cues so a child can find the two customization stations: bobbing wardrobe / mirror icons
      for (const [key, icon, x, y] of [['wardrobe_prop', 'icon_wardrobe', 32, 152], ['vanity_prop', 'icon_mirror', 352, 170], ['paint_prop', 'icon_brush', 104, 212]] as const) {
        if (!this.props.some((q) => q.def.key === key)) continue;
        const cue = this.add.image(x, y, 'ui', UI[icon]).setDepth(9000).setScale(0.6).setAlpha(0.95);
        if (!reducedEffects()) this.tweens.add({ targets: cue, y: y - 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      }
    }
  }

  private buildObjects() {
    for (const o of this.map.objects) {
      this.objPos.set(o.id, { x: o.x, y: o.y });
      let spr: Phaser.GameObjects.Sprite | undefined;
      if (o.sprite) {
        const isNpc = o.sprite.key.startsWith('npc_');
        spr = this.makeSprite(o.sprite.key, o.x * T + T / 2, (o.y + 1) * T - (isNpc ? 2 : 0), o.sprite.frame, o.sprite.anim, o.sprite.scale ?? 1, isNpc ? 0.95 : 1);
      } else if (o.kind === 'npc' && this.textures.exists(`npc_${o.id}`)) {
        spr = this.makeSprite(`npc_${o.id}`, o.x * T + T / 2, (o.y + 1) * T, 0, `${o.id}_idle`);
        if (o.id === 'tree') this.treeSprite = spr;
      }
      if (spr) { spr.setDepth(spr.y); this.objSprites.set(o.id, spr); }
    }
  }

  /** Blue water tint over the whole grotto plus slow rising bubbles (calmer effects: tint only). */
  private addUnderwater() {
    const w = this.map.w * T, h = this.map.h * T;
    const water = this.add.rectangle(0, 0, w, h, 0x9fe0ff, 1).setOrigin(0).setDepth(8000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    if (!reducedEffects()) this.tweens.add({ targets: water, alpha: 0.8, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    if (reducedEffects()) return;
    for (let i = 0; i < 14; i++) {
      const b = this.add.sprite(Phaser.Math.Between(16, w - 16), Phaser.Math.Between(16, h - 16), 'items', ITEM.bubble).setDepth(8001).setAlpha(0.7).setScale(0.6 + Math.random() * 0.5);
      this.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(50, 110), x: b.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: Phaser.Math.Between(3500, 6500), repeat: -1, delay: Phaser.Math.Between(0, 4000),
        onRepeat: () => { b.y = Phaser.Math.Between(h / 2, h - 8); b.x = Phaser.Math.Between(16, w - 16); b.alpha = 0.7; } });
    }
  }

  private setupCamera() {
    const cam = this.cameras.main, w = this.map.w * T, h = this.map.h * T, vw = cam.width, vh = cam.height;
    cam.setBounds(w < vw ? -(vw - w) / 2 : 0, h < vh ? -(vh - h) / 2 : 0, Math.max(w, vw), Math.max(h, vh));
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
  }

  // ------------------------------------------------------------------ flag-driven visuals
  /** Re-derives everything that depends on quest flags. Called at build time and whenever a flag changes. */
  private applyFlags(animated: boolean) {
    const st = this.state, flags = st.flags;
    for (const g of this.map.gates) {
      for (const t of g.tiles) {
        const name = effectiveTile(this.map, flags, t.x, t.y);
        const idx = TILE[name];
        if (this.layer.getTileAt(t.x, t.y)?.index !== idx) {
          this.layer.putTileAt(idx, t.x, t.y);
          if (animated && flags[g.flag] && g.openTile) this.sparkleAt(t.x, t.y, 6);
        }
      }
    }
    for (const o of this.map.objects) {
      const vis = visibleObjects(this.map, flags).includes(o);
      const s = this.objSprites.get(o.id);
      s?.setVisible(vis);
      if (o.id === 'wand_pedestal' && flags.WAND_LIT) s?.setFrame(2);
      if (o.id === 'star_pedestal' && flags.STAR_1_FOUND) s?.setFrame(2);
      if (o.kind === 'chest' && o.reward && st.stickers.includes(o.reward)) s?.setFrame(ITEM.chest_open);
      if ((o.id.startsWith('carrot_') || o.id.startsWith('starfish_')) && session.counted[o.id.startsWith('c') ? 'carrots' : 'starfish']?.has(o.id)) s?.setAlpha(0.35);
      if (o.id.startsWith('bloom_') && session.bloomed.has(o.id)) s?.setFrame(ITEM.bloom1);
    }
    for (const { def, sprite } of this.props) {
      if (def.showWhen) sprite.setVisible(!!flags[def.showWhen]);
      if (def.flagFrame && flags[def.flagFrame.flag]) sprite.setFrame(def.flagFrame.frame);
    }
    if (this.treeSprite && flags.TREE_GATE_OPEN) {
      const home = this.objPos.get('tree')!;
      const tx = home.x * T + T / 2 - 4 * T;
      if (animated) this.tweens.add({ targets: this.treeSprite, x: tx, duration: dur(900), ease: 'Sine.InOut' });
      else this.treeSprite.x = tx;
    }
    this.grid = makeGrid(this.map, flags, st.form, this.furnBlocked);
  }

  // ------------------------------------------------------------------ bedroom decorating
  private refreshFurnBlocked() {
    this.furnBlocked = new Set();
    if (this.map.id !== 'bedroom') return;
    for (const t of furnitureBlockedTiles(this.state.bedroomLayout)) this.furnBlocked.add(blockKey(t.x, t.y));
  }

  /** Draws every placed piece. `pop` (an instance id) gets a little bounce-in. */
  private renderDecor(pop?: string) {
    this.decorSprites.forEach((d) => d.destroy());
    this.decorSprites = [];
    if (this.map.id !== 'bedroom') return;
    const layout = this.editor?.layout ?? this.state.bedroomLayout;
    for (const p of layout) {
      const d = FURNITURE[p.item];
      if (!d) continue;
      const table = tableUnder(layout, p);
      const at = spot(d, p.x, p.y, table ? FURNITURE[table.item] : undefined);
      const s = this.makeSprite(d.key, at.x + (d.ox ?? 0), at.y + (d.dy ?? 0), d.frame).setDepth(at.depth);
      if (p.flip) s.setFlipX(true);
      this.decorSprites.push(s);
      if (p.id === pop) {
        this.tweens.add({ targets: s, scale: { from: 0.4, to: 1 }, duration: dur(300), ease: 'Back.Out' });
        this.sparkleAt(p.x + Math.floor(d.w / 2), p.y + d.h - 1, 8);
      }
    }
  }

  /** The layout changed (placed, moved, put away, undone): redraw, rebuild walking, save. */
  layoutChanged(layout: PlacedItem[], pop?: string) {
    this.state.bedroomLayout = layout.map((p) => ({ ...p }));
    this.refreshFurnBlocked();
    this.grid = makeGrid(this.map, this.state.flags, this.player.form, this.furnBlocked);
    this.renderDecor(pop);
    services.save.save();
  }

  /** Never leave her standing inside a new piece of furniture. */
  private freeThePrincess() {
    if (this.grid.passable(this.player.tile.x, this.player.tile.y)) return;
    const t = safeSpawn(this.grid, this.player.tile);
    this.player.teleport(t);
    this.state.tile = { ...t };
  }

  // ------------------------------------------------------------------ decorate mode
  beginDecorate() {
    if (this.map.id !== 'bedroom' || this.editing || this.busy || this.leaving || this.ui.modal) return;
    this.editing = true;
    this.player.endSteer(); this.player.stop();
    this.editor = new LayoutEditor(this.state.bedroomLayout, () => this.state.unlockedDecor);
    this.ui.setEditing(true);
    const cam = this.cameras.main;
    cam.stopFollow(); cam.setZoom(1); this.decorScroll();
    this.scene.launch('Decorate', { world: this });
  }

  /** Centres the 384x288 bedroom above the bottom sheet, whatever the screen shape. */
  private decorScroll() {
    const cam = this.cameras.main, roomW = this.map.w * T, roomH = this.map.h * T;
    const top = Math.max(4, Math.floor((cam.height - 86 - roomH) / 2));
    cam.setBounds(-100000, -100000, 200000, 200000);
    cam.setScroll(-Math.floor((cam.width - roomW) / 2), -top);
  }

  /** Rotation / window resize: keep the view valid without restarting or moving the player. */
  private onResize = () => {
    if (!this.player || !this.map) return;
    if (this.editing) this.decorScroll();
    else { this.setupCamera(); }
  };

  /** Called by the Decorate scene when the child is done. */
  async endDecorate() {
    const layout = this.editor?.layout ?? this.state.bedroomLayout;
    this.editor = undefined;
    this.scene.stop('Decorate');
    this.layoutChanged(layout);
    this.freeThePrincess();
    this.editing = false;
    const cam = this.cameras.main;
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.setupCamera();
    this.ui.setEditing(false);
    this.buttonsLockedUntil = performance.now() + 600;
    if (hasItem(layout, 'star_lamp')) { this.busy = true; try { await lampPlaced(this.ctx); } finally { this.busy = false; this.afterAction(); } }
  }

  /** Screen position of a room pixel while decorating (camera is fixed at zoom 1). */
  toScreen(wx: number, wy: number) { const c = this.cameras.main; return { x: (wx - c.scrollX) * c.zoom, y: (wy - c.scrollY) * c.zoom }; }
  tileAtScreen(px: number, py: number): Tile { const w = this.cameras.main.getWorldPoint(px, py); return { x: Math.floor(w.x / T), y: Math.floor(w.y / T) }; }

  // ------------------------------------------------------------------ "new item" reveals
  private revealQueue: string[] = [];
  private async flushReveals() {
    while (this.revealQueue.length) {
      const id = this.revealQueue.shift()!;
      await this.ui.revealDecor(id);
      if (id.startsWith('w:')) { const w = this.state.wardrobe; w.pending = w.pending.filter((x) => x !== id.slice(2)); services.save.save(); }
    }
    this.ui.refresh();
  }

  // ------------------------------------------------------------------ story bridge
  private ctx: StoryCtx = this.makeCtx();

  private makeCtx(): StoryCtx {
    const self = this;
    return {
      get state() { return self.state; },
      get mapId() { return self.map.id; },
      get form() { return self.player.form; },
      get scene() { return self as Phaser.Scene; },
      say: (l: readonly Line[]) => self.ui.say(l),
      choicePuzzle: (d: PuzzleDef, v?: boolean) => self.ui.choicePuzzle(d, v),
      sequencePuzzle: (d: PuzzleDef, p?: string[], v?: boolean) => self.ui.sequencePuzzle(d, p, v),
      showCount: (n: number, t: number) => self.ui.showCount(n, t),
      hideCount: () => self.ui.hideCount(),
      celebrate: (p: string, s?: number) => self.ui.celebrate(p, s),
      complete: (flag: QuestFlag) => {
        const had = new Set(self.state.unlockedDecor);
        const hadWear = new Set(self.state.wardrobe.unlocked);
        const fresh = completeFlag(self.state, flag);
        if (fresh) {
          for (const id of self.state.unlockedDecor) if (!had.has(id)) self.revealQueue.push(id);
          for (const id of self.state.wardrobe.unlocked) if (!hadWear.has(id)) self.revealQueue.push('w:' + id);
          services.save.save(); self.ui.refresh(); self.applyFlags(true);
        }
        return fresh;
      },
      openStation: (which: 'Wardrobe' | 'Vanity' | 'RoomDesigner' | 'Fireworks' | 'WandWorkshop') => self.openStation(which),
      startTag: () => self.startTag(),
      cast: () => self.player.cast(),
      face: (o: ObjDef) => { const p = self.objPos.get(o.id) ?? o; self.player.face(p.x, p.y); },
      react: (id: string) => self.react(id),
      hop: (id: string) => self.hop(id),
      setFrame: (id: string, frame: number) => self.setObjFrame(id, frame),
      moveObject: (id: string, to: Tile) => self.moveObject(id, to),
      requestForm: (f: Form) => self.changeForm(f, true),
      addSticker: (id: string) => {
        const s = self.state;
        if (s.stickers.includes(id)) return false;
        s.stickers.push(id);
        services.save.save();
        self.ui.refresh();
        return true;
      },
      sparkle: (t: Tile) => self.sparkleAt(t.x, t.y, 8)
    };
  }

  private react(id: string) {
    const s = this.objSprites.get(id);
    const cur = s?.anims.currentAnim?.key;
    if (!s || !cur || !cur.endsWith('_idle')) return;
    const react = cur.replace('_idle', '_react');
    if (!this.anims.exists(react)) return;
    s.play(react);
    s.once('animationcomplete', () => s.play(cur));
    this.time.delayedCall(1200, () => { if (s.active) s.play(cur, true); });
  }

  private hop(id: string) {
    const s = this.objSprites.get(id);
    if (!s) return;
    this.tweens.add({ targets: s, y: s.y - 6, duration: dur(120), yoyo: true });
  }

  private setObjFrame(id: string, frame: number) {
    const s = this.objSprites.get(id);
    if (!s) return;
    if (id.startsWith('carrot_') || id.startsWith('starfish_')) { s.setAlpha(0.35); s.stop(); return; }
    s.setFrame(frame);
  }

  private moveObject(id: string, to: Tile): Promise<void> {
    this.objPos.set(id, { ...to });
    const s = this.objSprites.get(id);
    if (!s) return Promise.resolve();
    return new Promise((res) => this.tweens.add({
      targets: s, x: to.x * T + T / 2, y: (to.y + 1) * T, duration: dur(500), ease: 'Sine.Out',
      onUpdate: () => s.setDepth(s.y), onComplete: () => res()
    }));
  }

  private sparkleAt(tx: number, ty: number, n = 8) {
    const x = tx * T + T / 2, y = ty * T + T / 2;
    const count = sparkleCount(n);
    for (let i = 0; i < count; i++) {
      const sp = this.add.sprite(x, y, 'items', ITEM[(['sparkle0', 'sparkle1', 'sparkle2'] as const)[i % 3]]).setDepth(9999);
      this.tweens.add({
        targets: sp, x: x + Phaser.Math.Between(-22, 22), y: y + Phaser.Math.Between(-26, 6), alpha: 0,
        duration: dur(650), onComplete: () => sp.destroy()
      });
    }
  }

  // ------------------------------------------------------------------ input
  private onTap(p: Phaser.Input.Pointer) {
    if (this.leaving || !this.ui || this.tagGame) return;
    this.idleMs = 0;
    if (this.ui.blocksPointer(p.x, p.y)) return;
    if (this.busy) return;
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    const tile: Tile = { x: Math.floor(wp.x / T), y: Math.floor(wp.y / T) };
    this.tapRing(wp.x, wp.y);
    const obj = this.pick(tile);
    if (obj) void this.goTo(obj);
    else this.walkToTile(tile);
  }

  private tapRing(x: number, y: number) {
    const r = this.add.circle(x, y, 4, 0xffffff, 0.8).setDepth(9998);
    this.tweens.add({ targets: r, scale: 3, alpha: 0, duration: dur(350), onComplete: () => r.destroy() });
  }

  private live(o: ObjDef): ObjDef {
    const p = this.objPos.get(o.id) ?? o;
    return { ...o, x: p.x, y: p.y };
  }

  /** The object (if any) under or just above the tapped tile; sprites are often two tiles tall. */
  private pick(t: Tile): ObjDef | undefined {
    let best: ObjDef | undefined, bd = 1.45;
    for (const o of visibleObjects(this.map, this.state.flags)) {
      if (o.kind === 'warp' && !o.sprite) continue; // plain doorways are reached by walking onto them
      const p = this.live(o);
      const d = Math.min(Math.hypot(t.x - p.x, t.y - p.y), Math.hypot(t.x - p.x, t.y - (p.y - 1)) + 0.15);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  private walkToTile(target: Tile, then?: () => void) {
    const goal = this.grid.passable(target.x, target.y) ? target : nearestPassable(this.grid, target, 3);
    if (!goal) { this.bonk(); return; }
    const path = findPath(this.grid, this.player.tile, goal);
    if (!path) { this.bonk(); return; }
    this.player.walk(path, (t) => this.onStep(t), () => { this.afterWalk(); then?.(); });
  }

  /** A friendly nudge instead of an error when a tap cannot be walked to. */
  private bonk() {
    this.tweens.add({ targets: this.player.sprite, y: this.player.sprite.y - 3, yoyo: true, duration: 90 });
  }

  private async goTo(o: ObjDef) {
    const p = this.live(o);
    if (o.kind === 'warp') {
      const tiles = o.tiles ?? [{ x: p.x, y: p.y }];
      const nearest = [...tiles].sort((a, b) => Math.hypot(a.x - this.player.tile.x, a.y - this.player.tile.y) - Math.hypot(b.x - this.player.tile.x, b.y - this.player.tile.y))[0];
      this.walkToTile(nearest);
      return;
    }
    if (withinRadius(this.player.tile, p)) { await this.runInteract(o); return; }
    const to = approachTile(this.grid, this.player.tile, p);
    if (!to) { this.bonk(); return; }
    const path = findPath(this.grid, this.player.tile, to);
    if (!path) { this.bonk(); return; }
    this.player.walk(path, (t) => this.onStep(t), () => { this.afterWalk(); void this.runInteract(o); });
  }

  private async runInteract(o: ObjDef) {
    if (this.busy) return;
    this.busy = true;
    try { await interact(this.ctx, this.live(o)); await this.flushReveals(); }
    finally { this.busy = false; this.afterAction(); }
  }

  private afterAction() {
    this.state.tile = { ...this.player.tile };
    services.save.save();
    this.ui.refresh();
  }

  private onStep(t: Tile) {
    if (this.tagGame) return; // no accidental warps while playing tag; the exit button is the way out
    for (const o of visibleObjects(this.map, this.state.flags)) {
      if (o.kind !== 'warp' || !o.to || !o.tiles?.some((w) => w.x === t.x && w.y === t.y)) continue;
      if (o.forms && !o.forms.includes(this.player.form)) continue;
      this.travel(o.to.scene, o.to.spawn);
      return;
    }
  }

  private afterWalk() {
    this.state.tile = { ...this.player.tile };
    services.save.save();
  }

  /** Joystick: smooth analog walking. A tapped route or a stale callback never survives the thumb touching the stick. */
  private driveStick(dt: number) {
    const st = this.ui?.steering;
    const can = !!st && st.mag > 0 && !this.busy && !this.leaving && !this.ui.modal && !this.editing;
    if (can) { this.idleMs = 0; this.player.steer(st!, dt, this.grid, (t) => this.onStep(t)); }
    else if (this.player.steering) { this.player.endSteer(); this.afterWalk(); }
  }

  // ------------------------------------------------------------------ A button + magic button
  private cue?: Phaser.GameObjects.Image;
  private cueRing?: Phaser.GameObjects.Graphics;
  private cueMs = 0;
  /** After a room screen closes, a second tap meant for its "done" button must not land on A / magic and reopen it. */
  private buttonsLockedUntil = 0;
  /** True while the furniture editor owns the screen (set by the decorate mode). */
  editing = false;
  private cueTarget: { obj: ObjDef; near: boolean } | null = null;

  /** The friend / thing the A button would act on: the nearest one in reach, else the nearest one on screen (A walks there first). */
  private contextTarget(): { obj: ObjDef; near: boolean } | null {
    const me = this.player.tile;
    let best: { obj: ObjDef; near: boolean; score: number } | null = null;
    for (const o of visibleObjects(this.map, this.state.flags)) {
      if (o.kind === 'warp') continue;
      const p = this.live(o);
      const d = Math.hypot(me.x - p.x, me.y - p.y);
      const near = withinRadius(me, p);
      if (!near && d > 10) continue;
      const score = d + (near ? 0 : 20);
      if (!best || score < best.score) best = { obj: o, near, score };
    }
    return best;
  }

  private updateCue(dt: number) {
    this.cueMs += dt;
    if (this.cueMs < 120) return;
    this.cueMs = 0;
    const hidden = this.busy || this.leaving || !this.ui || this.ui.modal || this.player.moving;
    const t = hidden ? null : this.contextTarget();
    this.cueTarget = t;
    this.ui?.setAction(!t ? 'none' : t.near ? 'near' : 'far');
    if (!this.cue) {
      this.cue = this.add.image(0, 0, 'ui', UI.icon_a).setScale(0.5).setDepth(9500).setVisible(false);
      this.cueRing = this.add.graphics().setDepth(9400).setVisible(false);
      this.tweens.add({ targets: this.cue, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    if (!t) { this.cue.setVisible(false); this.cueRing!.setVisible(false); return; }
    const p = this.live(t.obj);
    const spr = this.objSprites.get(t.obj.id);
    const top = spr ? spr.y - spr.displayHeight - 8 : p.y * T - 6;
    this.cue.setPosition(p.x * T + T / 2, top).setAlpha(t.near ? 1 : 0.5).setVisible(true);
    this.cueRing!.clear().setVisible(true);
    this.cueRing!.lineStyle(2, 0xffffff, t.near ? 0.9 : 0.4).strokeEllipse(p.x * T + T / 2, (p.y + 1) * T - 2, 22, 9);
  }

  /** A: act on the highlighted thing. In reach -> do it. Highlighted but far -> walk there, then do it. Nothing -> a gentle nudge. */
  private actionPress() {
    if (this.busy || this.leaving || this.editing || this.ui?.modal || performance.now() < this.buttonsLockedUntil) return;
    this.idleMs = 0;
    const t = this.contextTarget();
    if (!t) { this.bonk(); void this.hint(false); return; }
    void this.goTo(t.obj);
  }

  /** Magic: the form's spell. Next to something that needs it (a bloom) it acts on it; otherwise it is a pretty sparkle. */
  private async magicPress() {
    if (this.busy || this.leaving || this.ui?.modal || performance.now() < this.buttonsLockedUntil) return;
    this.idleMs = 0;
    const me = this.player.tile;
    if (this.player.form === 'unicorn') {
      const bloom = visibleObjects(this.map, this.state.flags).find((o) => o.id.startsWith('bloom_') && withinRadius(me, this.live(o)));
      if (bloom) { void this.goTo(bloom); return; }
    }
    if (this.player.form === 'princess') {
      if (!ready(performance.now(), this.lastShot)) return;
      this.shootWand();
      // she keeps walking while she zaps with the other thumb; standing still she waves the wand (not blocking, so zaps stay snappy)
      if (!this.player.steering && !this.player.moving) void this.player.cast();
      return;
    } else { services.audio.sfx(this.player.form === 'mermaid' ? 'splash' : 'sparkle'); this.sparkleAt(me.x, me.y - 1, 10); }
    this.busy = true;
    try { await this.player.cast(); } finally { this.busy = false; }
  }

  // ------------------------------------------------------------------ princess wand projectile
  private lastShot = -1e9;
  private shots: { id?: string; kind?: string; dist: number; blocked: boolean; wand?: string; dir?: string }[] = [];
  private readonly spellFx = new Effects();
  private fountainSpray?: Phaser.Time.TimerEvent;

  private shootWand() {
    this.lastShot = performance.now();
    const foot = this.player.foot, from = { x: foot.x / T, y: foot.y / T };
    const targets = targetsOf(this.map);
    const a = { dir: facingVector(this.player.dir) };
    const f = fly(from, a.dir, targets, (x, y) => !this.grid.passable(x, y));
    const wandNow = this.state.equippedWand;
    this.shots.push({ id: f.hit?.id, kind: f.hit?.kind, dist: f.dist, blocked: f.blocked, wand: `${wandNow.headId}/${wandNow.colorId}/${wandNow.trailId}`, dir: this.player.dir });
    if (this.shots.length > 40) this.shots.shift();
    services.audio.sfx('wand');
    const sx = foot.x + a.dir.x * 8, sy = foot.y - 10 + a.dir.y * 4;
    const ex = f.end.x * T, ey = f.end.y * T - 10;
    const wand = this.state.equippedWand;
    const bolt = this.add.image(sx, sy, this.textures.exists(`bolt_${wand.colorId}`) ? `bolt_${wand.colorId}` : 'fx_bolt').setDepth(9999);
    const trailKey = this.textures.exists(`trail_${wand.trailId}`) ? `trail_${wand.trailId}` : 'fx_trail';
    const tints = WAND_TINT[wand.colorId]; let ti = 0;
    const flight = Math.max(80, (f.dist / SHOT_TILES_PER_SEC) * 1000);
    if (!reducedEffects()) {
      this.tweens.add({ targets: bolt, angle: 360, duration: 500, repeat: -1 });
      this.tweens.add({ targets: bolt, scale: { from: 0.8, to: 1.15 }, duration: 120, yoyo: true, repeat: -1 });
    }
    let last = 0;
    this.tweens.add({
      targets: bolt, x: ex, y: ey, duration: flight, ease: 'Sine.Out',
      onUpdate: () => {
        if (reducedEffects() || performance.now() - last < 38) return;
        last = performance.now();
        const t = this.add.image(bolt.x + Phaser.Math.Between(-2, 2), bolt.y + Phaser.Math.Between(-2, 2), trailKey).setDepth(9998).setAlpha(0.9);
        if (wand.colorId === 'rainbow') t.setTint(tints[ti++ % tints.length]);
        this.tweens.add({ targets: t, alpha: 0, scale: 0.2, y: t.y + (wand.trailId === 'bubble' ? -8 : 6), duration: 380, onComplete: () => t.destroy() });
      },
      onComplete: () => {
        bolt.destroy();
        if (f.hit) this.spellReact(f.hit); else this.sparkleAt(Math.floor(f.end.x), Math.floor(f.end.y), 5);
      }
    });
  }

  private propSpriteFor(t: SpellTarget): Phaser.GameObjects.Sprite | undefined {
    const m = /#(\d+)$/.exec(t.id); return m ? this.props[Number(m[1])]?.sprite : undefined;
  }

  private puff(x: number, y: number, key: string, n: number, spread: number, rise: number, ms: number, fall = false) {
    for (let i = 0; i < sparkleCount(n); i++) {
      const sp = this.add.image(x + Phaser.Math.Between(-spread, spread), y + Phaser.Math.Between(-6, 6), key).setDepth(9999).setAngle(Phaser.Math.Between(0, 360));
      this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-spread, spread), y: sp.y + (fall ? Phaser.Math.Between(18, 34) : -rise), alpha: 0, angle: sp.angle + Phaser.Math.Between(-120, 120), duration: dur(ms + Phaser.Math.Between(0, 400)), delay: fall ? i * 30 : 0, onComplete: () => sp.destroy() });
    }
  }

  private spellReact(t: SpellTarget) {
    const r = REACTIONS[t.kind], now = performance.now();
    const fresh = this.spellFx.start(t.id, r.ms, now);
    services.audio.sfx(r.sfx);
    const tx = t.x * T, ty = t.y * T;
    const spr = this.propSpriteFor(t);
    if (spr && !reducedEffects()) this.tweens.add({ targets: spr, angle: { from: -3, to: 3 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => spr.setAngle(0) });
    if (t.kind === 'tree') {
      this.puff(tx, ty - 34, 'fx_petal', 16, 22, 6, 1400, true);
      if (fresh) { const apples = 2 + (Math.abs(Math.round(t.x * 7 + t.y * 3)) % 3); for (let i = 0; i < apples; i++) { const a = this.add.image(tx + Phaser.Math.Between(-14, 14), ty - 30 - i * 4, 'fx_apple').setDepth(9999); this.tweens.add({ targets: a, y: ty + 10 + i * 3, duration: dur(450 + i * 120), ease: 'Bounce.Out', onComplete: () => this.tweens.add({ targets: a, alpha: 0, delay: dur(r.ms - 900), duration: dur(600), onComplete: () => a.destroy() }) }); } }
      this.sparkleAt(Math.round(t.x - 0.5), Math.round(t.y - 1), 8);
    } else if (t.kind === 'fountain') {
      this.startSpray(tx, ty, r.ms);
    } else if (t.kind === 'flower') {
      this.puff(tx, ty - 4, 'fx_petal', 12, 14, 26, 900);
      const g = this.add.image(tx, ty, 'fx_glow').setDepth(9990).setAlpha(0.8).setScale(0.8);
      this.tweens.add({ targets: g, alpha: 0, scale: 1.6, duration: dur(900), onComplete: () => g.destroy() });
    } else if (t.kind === 'glow') {
      const g = this.add.image(tx, ty - 4, 'fx_glow').setDepth(5).setAlpha(0.9).setScale(1.1);
      if (!reducedEffects()) this.tweens.add({ targets: g, alpha: 0.45, scale: 1.5, duration: 500, yoyo: true, repeat: Math.max(1, Math.floor(r.ms / 1000)) });
      this.tweens.add({ targets: g, alpha: 0, delay: dur(r.ms), duration: dur(500), onComplete: () => g.destroy() });
      this.sparkleAt(Math.round(t.x - 0.5), Math.round(t.y - 0.5), 8);
    } else {
      this.puff(tx, ty - 10, 'fx_glow', 6, 30, 14, 800);
      for (let i = 0; i < sparkleCount(3); i++) { const b = this.add.image(tx + (i - 1) * 16, ty - 8, 'fx_flutter').setDepth(9999); this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-50, 50), y: b.y - Phaser.Math.Between(40, 70), alpha: 0, scaleY: { from: 1, to: 0.5 }, duration: dur(1800), yoyo: false, onComplete: () => b.destroy() }); }
      this.sparkleAt(Math.round(t.x - 0.5), Math.round(t.y - 0.5), 10);
    }

  }

  /** Taller fountain spray for a few seconds; shooting it again just keeps it going. */
  private startSpray(x: number, y: number, ms: number) {
    this.sprayUntil = performance.now() + ms;
    if (this.fountainSpray) return;
    const jet = this.add.image(x, y - 8, 'fx_jet').setOrigin(0.5, 1).setDepth(9999).setScale(1, 0.2);
    this.tweens.add({ targets: jet, scaleY: reducedEffects() ? 1.1 : 1.7, duration: dur(280), ease: 'Back.Out' });
    this.fountainSpray = this.time.addEvent({
      delay: reducedEffects() ? 220 : 90, loop: true,
      callback: () => {
        if (performance.now() > this.sprayUntil) {
          this.fountainSpray?.remove(); this.fountainSpray = undefined;
          this.tweens.add({ targets: jet, scaleY: 0.1, alpha: 0, duration: dur(300), onComplete: () => jet.destroy() });
          return;
        }
        const d = this.add.image(x + Phaser.Math.Between(-4, 4), y - 8 - 40, 'fx_drop').setDepth(9999);
        this.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-26, 26), y: y + 2, alpha: 0.2, duration: dur(560), ease: 'Quad.In', onComplete: () => d.destroy() });
      }
    });
  }
  private sprayUntil = 0;

  // ------------------------------------------------------------------ scene travel
  private travel(scene: SceneId, spawn: string) {
    if (this.leaving) return;
    this.leaving = true;
    this.player.stop();
    const st = this.state;
    st.scene = scene;
    st.spawn = spawn;
    delete st.tile;
    services.save.save();
    this.ui.hideCount();
    this.cameras.main.fadeOut(dur(250));
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ scene, spawn } as InitData));
  }

  private goHome() {
    if (this.busy || this.leaving) return;
    if (this.map.id === 'bedroom') return;
    this.travel('bedroom', 'from_courtyard');
  }

  private stationOpen = false;
  /** Opens the full-screen Wardrobe/Vanity; resolves when she finishes (the look is refreshed first). */
  private openStation(which: 'Wardrobe' | 'Vanity' | 'RoomDesigner' | 'Fireworks' | 'WandWorkshop'): Promise<void> {
    if (this.stationOpen) return Promise.resolve();
    this.stationOpen = true;
    return new Promise<void>((resolve) => {
      this.events.once('station-closed', () => {
        this.buttonsLockedUntil = performance.now() + 800;
        this.stationOpen = false;
        this.refreshLook();
        this.applyRoomTheme();
        services.save.save();
        resolve();
      });
      this.scene.pause('World');
      this.scene.pause('UI');
      this.scene.launch(which);
      this.scene.bringToTop(which);
    });
  }

  /** Redraw the bedroom's wallpaper and floor from the saved theme. Cosmetic only: the walkable grid is untouched. */
  private applyRoomTheme() {
    if (this.map.id !== 'bedroom' || !this.layer) return;
    for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++)
      this.layer.putTileAt(TILE[themedTile(effectiveTile(this.map, this.state.flags, x, y), this.state.roomTheme)], x, y);
  }

  /** Re-colour the animated princess/mermaid from the saved look. Same textures and animations, new pixels. */
  refreshLook() { applyOverworldLook(this, this.state.appearance); }

  private openOverlay(key: 'Stickerbook' | 'ParentSettings') {
    if (this.busy) return;
    this.scene.pause('World');
    this.scene.pause('UI');
    this.scene.launch(key);
    this.scene.bringToTop(key);
  }

  // ------------------------------------------------------------------ transformations
  async changeForm(target: Form, fromStory = false) {
    if ((this.busy && !fromStory) || this.leaving) return;
    const st = this.state;
    const plan = planFormChange(this.map, st.flags, this.player.tile, this.player.form, target);
    if (plan.mode === 'same') return;
    const key = narrationForPlan(plan, target);
    if (plan.mode === 'unavailable') {
      if (key) void services.audio.speak(key);
      this.bonk();
      return;
    }
    const wasBusy = this.busy;
    this.busy = true;
    try {
      if (plan.mode === 'walk') {
        const path = findPath(this.grid, this.player.tile, plan.to);
        if (path && path.length > 1) await new Promise<void>((res) => this.player.walk(path, undefined, () => res()));
      }
      this.transformNow(target);
      if (key) void services.audio.speak(key);
      if (plan.mode === 'walk' && plan.step) {
        await new Promise<void>((res) => this.player.walk([this.player.tile, plan.step!], undefined, () => res()));
      }
    } finally {
      this.busy = wasBusy;
      this.afterAction();
    }
  }

  private transformNow(target: Form) {
    const st = this.state;
    services.audio.sfx('sparkle');
    this.sparkleAt(this.player.tile.x, this.player.tile.y, 14);
    this.player.setForm(target);
    st.form = target;
    this.grid = makeGrid(this.map, st.flags, target, this.furnBlocked);
    this.cameras.main.flash(dur(200), 255, 255, 255);
    this.ui.refresh();
  }

  // ------------------------------------------------------------------ gentle guidance
  private async hint(speak: boolean) {
    if (this.busy) return;
    const st = this.state;
    const step = nextObjective(st);
    if (speak && step) {
      const key = OBJECTIVE_NARRATION[step.flag];
      if (key) void services.audio.speak(key);
    }
    this.ui.pulseHint(false);
    const g = guideTarget(st, this.map.id, this.player.form);
    if (g.type === 'home') { this.drawBounce(this.player.tile); return; }
    if (g.type === 'decorate') { this.ui.pulseDecorate(true); this.time.delayedCall(4000, () => this.ui?.pulseDecorate(false)); return; }
    if (g.type !== 'object') return;
    const obj = this.map.objects.find((o) => o.id === g.obj);
    if (!obj) return;
    const p = this.live(obj);
    const dest = obj.kind === 'warp' ? (obj.tiles?.[0] ?? p) : p;
    const to = obj.kind === 'warp' ? dest : approachTile(this.grid, this.player.tile, p);
    const path = to ? findPath(this.grid, this.player.tile, to) : null;
    this.drawTrail(path ?? this.line(this.player.tile, dest));
    this.drawBounce(dest);
  }

  private line(a: Tile, b: Tile): Tile[] {
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return Array.from({ length: n + 1 }, (_, i) => ({ x: Math.round(a.x + ((b.x - a.x) * i) / Math.max(n, 1)), y: Math.round(a.y + ((b.y - a.y) * i) / Math.max(n, 1)) }));
  }

  private drawTrail(path: Tile[]) {
    const pts = path.filter((_, i) => i % 2 === 1).slice(0, 24);
    pts.forEach((t, i) => {
      const s = this.add.sprite(t.x * T + T / 2, t.y * T + T / 2, 'items', ITEM.sparkle1).setDepth(9000).setAlpha(0);
      this.tweens.add({ targets: s, alpha: { from: 0, to: 1 }, delay: i * dur(90), duration: dur(250), yoyo: true, hold: dur(500), onComplete: () => s.destroy() });
    });
  }

  // ------------------------------------------------------------------ Unicorn Tag (meadow)
  private tagGame?: { s: TagState; spr: Phaser.GameObjects.Sprite; mark: Phaser.GameObjects.Image; end: () => void; stars: number; ended: boolean };

  /** Starts a session of tag with Dapple. Resolves when the child finishes three rounds or taps the exit button. */
  private startTag(): Promise<void> {
    const spr = this.objSprites.get('dapple');
    if (this.tagGame || !spr || this.map.id !== 'meadow' || this.player.form !== 'unicorn') return Promise.resolve();
    return new Promise<void>((resolve) => {
      const pal = { x: spr.x, y: spr.y - 6 };
      const mark = this.add.image(spr.x, spr.y - 40, 'items', ITEM.star).setDepth(9999).setVisible(false);
      this.tweens.add({ targets: mark, y: '-=4', duration: dur(420), yoyo: true, repeat: -1 });
      const game = { s: newTag(pal, this.player.foot), spr, mark, stars: 0, ended: false, end: () => {} };
      game.end = () => this.endTag(game, resolve);
      this.tagGame = game;
      this.busy = false; // the joystick works as usual while the game runs
      this.ui.setTagMode(true, () => this.endTagEarly());
      this.ui.setTally(0);
      this.hearts(spr.x, spr.y - 26, 4);
      services.audio.sfx('sparkle');
    });
  }

  private endTagEarly() { this.tagGame?.end(); }

  private hearts(x: number, y: number, n: number) {
    for (let i = 0; i < sparkleCount(n); i++) {
      const h = this.add.image(x + (i - n / 2) * 8, y, 'fx_heart').setDepth(9999).setScale(1.2);
      this.tweens.add({ targets: h, y: y - 26 - (i % 3) * 8, x: h.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: dur(900), delay: i * 70, onComplete: () => h.destroy() });
    }
  }

  private tagTick(dt: number) {
    const g = this.tagGame;
    if (!g || g.ended) return;
    const r = stepTag(g.s, dt, this.player.foot, this.grid);
    const s = g.s;
    g.spr.setPosition(s.pal.x, s.pal.y + 6).setDepth(s.pal.y + 6);
    const anim = `dapple_${s.moving ? (s.phase === 'companionIt' ? 'gallop' : 'walk') : 'idle'}_${s.facing}`;
    if (g.spr.anims.currentAnim?.key !== anim && this.anims.exists(anim)) g.spr.play(anim, true);
    // who is "it": a gold star over Dapple means "tag her!", a heart over the princess means "Dapple is chasing you"
    g.mark.setVisible(s.phase === 'playerIt').setPosition(g.spr.x, g.spr.y - 40);
    for (const ev of r.events) {
      if (ev === 'tagged') { g.stars = s.stars; this.ui.setTally(s.stars); services.audio.sfx('chime'); this.hearts(g.spr.x, g.spr.y - 24, 6); this.sparkleAt(Math.floor(s.pal.x / T), Math.floor(s.pal.y / T), 8); }
      else if (ev === 'caught') { services.audio.sfx('pop'); this.hearts(this.player.sprite.x, this.player.sprite.y - 24, 3); }
      else if (ev === 'invite' || ev === 'roundStart') { services.audio.sfx('sparkle'); this.hop('dapple'); }
      else if (ev === 'celebrate') { services.audio.sfx('bloom'); this.sparkleAt(Math.floor(s.pal.x / T), Math.floor(s.pal.y / T), 14); this.ui.celebrate('icon_star', 4); }
      else if (ev === 'done') g.end();
    }
  }

  private endTag(g: NonNullable<WorldScene['tagGame']>, resolve: () => void) {
    if (g.ended) return;
    g.ended = true;
    const done = g.s.stars >= TAG_SESSION_STARS;
    const st = this.state, a = st.activities.tag;
    a.tags += g.s.stars;
    if (done) {
      a.sessions++;
      if (grantDecor(st, ACTIVITY_REWARD.tag)) this.revealQueue.push(ACTIVITY_REWARD.tag);
      syncWandUnlocks(st);
    }
    g.mark.destroy();
    const tile = { x: Math.floor(g.s.pal.x / T), y: Math.floor(g.s.pal.y / T) };
    this.objPos.set('dapple', tile);
    g.spr.play('dapple_idle_down', true);
    this.tagGame = undefined;
    this.ui.setTagMode(false);
    this.afterAction();
    resolve();
  }

  private drawBounce(t: Tile) {
    const s = this.add.sprite(t.x * T + T / 2, t.y * T - 6, 'items', ITEM.star).setDepth(9999);
    this.tweens.add({ targets: s, y: s.y - 6, yoyo: true, repeat: 4, duration: dur(300), onComplete: () => s.destroy() });
  }

  // ------------------------------------------------------------------ per-frame
  update(_t: number, dt: number) {
    if (!this.player) return;
    this.driveStick(dt);
    this.player.update(dt);
    if (!reducedEffects() && this.waterCells.length) {
      this.waterTick += dt;
      if (this.waterTick > 520) {
        this.waterTick = 0;
        for (const c of this.waterCells) { c.phase = (c.phase + 1) % 4; this.layer.putTileAt(TILE[`water${c.phase}` as 'water0'], c.x, c.y); }
      }
    }
    if (this.tagGame) this.tagTick(dt);
    this.updateCue(dt);
    const idle = !this.busy && !this.tagGame && !this.player.moving && !(this.ui && this.ui.modal);
    this.idleMs = idle ? this.idleMs + dt : 0;
    if (this.idleMs > 12000 && this.idleMs - dt <= 12000) { void this.hint(false); this.ui?.pulseHint(true); }
    if (this.idleMs > 24000) { this.idleMs = -20000; void this.hint(true); }
  }

  /** Small hook for browser tests (Playwright) and for manual debugging on an iPad via Safari Web Inspector. */
  private debugHook() {
    return {
      state: () => this.state,
      scene: () => this.map.id,
      tile: () => ({ ...this.player.tile }),
      form: () => this.player.form,
      tapTile: (x: number, y: number) => {
        const world = { x: x * T + T / 2, y: y * T + T / 2 };
        const cam = this.cameras.main;
        const sx = (world.x - cam.scrollX) * cam.zoom, sy = (world.y - cam.scrollY) * cam.zoom;
        this.onTap({ x: sx, y: sy } as Phaser.Input.Pointer);
      },
      tapObject: (id: string) => { const o = this.map.objects.find((q) => q.id === id); if (o) void this.goTo(o); },
      changeForm: (f: Form) => this.changeForm(f),
      home: () => this.goHome(),
      busy: () => this.busy,
      modal: () => !!this.ui?.modal,
      setNarration: (on: boolean) => { this.state.settings.narration = on; applySettingsToAudio(); },
      layout: () => (this.editor?.layout ?? this.state.bedroomLayout).map((p) => ({ ...p })),
      editing: () => this.editing,
      puzzleCards: () => this.ui.puzzleCards.map((c) => ({ ...c })),
      moving: () => this.player.moving,
      steering: () => this.player.steering,
      foot: () => this.player.foot,
      stick: (x: number, y: number, mag: number) => { this.ui.debugStick = mag > 0 ? { x, y, mag } : null; },
      action: () => this.actionPress(),
      magic: () => void this.magicPress(),
      shots: () => this.shots.map((q) => ({ ...q })),
      tag: () => (this.tagGame ? { phase: this.tagGame.s.phase, stars: this.tagGame.s.stars, pal: { ...this.tagGame.s.pal }, t: this.tagGame.s.t, ended: this.tagGame.ended, tally: this.ui.tallyState, exit: this.ui.exitPos } : null),
      sprayOn: () => !!this.fountainSpray,
      effectsOn: () => this.spellFx.count(performance.now()),
      cooldown: COOLDOWN_MS,
      cue: () => (this.cueTarget ? { id: this.cueTarget.obj.id, near: this.cueTarget.near } : null),
      uiButtons: () => this.ui.buttonPos,
      dialogueText: () => this.ui.dialogueText,
      playerPx: () => ({ x: this.player.sprite.x, y: this.player.sprite.y }),
      panel: () => this.ui?.panel ?? null,
      playerXY: () => { const c = this.cameras.main; return { x: this.player.sprite.x - c.scrollX, y: this.player.sprite.y - c.scrollY }; },
      tilePos,
      openStation: (w: 'Wardrobe' | 'Vanity' | 'RoomDesigner' | 'Fireworks' | 'WandWorkshop') => this.openStation(w),
      refreshLook: () => this.refreshLook(),
      dumpTexture: (k: string) => (this.textures.get(k).getSourceImage() as HTMLCanvasElement).toDataURL(),
      playerSprite: () => ({ tex: this.player.sprite.texture.key, frame: this.player.sprite.frame.name })
    };
  }
}

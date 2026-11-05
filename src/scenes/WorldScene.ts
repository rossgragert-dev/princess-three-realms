import Phaser from 'phaser';
import { applyOverworldLook } from '../art/looks';
import type { Form, GameState, PuzzleDef, QuestFlag, SceneId } from '../types/game';
import type { MapDef, ObjDef, PropDef, Tile } from '../world/types';
import type { Line } from '../content/dialogue';
import { getMap } from '../world/maps';
import {
  approachTile, effectiveTile, findPath, makeGrid, nearestPassable, safeSpawn, visibleObjects, withinRadius, type NavGrid
} from '../world/navigation';
import { guideTarget, OBJECTIVE_NARRATION } from '../world/guide';
import { interact, onArrive, session, type StoryCtx } from '../world/story';
import { Player, tilePos } from '../actors/player';
import { narrationForPlan, planFormChange } from '../actors/transformations';
import { completeFlag, nextObjective } from '../systems/questEngine';
import { services, applySettingsToAudio } from '../systems/services';
import { reducedEffects, sparkleCount, dur } from '../systems/accessibility';
import { DECOR, SLOTS, slotById, slotHasNewOption } from '../content/decorCatalog';
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
  private slotMarks: Phaser.GameObjects.Sprite[] = [];
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
    this.objSprites.clear(); this.objPos.clear(); this.props = []; this.decorSprites = []; this.slotMarks = []; this.revealQueue = []; this.waterCells = [];
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

    this.grid = makeGrid(this.map, st.flags, st.form);
    const wanted = this.init0.resume && st.tile ? st.tile : this.map.spawns[this.init0.spawn ?? st.spawn];
    const start = safeSpawn(this.grid, wanted);
    this.player = new Player(this, st.form, start);
    this.player.teleport(start);
    this.state.tile = { ...start };

    this.setupCamera();
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
        settings: () => this.openOverlay('ParentSettings'),
        dpad: (dx, dy) => this.dpadStep(dx, dy)
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
        row.push(TILE[name]);
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
      for (const [key, icon, x, y] of [['wardrobe_prop', 'icon_wardrobe', 32, 152], ['vanity_prop', 'icon_mirror', 352, 170]] as const) {
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
    const cam = this.cameras.main, w = this.map.w * T, h = this.map.h * T, vw = 512, vh = 384;
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
    this.grid = makeGrid(this.map, flags, st.form);
    this.renderSlotMarks();
  }

  // ------------------------------------------------------------------ bedroom decorating
  /** Draw every placed item at its hotspot. `popSlot` (the item just placed) gets a little bounce-in. */
  private renderDecor(popSlot?: string) {
    this.decorSprites.forEach((d) => d.destroy());
    this.decorSprites = [];
    if (this.map.id !== 'bedroom') return;
    for (const [slotId, decorId] of Object.entries(this.state.bedroom)) {
      const d = DECOR[decorId];
      const sl = slotById(slotId);
      if (!d || !sl) continue;
      const x = sl.x * T + T / 2 + (d.ox ?? 0);
      const bottom = (sl.y + 1) * T + (d.dy ?? 0);
      const s = this.makeSprite(d.sprite.key, x, bottom, d.sprite.frame);
      s.setDepth(d.layer === 'floor' ? 1 : d.layer === 'wall' ? 50 : bottom + (decorId === 'canopy_bed' ? 1 : 0));
      this.decorSprites.push(s);
      if (slotId === popSlot) {
        this.tweens.add({ targets: s, scale: { from: 0.4, to: 1 }, duration: dur(300), ease: 'Back.Out' });
        this.sparkleAt(sl.x, sl.y, 8);
      }
    }
    this.renderSlotMarks();
  }

  /** Gentle sparkles on hotspots where something unlocked can still be placed. */
  private renderSlotMarks() {
    this.slotMarks.forEach((s) => s.destroy());
    this.slotMarks = [];
    if (this.map.id !== 'bedroom') return;
    for (const sl of SLOTS) {
      if (!slotHasNewOption(sl.id, this.state.unlockedDecor, this.state.bedroom)) continue;
      const m = this.makeSprite('items', sl.x * T + T / 2, (sl.y + 1) * T - 4, undefined, 'sparkle').setDepth(9500).setScale(1.3);
      this.tweens.add({ targets: m, y: m.y - 4, yoyo: true, repeat: -1, duration: 700 });
      this.slotMarks.push(m);
    }
  }

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
      openStation: (which: 'Wardrobe' | 'Vanity') => self.openStation(which),
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
      renderDecor: (slot?: string) => self.renderDecor(slot),
      pickDecor: (slot: string, cur: string | undefined) => self.ui.pickDecor(slot, cur),
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
    if (this.leaving || !this.ui) return;
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

  /** One tile in a direction (on-screen arrows). Walking into a friend or object interacts with it. */
  private dpadStep(dx: number, dy: number) {
    if (this.busy || this.leaving || this.player.moving) return;
    this.idleMs = 0;
    const from = this.player.tile, to = { x: from.x + dx, y: from.y + dy };
    this.player.face(to.x, to.y);
    if (this.grid.passable(to.x, to.y)) {
      this.player.walk([from, to], (t) => this.onStep(t), () => this.afterWalk());
      return;
    }
    const obj = this.pick(to);
    if (obj && obj.kind !== 'warp') void this.goTo(obj);
    else this.bonk();
  }

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
  private openStation(which: 'Wardrobe' | 'Vanity'): Promise<void> {
    if (this.stationOpen) return Promise.resolve();
    this.stationOpen = true;
    return new Promise<void>((resolve) => {
      this.events.once('station-closed', () => {
        this.stationOpen = false;
        this.refreshLook();
        services.save.save();
        resolve();
      });
      this.scene.pause('World');
      this.scene.pause('UI');
      this.scene.launch(which);
      this.scene.bringToTop(which);
    });
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
    this.grid = makeGrid(this.map, st.flags, target);
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

  private drawBounce(t: Tile) {
    const s = this.add.sprite(t.x * T + T / 2, t.y * T - 6, 'items', ITEM.star).setDepth(9999);
    this.tweens.add({ targets: s, y: s.y - 6, yoyo: true, repeat: 4, duration: dur(300), onComplete: () => s.destroy() });
  }

  // ------------------------------------------------------------------ per-frame
  update(_t: number, dt: number) {
    if (!this.player) return;
    this.player.update(dt);
    if (!reducedEffects() && this.waterCells.length) {
      this.waterTick += dt;
      if (this.waterTick > 520) {
        this.waterTick = 0;
        for (const c of this.waterCells) { c.phase = (c.phase + 1) % 4; this.layer.putTileAt(TILE[`water${c.phase}` as 'water0'], c.x, c.y); }
      }
    }
    const idle = !this.busy && !this.player.moving && !(this.ui && this.ui.modal);
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
      pickerCards: () => this.ui.pickerCards.map((c) => ({ ...c })),
      puzzleCards: () => this.ui.puzzleCards.map((c) => ({ ...c })),
      moving: () => this.player.moving,
      panel: () => this.ui?.panel ?? null,
      playerXY: () => { const c = this.cameras.main; return { x: this.player.sprite.x - c.scrollX, y: this.player.sprite.y - c.scrollY }; },
      tilePos,
      openStation: (w: 'Wardrobe' | 'Vanity') => this.openStation(w),
      refreshLook: () => this.refreshLook(),
      dumpTexture: (k: string) => (this.textures.get(k).getSourceImage() as HTMLCanvasElement).toDataURL(),
      playerSprite: () => ({ tex: this.player.sprite.texture.key, frame: this.player.sprite.frame.name })
    };
  }
}

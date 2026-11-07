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
import { interact, lampPlaced, onArrive, pearlBubbleHit, session, type StoryCtx } from '../world/story';
import { BUBBLE_RANGE, PEARL_LANE_X, bubbleShot, isSocketX } from '../world/pearl';
import { SlotPool, TRAIL, TrailPlanner, flowerLook, isGrassTile } from '../world/trail';
import { ensureTrailTextures, flowerKey, hornOffset } from '../art/unicornFx';
import { bubbleTexture, ensureMermaidTextures, wandPose } from '../art/mermaidFx';
import { Player, tilePos } from '../actors/player';
import { narrationForPlan, planFormChange } from '../actors/transformations';
import { completeFlag, nextObjective } from '../systems/questEngine';
import { services, applySettingsToAudio } from '../systems/services';
import { reducedEffects, sparkleCount, dur } from '../systems/accessibility';
import { ACTIVITY_REWARD, TAG_SESSION_STARS, WAND_TINT, grantDecor, syncWandUnlocks } from '../content/family';
import { newTag, stepTag, type TagState } from '../world/tag';
import { COOLDOWN_MS, HORN_RANGE, Effects, REACTIONS, SHOT_TILES_PER_SEC, facingVector, fly, ready, targetsOf, type SpellTarget } from '../world/spells';
import { FURNITURE, LayoutEditor, furnitureBlockedTiles, hasItem, spot, tableUnder, type PlacedItem } from '../content/furniture';
import { ITEM, TILE, UI } from '../content/frameIndex';
import type { UIScene } from './UIScene';
import { KingdomLayer } from './kingdomLayer';
import { envTargets } from '../world/envMagic';
import type { KingdomApi } from '../world/kingdomStory';
import { bakeProbe } from '../ui/creativePanels';
import { PetCareStage } from './petCareStage';
import { PET_TYPES } from '../content/kingdom';
import { SPECIES_CARE, isCheerful, record as recordCare, type CareKind } from '../world/petCare';
import { FOODS, toppingOffset, TOPPING_SCALE, type FoodId } from '../world/foodDesign';
import { KITCHEN_STATIONS } from '../world/castleMaps';
import { petKey } from '../content/kingdom';
import { GITEM, LAWNS, tileOpen, type GPlaced } from '../content/gardenCatalog';
import { GardenEditor, blockedByGarden, checkGarden } from '../world/gardenRules';

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
  private foodLayers: Phaser.GameObjects.Image[] = [];
  private treeSlide: Promise<void> = Promise.resolve();
  private treeSlideBusy = false;
  private init0: InitData = {};
  private kingdom?: KingdomLayer;

  constructor() { super('World'); }

  private get state(): GameState { return services.save.state; }

  init(data: InitData) { this.init0 = data ?? {}; }

  // ------------------------------------------------------------------ build
  create() {
    const st = this.state;
    const id = this.init0.scene ?? st.scene;
    this.map = getMap(id);
    // v0.4d.3: runtime-only tap targets that follow her bed and her pet (kept out of the map data so the furniture rules ignore them)
    if (id === 'bedroom') this.map = { ...this.map, objects: [...this.map.objects, { id: 'bed_sleep', kind: 'station', x: 7, y: 5, radius: 2.4 }, { id: 'bedroom_pet', kind: 'station', x: -9, y: -9, radius: 1.6 }] };
    this.leaving = false;
    this.busy = false;
    this.idleMs = 0;
    this.carrySprite = undefined; this.gardenSprites = []; this.gardenTimer = undefined; this.gardenEditor = undefined; this.petSprite = undefined; this.petTimers = [];
    this.trailSprites = []; this.trailPool = new SlotPool(TRAIL.max); this.trailPlan.reset();
    this.merWand = undefined; this.pearlCue = undefined; this.pearlReplay = undefined; this.pearlCueKey = ''; this.pearlBusy = false;
    this.objSprites.clear(); this.objPos.clear(); this.props = []; this.decorSprites = []; this.furnBlocked = new Set(); this.revealQueue = []; this.waterCells = [];
    this.treeSprite = undefined;
    this.kingdom = undefined;
    this.waterTick = 0;

    // keep the form valid for the place
    if (this.map.medium === 'water') st.form = 'mermaid';
    else if (st.form === 'mermaid' && !this.map.mermaidAllowed) st.form = 'princess';
    st.scene = id;

    this.cameras.main.setBackgroundColor(this.map.bg);
    this.buildGround();
    this.buildProps();
    this.foodLayers = [];
    this.refreshFoods();
    this.buildObjects();
    this.buildKingdom();

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
    this.syncBedroomObjects();
    this.renderGarden();
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
      if (p.key === 'none') continue; // reserved floor only (the pet-home corner)
      const s = this.makeSprite(p.key, p.x * T + T / 2 + (p.ox ?? 0), (p.y + 1) * T, p.frame, p.anim);
      s.setDepth((p.y + 1) * T + (p.depthBias ?? 0));
      this.props.push({ def: p, sprite: s });
    }
    // v0.4d: the free-floating wardrobe / mirror / easel icons are gone. The furniture itself (which already glows)
    // is the tap target, so nothing floats in the room that does nothing when touched.
  }

  private buildObjects() {
    for (const o0 of this.map.objects) {
      // A finished pearl rests in its shell socket on every later visit; tapping it plays again.
      const o = o0.id === 'pearl' && this.state.flags.PEARL_PLACED ? { ...o0, x: PEARL_LANE_X[PEARL_LANE_X.length - 1] } : o0;
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
      if (animated && this.treeSprite.x !== tx) this.treeSlide = this.slideTree(tx);
      else if (!this.treeSlideBusy) this.treeSprite.x = tx;
    }
    this.grid = makeGrid(this.map, flags, st.form, this.furnBlocked);
    this.kingdom?.applyFlags(animated);
  }

  private foodSprite(id: FoodId): Phaser.GameObjects.Sprite | undefined {
    const st = KITCHEN_STATIONS.find((q) => q.id === id);
    return st ? this.props.find((q) => q.def.key === st.dish && q.def.x === st.x)?.sprite : undefined;
  }

  /** Kitchen stands show exactly what she made: the dish with her toppings where she put them, until she eats it or decorates again. */
  private refreshFoods() {
    if (this.map.id !== 'kitchen') return;
    this.foodLayers.forEach((i) => i.destroy()); this.foodLayers = [];
    const foods = this.state.kingdom.food;
    for (const id of Object.keys(FOODS) as FoodId[]) {
      const spr = this.foodSprite(id); if (!spr) continue;
      const spec = FOODS[id], design = foods[id];
      spr.setScale(1.15).setVisible(!design?.eaten);
      if (!design || design.eaten) continue;
      const f = spr.scale / spec.baseScale, c = spr.getCenter();
      design.toppings.forEach((t, i) => {
        const o = toppingOffset(spec, t, i);
        this.foodLayers.push(this.add.image(c.x! + o.dx * f, c.y! + o.dy * f, t.key).setScale(TOPPING_SCALE * f).setDepth(spr.depth + 1 + i * 0.01));
      });
    }
  }

  /** Eat it bite by bite (no rewards, nothing else changes), then the stand is empty until she decorates again. */
  private async eatFood(id: FoodId): Promise<void> {
    const spr = this.foodSprite(id);
    const c = spr?.getCenter();
    const bites = reducedEffects() ? 1 : 3;
    for (let b = 0; b < bites; b++) {
      services.audio.sfx('pop');
      if (c) this.sparkleAt(c.x! / T, c.y! / T, 3);
      const k = 1 - (b + 1) / bites;
      await new Promise<void>((res) => this.tweens.add({ targets: [spr, ...this.foodLayers], alpha: Math.max(0.05, k), duration: dur(260), onComplete: () => res() }));
    }
    this.state.kingdom.food[id] = { toppings: [], eaten: true };
    spr?.setAlpha(1);
    this.refreshFoods();
    if (c) this.sparkleAt(c.x! / T, c.y! / T, 8);
    services.save.save();
  }

  /** The talking tree rumbles and slides four tiles aside so everyone can see the gate open (reduced effects: snaps, with a sparkle). */
  private slideTree(tx: number): Promise<void> {
    const tree = this.treeSprite;
    if (!tree) return Promise.resolve();
    this.treeSlideBusy = true;
    const done = () => { this.treeSlideBusy = false; tree.x = tx; };
    if (reducedEffects()) { done(); this.sparkleAt(tx / T, tree.y / T - 1, 8); return Promise.resolve(); }
    return new Promise((resolve) => {
      this.cameras.main.shake(1700, 0.0018);
      const tick = this.time.addEvent({ delay: 180, repeat: 9, callback: () => this.sparkleAt(tree.x / T, tree.y / T - 0.5, 3) });
      this.tweens.add({ targets: tree, x: tx, duration: 1800, ease: 'Sine.InOut', onComplete: () => { tick.remove(); done(); this.sparkleAt(tx / T, tree.y / T - 1, 8); resolve(); } });
    });
  }

  /** v0.4c: the Enchanted Woods, Royal Magic Garden and Shimmering River carry a living layer; other maps skip it. */
  private buildKingdom() {
    if (!this.map.env?.length && this.map.id !== 'gallery') return;
    this.kingdom = new KingdomLayer({
      scene: this, map: this.map, state: () => this.state, props: this.props,
      objSprite: (id) => this.objSprites.get(id),
      setObjPos: (id, t) => this.objPos.set(id, { ...t }),
      playerPos: () => { const f = this.player.foot; return { x: f.x / T, y: f.y / T }; },
      ctx: () => this.ctx, ui: () => this.ui, sparkle: (x, y, n) => this.sparkleAt(x, y, n)
    });
  }

  // ------------------------------------------------------------------ v0.4d.3 bed, sleep and pet
  private petSprite?: Phaser.GameObjects.Sprite;
  private petTile: Tile = { x: 14, y: 14 };
  private petTimers: Phaser.Time.TimerEvent[] = [];
  private sleeping = false;

  private bedItem(): PlacedItem | undefined {
    return this.state.bedroomLayout.find((p) => FURNITURE[p.item]?.group === 'beds');
  }

  /** Keeps the bed's tap target on the bed, and the pet on a free floor tile. */
  private syncBedroomObjects() {
    if (this.map.id !== 'bedroom') return;
    const bed = this.bedItem(), d = bed ? FURNITURE[bed.item] : undefined;
    this.objPos.set('bed_sleep', bed && d ? { x: bed.x + Math.floor(d.w / 2), y: bed.y + d.h - 1 } : { x: -9, y: -9 });
    this.buildPet();
  }

  private petBusy = false;
  private petHome?: Phaser.GameObjects.Image;
  private petFree = (t: Tile) => this.grid.passable(t.x, t.y) && t.x >= 1 && t.x <= 22 && t.y >= 4 && t.y <= 15 && !(t.x >= 10 && t.x <= 13 && t.y >= 14) && !(t.x === this.player?.tile.x && t.y === this.player?.tile.y);
  private petStage?: PetCareStage;
  petCareLog() { return this.petStage?.log ?? null; }

  private startPetIdle() {
    const s = this.petSprite;
    if (s && !reducedEffects()) this.tweens.add({ targets: s, scaleY: { from: 1, to: 0.94 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  /** Feed, water or play with the pet (bedroom only). Gentle: nothing is ever consumed, lost or required. */
  async petDo(kind: CareKind, variant?: string): Promise<void> {
    const pet = this.state.kingdom.pet, s = this.petSprite;
    if (!pet || !s || this.map.id !== 'bedroom' || this.petBusy) return;
    const stage = this.petStage = new PetCareStage({
      scene: this, sprite: () => this.petSprite, tile: () => this.petTile,
      setTile: (t) => { this.petTile = t; this.objPos.set('bedroom_pet', { ...t }); },
      grid: () => this.grid, free: (t) => this.petFree(t), playerTile: () => this.player.tile, ui: () => this.ui,
      setBusy: (b) => {
        this.petBusy = b; this.petTimers.forEach((t) => { t.paused = b; });
        if (b) { this.tweens.killTweensOf(s); s.setScale(1).setAngle(0); } else { s.setScale(1).setAngle(0).setFrame(0); this.startPetIdle(); }
      }
    }, PET_TYPES[pet.type]);
    this.tweens.killTweensOf(s);
    if (kind === 'feed') await stage.feed(variant ?? '');
    else if (kind === 'water') await stage.water();
    else await stage.play();
    this.state.kingdom.petCare = recordCare(this.state.kingdom.petCare, kind);
    services.save.save();
  }

  private buildPet() {
    const pet = this.state.kingdom.pet;
    this.petTimers.forEach((t) => t.remove(false)); this.petTimers = [];
    this.petSprite?.destroy(); this.petSprite = undefined;
    this.petHome?.destroy(); this.petHome = undefined;
    this.objPos.set('bedroom_pet', { x: -9, y: -9 });
    if (!pet || this.map.id !== 'bedroom') return;
    const free = (t: Tile) => this.grid.passable(t.x, t.y) && !(t.x >= 10 && t.x <= 13 && t.y >= 14) && !(t.x === this.player?.tile.x && t.y === this.player?.tile.y);
    if (!free(this.petTile)) {
      const t = nearestPassable(this.grid, { x: 14, y: 13 }, 6);
      if (t) this.petTile = t;
    }
    this.petHome = this.add.image(21 * T, 16 * T, SPECIES_CARE[PET_TYPES[pet.type]].home).setOrigin(0.5, 1).setDepth(16 * T);
    const key = petKey(pet);
    const s = this.add.sprite(this.petTile.x * T + T / 2, (this.petTile.y + 1) * T, key, 0).setOrigin(0.5, 1);
    s.setDepth(s.y); this.petSprite = s;
    this.objPos.set('bedroom_pet', { ...this.petTile });
    // idle animation: a little two-frame flutter plus a gentle bob
    let f = 0;
    this.petTimers.push(this.time.addEvent({ delay: 520, loop: true, callback: () => { f = 1 - f; s.setFrame(f); } }));
    this.startPetIdle();
    this.petTimers.push(this.time.addEvent({ delay: 4200, loop: true, callback: () => this.petWander(free) }));
  }

  private petWander(free: (t: Tile) => boolean) {
    const s = this.petSprite;
    if (!s || !s.active || this.editing || this.sleeping || this.busy || this.petBusy) return;
    if (isCheerful(this.state.kingdom.petCare) && Math.random() < 0.35) { this.petHappy(); return; }
    for (let i = 0; i < 12; i++) {
      const t = i === 0 && Math.random() < 0.25 ? { x: Phaser.Math.Between(20, 21), y: 14 } : { x: this.petTile.x + Phaser.Math.Between(-3, 3), y: this.petTile.y + Phaser.Math.Between(-2, 2) };
      if (t.x < 1 || t.x > 22 || t.y < 4 || t.y > 15 || !free(t) || (t.x === this.petTile.x && t.y === this.petTile.y)) continue;
      this.petTile = t; this.objPos.set('bedroom_pet', { ...t });
      s.setFlipX(t.x < s.x / T);
      this.tweens.add({ targets: s, x: t.x * T + T / 2, y: (t.y + 1) * T, duration: dur(1400), ease: 'Sine.InOut', onUpdate: () => s.setDepth(s.y) });
      return;
    }
  }

  petHappy() {
    const s = this.petSprite;
    if (!s) return;
    services.audio.sfx('pop');
    this.tweens.add({ targets: s, y: s.y - 8, yoyo: true, duration: dur(160), repeat: 1 });
    for (let i = 0; i < sparkleCount(4); i++) {
      const h = this.add.sprite(s.x + (i - 1.5) * 6, s.y - 20, 'items', ITEM.heart).setDepth(9999).setScale(0.6);
      this.tweens.add({ targets: h, y: h.y - 22, alpha: 0, duration: dur(900), delay: i * 90, onComplete: () => h.destroy() });
    }
  }

  private tweenP(cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((res) => this.tweens.add({ ...cfg, onComplete: () => res() }));
  }

  /** Tuck her in: she settles on the bed, the room darkens under moon and stars, it fades, and morning sunlight wakes her. */
  async sleepInBed(): Promise<void> {
    const bed = this.bedItem();
    if (!bed || this.sleeping || this.map.id !== 'bedroom') return;
    this.sleeping = true;
    const d = FURNITURE[bed.item], at = spot(d, bed.x, bed.y);
    const cam = this.cameras.main, W = cam.width, H = cam.height, calm = reducedEffects();
    const extras: Phaser.GameObjects.GameObject[] = [];
    try {
      this.player.endSteer(); this.player.stop();
      const bx = (bed.x + d.w / 2) * T, by = (bed.y + d.h) * T - 3;
      this.player.sprite.setVisible(false);
      this.petSprite?.setVisible(false);
      const sl = this.add.image(bx, by, 'px_sleeper').setOrigin(0.5, 1).setDepth(at.depth + 2).setAlpha(0);
      extras.push(sl);
      services.audio.sfx('shimmer');
      await this.tweenP({ targets: sl, alpha: 1, duration: dur(400) });
      // night falls
      const veil = this.add.rectangle(W / 2, H / 2, W * 6, H * 6, 0x0a1040, 0).setScrollFactor(0).setDepth(8500);
      extras.push(veil);
      await this.tweenP({ targets: veil, fillAlpha: 0.72, duration: dur(1300) });
      // moon and twinkling stars (screen-fixed)
      const moon = this.add.graphics().setScrollFactor(0).setDepth(8600);
      moon.fillStyle(0xfff6c8, 1).fillCircle(0, 0, 16).fillStyle(0x0a1040, 1).fillCircle(7, -3, 13);
      moon.setPosition(W * 0.82, 56).setAlpha(0); extras.push(moon);
      this.tweens.add({ targets: moon, alpha: 1, duration: dur(700) });
      const stars = Math.min(16, Math.floor(W / 40));
      for (let i = 0; i < stars; i++) {
        const sp = this.add.sprite(Phaser.Math.Between(12, W - 12), Phaser.Math.Between(14, Math.floor(H * 0.45)), 'items', ITEM[(['sparkle0', 'sparkle1', 'sparkle2'] as const)[i % 3]]).setScrollFactor(0).setDepth(8600).setAlpha(0.2);
        extras.push(sp);
        if (!calm) this.tweens.add({ targets: sp, alpha: 1, duration: 600 + (i % 5) * 150, yoyo: true, repeat: -1, delay: i * 80 });
        else sp.setAlpha(0.9);
      }
      for (let i = 0; i < 3; i++) {
        const z = this.add.text(bx + 14, by - 18, 'Z', { fontFamily: 'sans-serif', fontStyle: 'bold', fontSize: `${9 + i * 3}px`, color: '#ffffff' }).setDepth(8700).setAlpha(0);
        extras.push(z);
        this.tweens.add({ targets: z, y: z.y - 26 - i * 6, x: z.x + 8 + i * 4, alpha: { from: 0.9, to: 0 }, duration: dur(1500), delay: dur(i * 600), repeat: calm ? 0 : 1 });
      }
      await new Promise<void>((r) => this.time.delayedCall(dur(2800), () => r()));
      // fade to black, then morning
      await this.tweenP({ targets: veil, fillAlpha: 1, duration: dur(900) });
      moon.destroy();
      extras.forEach((e) => { if (e !== veil && e !== sl) e.destroy(); });
      sl.destroy();
      const at2 = nearestPassable(this.grid, { x: bed.x + Math.floor(d.w / 2), y: bed.y + d.h }, 4) ?? this.player.tile;
      this.player.teleport(at2); this.state.tile = { ...at2 };
      this.player.sprite.setVisible(true);
      this.petSprite?.setVisible(true);
      veil.setFillStyle(0xfff0b8, 1);
      services.audio.sfx('chime');
      const beams: Phaser.GameObjects.Rectangle[] = [];
      for (let i = 0; i < 3; i++) {
        const b = this.add.rectangle(W * (0.25 + i * 0.25), H * 0.3, 26, H * 1.4, 0xfff6c0, 0.0).setScrollFactor(0).setDepth(8550).setAngle(-18);
        beams.push(b); this.tweens.add({ targets: b, fillAlpha: 0.28, duration: dur(500), yoyo: true, hold: dur(900) });
      }
      await this.tweenP({ targets: veil, fillAlpha: 0, duration: dur(1800) });
      beams.forEach((b) => b.destroy()); veil.destroy();
      services.audio.sfx('bloom');
      this.sparkleAt(at2.x, at2.y, 10);
      this.petHappy();
    } finally {
      extras.forEach((e) => { if (e.active) e.destroy(); });
      this.player.sprite.setVisible(true);
      this.petSprite?.setVisible(true);
      this.sleeping = false;
    }
  }

  // ------------------------------------------------------------------ v0.4d.4 garden design
  gardenEditor?: GardenEditor;
  private gardenSprites: Phaser.GameObjects.Sprite[] = [];
  private gardenTimer?: Phaser.Time.TimerEvent;

  private renderGarden(pop?: string) {
    this.gardenSprites.forEach((s) => s.destroy()); this.gardenSprites = [];
    this.gardenTimer?.remove(false); this.gardenTimer = undefined;
    if (this.map.id !== 'garden') return;
    const layout = this.gardenEditor?.layout ?? this.state.kingdom.gardenItems;
    for (const p of layout) {
      const it = GITEM[p.item]; if (!it) continue;
      const s = this.add.sprite(p.x * T + (T * it.w) / 2, (p.y + 1) * T, it.key, it.key === 'px_gd_pinwheel' ? 0 : undefined).setOrigin(0.5, 1);
      s.setDepth(it.key === 'px_gd_stones' ? (p.y + 1) * T - 400 : (p.y + 1) * T + 1);
      if (it.key === 'px_gd_stones') s.setDepth(-5);
      this.gardenSprites.push(s);
      if (p.id === pop) { this.tweens.add({ targets: s, scale: { from: 0.4, to: 1 }, duration: dur(300), ease: 'Back.Out' }); this.sparkleAt(p.x, p.y, 8); }
    }
    const wheels = this.gardenSprites.filter((s) => s.texture.key === 'px_gd_pinwheel');
    if (wheels.length && !reducedEffects()) { let f = 0; this.gardenTimer = this.time.addEvent({ delay: 320, loop: true, callback: () => { f = 1 - f; wheels.forEach((s) => s.setFrame(f)); } }); }
  }

  /** The garden design changed (placed, moved, put away, undone): redraw, rebuild walking, save. */
  gardenChanged(layout: GPlaced[], pop?: string) {
    this.state.kingdom.gardenItems = layout.map((p) => ({ ...p }));
    this.refreshFurnBlocked();
    this.grid = makeGrid(this.map, this.state.flags, this.player.form, this.furnBlocked);
    this.renderGarden(pop);
    services.save.save();
  }

  beginGardenEdit() {
    if (this.map.id !== 'garden' || this.editing || this.busy || this.leaving || this.ui.modal) return;
    this.editing = true;
    this.player.endSteer(); this.player.stop();
    this.gardenEditor = new GardenEditor(this.state.kingdom.gardenItems);
    this.ui.setEditing(true);
    // start on the lawn nearest to her
    const me = this.player.tile; let best = 0, bd = 1e9;
    LAWNS.forEach((l, i) => { const d = Math.hypot((l.x0 + l.x1) / 2 - me.x, (l.y0 + l.y1) / 2 - me.y); if (d < bd) { bd = d; best = i; } });
    this.cameras.main.stopFollow(); this.cameras.main.setZoom(1);
    this.showLawn(best);
    this.scene.launch('GardenEdit', { world: this, lawn: best });
  }

  /** Centres a lawn above the bottom sheet. */
  showLawn(i: number) {
    const l = LAWNS[i], cam = this.cameras.main;
    cam.setBounds(-100000, -100000, 200000, 200000);
    cam.setScroll(((l.x0 + l.x1 + 1) / 2) * T - cam.width / 2, ((l.y0 + l.y1 + 1) / 2) * T - (cam.height - 86) / 2);
  }

  endGardenEdit() {
    const layout = this.gardenEditor?.layout ?? this.state.kingdom.gardenItems;
    this.gardenEditor = undefined;
    this.scene.stop('GardenEdit');
    this.gardenChanged(layout);
    this.freeThePrincess();
    this.editing = false;
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.setupCamera();
    this.ui.setEditing(false);
    this.buttonsLockedUntil = performance.now() + 600;
  }

  // ------------------------------------------------------------------ bedroom decorating
  private refreshFurnBlocked() {
    this.furnBlocked = new Set();
    if (this.map.id === 'garden') { for (const k of blockedByGarden(this.state.kingdom.gardenItems)) { const [x, y] = k.split(',').map(Number); this.furnBlocked.add(blockKey(x, y)); } return; }
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
    this.syncBedroomObjects();
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
    if (this.map.id === 'garden') { this.beginGardenEdit(); return; }
    if (this.map.id !== 'bedroom' || this.editing || this.busy || this.leaving || this.ui.modal) return;
    this.editing = true;
    this.player.endSteer(); this.player.stop();
    this.editor = new LayoutEditor(this.state.bedroomLayout, () => this.state.unlockedDecor);
    this.ui.setEditing(true);
    this.petSprite?.setVisible(false);
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
    if (this.editing && this.map.id === 'garden') this.showLawn(0);
    else if (this.editing) this.decorScroll();
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
    this.petSprite?.setVisible(true);
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
      sparkle: (t: Tile) => self.sparkleAt(t.x, t.y, 8),
      get k() { return self.kingdom as unknown as KingdomApi; },
      pickOne: (o: readonly { id: string; picture: string }[]) => self.ui.pickOne(o),
      playRace: (mode) => self.playRace(mode),
      settle: () => self.treeSlide,
      refreshFoods: () => self.refreshFoods(),
      eatFood: (id) => self.eatFood(id),
      travelTo: (scene, spawn) => self.travel(scene, spawn),
      bake: (spec, initial) => self.ui.bake(spec, initial),
      paint: (strokes) => self.ui.paint(strokes),
      save: () => services.save.save(),
      sleepInBed: () => self.sleepInBed(),
      petHappy: () => self.petHappy(),
      petDo: (kind, variant) => self.petDo(kind, variant)
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
    else if (this.map.id === 'garden' && this.state.kingdom.carry && tileOpen(tile.x, tile.y) && checkGarden(this.state.kingdom.gardenItems, this.state.kingdom.carry, tile.x, tile.y).ok) this.walkToTile(tile, () => void this.plantCarried(tile));
    else this.walkToTile(tile);
  }

  /** v0.4d.4: she carried a seed / plant / ornament from the greenhouse: tapping open lawn plants it, a little rain waters it. */
  private async plantCarried(tile: Tile) {
    const kd = this.state.kingdom, item = kd.carry;
    if (!item || this.busy || this.editing) return;
    const c = checkGarden(kd.gardenItems, item, tile.x, tile.y);
    if (!c.ok) return;
    this.busy = true;
    try {
      const tmp = new GardenEditor(kd.gardenItems); const r = tmp.place(item, tile.x, tile.y);
      if ('ok' in r) return;
      this.gardenChanged(tmp.layout, r.id);
      services.audio.sfx('splash');
      for (let i = 0; i < sparkleCount(6); i++) {
        const d = this.add.sprite(tile.x * T + 4 + i * 2, tile.y * T - 18 - (i % 3) * 5, 'px_drop').setDepth(9999);
        this.tweens.add({ targets: d, y: d.y + 22, alpha: 0, duration: dur(520), delay: i * 70, onComplete: () => d.destroy() });
      }
      await new Promise<void>((res) => this.time.delayedCall(dur(700), () => res()));
      services.audio.sfx('bloom');
      this.sparkleAt(tile.x, tile.y, 10);
      if (!kd.gardenTaught) { kd.gardenTaught = true; services.save.save(); }
      this.freeThePrincess();
    } finally { this.busy = false; this.afterAction(); }
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
      if (!ready(performance.now(), this.lastShot)) return;
      const bloom = visibleObjects(this.map, this.state.flags).find((o) => o.id.startsWith('bloom_') && withinRadius(me, this.live(o)));
      this.castHorn(!bloom);
      if (bloom) { void this.goTo(bloom); return; }
      if (!this.player.steering && !this.player.moving) void this.player.cast();
      return;
    }
    if (this.player.form === 'mermaid') {
      if (!ready(performance.now(), this.lastShot)) return;
      this.shootBubble();
      if (!this.player.steering && !this.player.moving) void this.player.cast();
      return;
    }
    if (this.player.form === 'princess') {
      if (!ready(performance.now(), this.lastShot)) return;
      this.shootWand();
      // she keeps walking while she zaps with the other thumb; standing still she waves the wand (not blocking, so zaps stay snappy)
      if (!this.player.steering && !this.player.moving) void this.player.cast();
      return;
    } else { services.audio.sfx('sparkle'); this.sparkleAt(me.x, me.y - 1, 10); }
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
    const targets = [...targetsOf(this.map), ...envTargets(this.map, this.player.form, this.state.flags)];
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

  // ------------------------------------------------------------------ unicorn: flower trail + horn magic (v0.4b.3)
  private trailPlan = new TrailPlanner();
  private trailPool = new SlotPool(TRAIL.max);
  private trailSprites: { flower: Phaser.GameObjects.Image; spark: Phaser.GameObjects.Image }[] = [];
  private lastHornGlint = 0;
  /** Visible flowers right now (for tests). */
  trailCount() { return this.trailPool.count(performance.now()); }

  private hornTip() { const o = hornOffset(this.player.dir), s = this.player.sprite; return { x: s.x + o.x, y: s.y + o.y }; }

  private tileNameAt(px: number, py: number): string {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    if (tx < 0 || ty < 0 || tx >= this.map.w || ty >= this.map.h) return '';
    return effectiveTile(this.map, this.state.flags, tx, ty);
  }

  /** Flowers bloom where the unicorn has just been, only on grass; pooled, temporary, no tiles, no collision, no save data. */
  private updateTrail(dt: number) {
    const now = performance.now(), reduced = reducedEffects();
    if (this.trailSprites.length) {
      for (let i = 0; i < this.trailSprites.length; i++) {
        const sp = this.trailSprites[i];
        if (!this.trailPool.alive(i, now)) { if (sp.flower.visible) { sp.flower.setVisible(false); sp.spark.setVisible(false); } continue; }
        const t = now - this.trailPool.born[i], look = flowerLook(t, this.trailPool.life[i], reduced);
        sp.flower.setScale(look.scale).setAlpha(look.alpha);
        sp.spark.setVisible(look.spark > 0).setAlpha(look.spark).setScale(0.6 + look.spark * 0.7).setPosition(sp.flower.x, sp.flower.y - 3 - look.spark * 8);
      }
    }
    if (this.player.form !== 'unicorn' || this.leaving || this.map.id === 'bedroom') { this.trailPlan.reset(); return; }
    if (!this.player.moving) { this.trailPlan.reset(); this.hornGlint(now); return; }
    const foot = this.player.foot, v = facingVector(this.player.dir);
    const pts = this.trailPlan.step(foot, isGrassTile(this.tileNameAt(foot.x, foot.y)), this.player.isGalloping, reduced, { x: -v.x * 7, y: -v.y * 4 });
    if (!pts.length) return;
    ensureTrailTextures(this);
    if (!this.trailSprites.length) {
      for (let i = 0; i < TRAIL.max; i++) this.trailSprites.push({ flower: this.add.image(0, 0, flowerKey(0)).setVisible(false).setDepth(-4), spark: this.add.image(0, 0, 'horn_spark').setVisible(false).setDepth(9000) });
    }
    for (const p of pts) {
      const jx = Phaser.Math.Between(-3, 3), jy = Phaser.Math.Between(-2, 2), x = p.x + jx, y = p.y + jy;
      if (!isGrassTile(this.tileNameAt(x, y))) continue; // never over the edge of the grass
      const life = Phaser.Math.Between(TRAIL.lifeMin, TRAIL.lifeMax);
      const i = this.trailPool.acquire(now, life, reduced ? TRAIL.maxReduced : TRAIL.max);
      const sp = this.trailSprites[i];
      sp.flower.setTexture(flowerKey(Phaser.Math.Between(0, 4))).setPosition(x, y).setVisible(true).setAngle(Phaser.Math.Between(-15, 15)).setScale(reduced ? 1 : 0.2).setAlpha(1).setDepth(-4);
    }
  }

  /** A soft twinkle that gathers at the horn while she stands. */
  private hornGlint(now: number) {
    if (reducedEffects() || now - this.lastHornGlint < 1700 || this.busy) return;
    this.lastHornGlint = now;
    const tip = this.hornTip();
    ensureTrailTextures(this);
    const g = this.add.image(tip.x, tip.y, 'horn_spark').setDepth(9999).setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, scale: 0.8, duration: 260, yoyo: true, onComplete: () => g.destroy() });
  }

  /**
   * Horn magic: energy gathers at the horn tip, then a short rainbow beam leaves from the tip straight the way she faces.
   * `hitScenery` lets the beam wake flowers, trees, mushrooms etc. it reaches (Chapter 1 bloom spots are handled by the caller).
   */
  private castHorn(hitScenery: boolean) {
    this.lastShot = performance.now();
    ensureTrailTextures(this);
    const dir = this.player.dir, v = facingVector(dir), tip = this.hornTip(), reduced = reducedEffects();
    services.audio.sfx('sparkle');
    // 1. gather: motes converge on the horn
    const motes = reduced ? 3 : 8;
    for (let i = 0; i < motes; i++) {
      const a = (i / motes) * Math.PI * 2, m = this.add.image(tip.x + Math.cos(a) * 15, tip.y + Math.sin(a) * 15, 'horn_spark').setDepth(9999).setScale(0.5).setAlpha(0.2);
      this.tweens.add({ targets: m, x: tip.x, y: tip.y, alpha: 1, scale: 0.9, duration: dur(210), ease: 'Quad.In', onComplete: () => m.destroy() });
    }
    // 2. beam + burst, from the tip along the facing
    const foot = this.player.foot, from = { x: foot.x / T, y: foot.y / T };
    const targets = hitScenery ? [...targetsOf(this.map), ...envTargets(this.map, this.player.form, this.state.flags)] : [];
    const f = fly(from, v, targets, (x, y) => !this.grid.passable(x, y), HORN_RANGE);
    this.shots.push({ id: f.hit?.id, kind: f.hit ? `horn-${f.hit.kind}` : 'horn', dist: f.dist, blocked: f.blocked, dir });
    if (this.shots.length > 40) this.shots.shift();
    const len = Math.max(12, f.dist * T);
    const g = this.add.graphics().setDepth(9999).setAlpha(0);
    const bands = [0xff7ec3, 0xffe14d, 0x7be3ff];
    bands.forEach((c, i) => { const off = (i - 1) * 1.6; g.lineStyle(2, c, 0.95).lineBetween(tip.x + (v.y !== 0 ? off : 0), tip.y + (v.x !== 0 ? off : 0), tip.x + v.x * len + (v.y !== 0 ? off : 0), tip.y + v.y * len + (v.x !== 0 ? off : 0)); });
    const glow = this.add.image(tip.x, tip.y, 'fx_glow').setDepth(9998).setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: g, alpha: { from: 1, to: 0 }, delay: dur(200), duration: dur(320), onComplete: () => g.destroy() });
    this.tweens.add({ targets: glow, alpha: { from: 0.95, to: 0 }, scale: 1.2, delay: dur(200), duration: dur(360), onComplete: () => glow.destroy() });
    const burst = reduced ? 3 : 7;
    this.time.delayedCall(dur(200), () => {
      for (let i = 0; i < burst; i++) {
        const sp = this.add.image(tip.x + v.x * len * (0.25 + 0.75 * (i / burst)), tip.y + v.y * len * (0.25 + 0.75 * (i / burst)), 'horn_spark').setDepth(9999).setTint(bands[i % 3]).setScale(0.8);
        this.tweens.add({ targets: sp, x: sp.x + Phaser.Math.Between(-10, 10), y: sp.y - Phaser.Math.Between(4, 16), alpha: 0, duration: dur(520), onComplete: () => sp.destroy() });
      }
      if (f.hit) this.spellReact(f.hit);
    });
  }

  // ------------------------------------------------------------------ mermaid bubble wand (v0.4b.3)
  private merWand?: Phaser.GameObjects.Image;
  private pearlBusy = false;
  private pearlCue?: Phaser.GameObjects.Graphics;
  private pearlCueKey = '';

  private pearlObj(): ObjDef | undefined { return this.map.id === 'grotto' ? this.map.objects.find((o) => o.id === 'pearl') : undefined; }
  private pearlActive(): boolean {
    // PEARL_PLACED is a permanent achievement, not a lock on future play.
    const p = this.objPos.get('pearl') ?? this.pearlObj();
    return !!p && !!this.state.flags.MARINA_HELPED && !isSocketX(p.x);
  }
  private mermaidColor(): number { return WAND_TINT[this.state.equippedWand.colorId][0]; }

  /** Keeps the underwater wand in her hand, in front of or behind her depending on which way she faces. */
  private updateMerWand() {
    const on = this.player.form === 'mermaid' && !this.leaving;
    if (!on) { this.merWand?.setVisible(false); return; }
    ensureMermaidTextures(this, this.state.equippedWand.colorId);
    const key = `mer_wand_${this.state.equippedWand.colorId}`;
    if (!this.merWand) this.merWand = this.add.image(0, 0, key).setOrigin(0.1, 0.5);
    const pose = wandPose(this.player.dir);
    const sp = this.player.sprite;
    this.merWand.setTexture(key).setVisible(true).setPosition(sp.x + pose.hx, sp.y + pose.hy).setAngle(pose.angle).setFlipY(pose.flipY).setDepth(sp.y + (pose.front ? 1 : -1));
  }

  /** Where the wand tip is right now (world pixels). */
  private wandTip() {
    const pose = wandPose(this.player.dir), sp = this.player.sprite, a = (pose.angle * Math.PI) / 180;
    return { x: sp.x + pose.hx + Math.cos(a) * pose.len, y: sp.y + pose.hy + Math.sin(a) * pose.len };
  }

  /** One bubble: flies straight the way she faces, touches the pearl only if it really passes through it. */
  private shootBubble() {
    this.lastShot = performance.now();
    const foot = this.player.foot, from = { x: foot.x / T, y: foot.y / T }, dir = this.player.dir;
    const po = this.pearlObj(), pp = po ? (this.objPos.get('pearl') ?? po) : null;
    const pearlLive = this.pearlActive() && !this.pearlBusy && !!pp;
    const r0 = bubbleShot(from, dir, pearlLive ? pp : null, (x, y) => !this.grid.passable(x, y));
    // v0.4c: bubbles also wake shells, wheels and secret kelp; whichever thing is nearer along the line gets the bubble
    const ef = this.kingdom ? fly(from, facingVector(dir), envTargets(this.map, 'mermaid', this.state.flags), (x, y) => !this.grid.passable(x, y), BUBBLE_RANGE) : null;
    const envHit = ef?.hit && (!r0.hitPearl || ef.dist < r0.dist) ? ef : null;
    const r = envHit ? { ...r0, end: envHit.end, dist: envHit.dist, blocked: false, hitPearl: false, push: false } : r0;
    const wand = this.state.equippedWand;
    this.shots.push({ id: envHit?.hit?.id ?? (r.hitPearl ? 'pearl' : undefined), kind: envHit ? 'bubble-env' : r.hitPearl ? (r.push ? 'pearl-push' : 'pearl-touch') : undefined, dist: r.dist, blocked: r.blocked, wand: `${wand.headId}/${wand.colorId}/${wand.trailId}`, dir });
    if (this.shots.length > 40) this.shots.shift();
    services.audio.sfx('splash');
    const tip = this.wandTip(), col = this.mermaidColor();
    ensureMermaidTextures(this, wand.colorId);
    const b = this.add.image(tip.x, tip.y, bubbleTexture(this, col)).setDepth(9999);
    if (!reducedEffects()) this.tweens.add({ targets: b, scale: { from: 0.8, to: 1.2 }, duration: 160, yoyo: true, repeat: -1 });
    const ex = r.end.x * T, ey = r.end.y * T - 8;
    let last = 0;
    this.tweens.add({
      targets: b, x: ex, y: ey, duration: Math.max(90, (r.dist / SHOT_TILES_PER_SEC) * 1000), ease: 'Sine.Out',
      onUpdate: () => {
        if (reducedEffects() || performance.now() - last < 45) return;
        last = performance.now();
        const t = this.add.image(b.x + Phaser.Math.Between(-3, 3), b.y + Phaser.Math.Between(-3, 3), bubbleTexture(this, col)).setScale(0.35).setAlpha(0.8).setDepth(9998);
        this.tweens.add({ targets: t, alpha: 0, y: t.y - 10, scale: 0.15, duration: 420, onComplete: () => t.destroy() });
      },
      onComplete: () => {
        b.destroy();
        this.sparkleAt(Math.floor(r.end.x), Math.floor(r.end.y), 3);
        if (envHit?.hit) { this.spellReact(envHit.hit); return; }
        if (!r.hitPearl || !po) return;
        const ps = this.objSprites.get('pearl');
        if (ps && !reducedEffects()) this.tweens.add({ targets: ps, angle: { from: -10, to: 10 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => ps.setAngle(0) });
        if (!r.push) return;
        this.pearlBusy = true;
        const cur = this.objPos.get('pearl') ?? po;
        void pearlBubbleHit(this.ctx, po, cur.x).finally(() => { this.pearlBusy = false; });
      }
    });
  }

  /** A soft "stand here, face this way" glow beside the pearl: it only guides, it never steers the bubble. */
  private pearlReplay?: Phaser.GameObjects.Graphics;
  /** A big pulsing circular arrow over a finished pearl: tap it to roll it back and play again. */
  private updatePearlReplay() {
    const po = this.pearlObj(), pp = po ? (this.objPos.get('pearl') ?? po) : null;
    const show = !!pp && !!this.state.flags.MARINA_HELPED && isSocketX(pp.x) && !this.ui?.modal && !this.leaving;
    if (!show) { this.pearlReplay?.setVisible(false); return; }
    if (!this.pearlReplay) {
      const g = this.add.graphics().setDepth(9000);
      g.fillStyle(0xffffff, 0.85).fillCircle(0, 0, 14).lineStyle(3, 0x6a4bd8, 1).strokeCircle(0, 0, 14);
      g.lineStyle(4, 0x6a4bd8, 1).beginPath().arc(0, 0, 7, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(230), false).strokePath();
      g.fillStyle(0x6a4bd8, 1).fillTriangle(-8, -9, 1, -12, -3, -3);
      if (!reducedEffects()) this.tweens.add({ targets: g, scale: { from: 0.9, to: 1.15 }, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.pearlReplay = g;
    }
    this.pearlReplay.setVisible(true).setPosition(pp!.x * T + T / 2, pp!.y * T - 14);
  }

  private updatePearlCue() {
    this.updatePearlReplay();
    const want = this.player.form === 'mermaid' && this.pearlActive() && !this.ui?.modal && !this.leaving;
    if (!want) { this.pearlCue?.setVisible(false); this.pearlCueKey = ''; return; }
    const po = this.pearlObj()!, pp = this.objPos.get('pearl') ?? po;
    const key = `${pp.x}`;
    if (!this.pearlCue) {
      this.pearlCue = this.add.graphics().setDepth(40);
      if (!reducedEffects()) this.tweens.add({ targets: this.pearlCue, alpha: { from: 0.35, to: 0.95 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.pearlCue.setVisible(true);
    if (key === this.pearlCueKey) return;
    this.pearlCueKey = key;
    const g = this.pearlCue.clear(), y = pp.y * T + T / 2 + 2, sx = (pp.x - 2) * T + T / 2;
    g.fillStyle(0xffffff, 0.22).fillEllipse(sx, y + 4, 22, 9).lineStyle(2, 0xbff3ff, 0.9).strokeEllipse(sx, y + 4, 22, 9);
    for (let i = 0; i < 3; i++) { const cx = sx + 14 + i * 9; g.lineStyle(2, 0xffffff, 0.9).beginPath().moveTo(cx - 3, y - 2).lineTo(cx + 2, y + 4).lineTo(cx - 3, y + 10).strokePath(); }
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
    if (t.kind === 'env') { this.kingdom?.react(t); return; }
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
    this.kingdom?.stopRace(true); this.ui.hideRaceHud();
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

  /** Opens the scrolling River Race over the world; resolves with the best finished run when she leaves. */
  private playRace(mode: import('./../world/race').RaceMode): Promise<import('./RaceScene').RaceResult> {
    if (this.stationOpen) return Promise.resolve({ mode, finished: false, stars: 0, ms: 0, rings: 0 });
    this.stationOpen = true;
    return new Promise((resolve) => {
      this.events.once('race-closed', (r: import('./RaceScene').RaceResult) => {
        this.buttonsLockedUntil = performance.now() + 800;
        this.stationOpen = false;
        services.save.save();
        resolve(r);
      });
      this.scene.pause('World');
      this.scene.pause('UI');
      this.scene.launch('Race', { mode });
      this.scene.bringToTop('Race');
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
      if (plan.mode === 'walk' && plan.step) {
        // A mermaid cannot stand on a land tile. Place her directly on the valid
        // destination cell during the sparkle transition, rather than starting a
        // mermaid walk on impassable ground and risking a stuck joystick state.
        const landing = this.grid.passable(plan.step.x, plan.step.y)
          ? plan.step
          : safeSpawn(this.grid, plan.step);
        this.player.teleport(landing);
        this.sparkleAt(landing.x, landing.y, 7);
      }
      if (key) void services.audio.speak(key);
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
  private carrySprite?: Phaser.GameObjects.Image;
  private updateCarry() {
    const want = this.map.id === 'garden' && !this.editing ? this.state.kingdom.carry : null;
    if (!want) { this.carrySprite?.destroy(); this.carrySprite = undefined; return; }
    const key = GITEM[want]?.key; if (!key) return;
    if (!this.carrySprite || this.carrySprite.texture.key !== key) { this.carrySprite?.destroy(); this.carrySprite = this.add.image(0, 0, key, key === 'px_gd_pinwheel' ? 0 : undefined).setScale(0.7).setDepth(9990); }
    this.carrySprite.setPosition(this.player.sprite.x + 9, this.player.sprite.y - 22);
  }

  update(_t: number, dt: number) {
    if (!this.player) return;
    this.driveStick(dt);
    this.player.update(dt);
    this.updateCarry();
    if (!reducedEffects() && this.waterCells.length) {
      this.waterTick += dt;
      if (this.waterTick > 520) {
        this.waterTick = 0;
        for (const c of this.waterCells) { c.phase = (c.phase + 1) % 4; this.layer.putTileAt(TILE[`water${c.phase}` as 'water0'], c.x, c.y); }
      }
    }
    if (this.tagGame) this.tagTick(dt);
    this.updateCue(dt);
    this.updateMerWand();
    this.updateTrail(dt);
    this.updatePearlCue();
    this.kingdom?.update(performance.now(), dt);
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
      objSprite: (id: string) => { const o = this.objSprites.get(id); return o ? { x: o.x, y: o.y, visible: o.visible, tweens: this.tweens.getTweensOf(o).length } : null; },
      moving: () => this.player.moving,
      steering: () => this.player.steering,
      foot: () => this.player.foot,
      stick: (x: number, y: number, mag: number) => { this.ui.debugStick = mag > 0 ? { x, y, mag } : null; },
      action: () => this.actionPress(),
      magic: () => void this.magicPress(),
      shots: () => this.shots.map((q) => ({ ...q })),
      trail: () => ({ count: this.trailCount(), cap: reducedEffects() ? TRAIL.maxReduced : TRAIL.max, flowers: this.trailSprites.map((s, i) => ({ i, on: this.trailPool.alive(i, performance.now()), x: s.flower.x, y: s.flower.y, a: s.flower.alpha })).filter((q) => q.on) }),
      hornTip: () => this.hornTip(),
      trailOffGrass: () => this.trailSprites.filter((q, i) => this.trailPool.alive(i, performance.now()) && !isGrassTile(this.tileNameAt(q.flower.x, q.flower.y))).length,
      tileName: (x: number, y: number) => this.tileNameAt(x * T + 1, y * T + 1),
      pearl: () => ({ ...(this.objPos.get('pearl') ?? { x: -1, y: -1 }), busy: this.pearlBusy, placed: !!this.state.flags.PEARL_PLACED }),
      mermaidFoot: () => ({ ...this.player.foot }),
      teleportPlayer: (t: Tile) => this.player.teleport(t),
      faceDir: (d: 'up' | 'down' | 'left' | 'right') => { this.player.dir = d; this.player.idle(); },
      tag: () => (this.tagGame ? { phase: this.tagGame.s.phase, stars: this.tagGame.s.stars, pal: { ...this.tagGame.s.pal }, t: this.tagGame.s.t, ended: this.tagGame.ended, tally: this.ui.tallyState, exit: this.ui.exitPos } : null),
      pet: () => ({ home: !!this.petHome?.visible, tile: { ...this.petTile }, x: this.petSprite?.x ?? 0, y: this.petSprite?.y ?? 0, visible: !!this.petSprite?.visible, busy: this.petBusy, care: { ...this.state.kingdom.petCare }, log: this.petStage?.log ?? null, type: this.state.kingdom.pet?.type ?? -1 }),
      bake: () => ({ ...bakeProbe, cards: bakeProbe.cards.map((c) => ({ ...c })) }),
      foods: () => ({ layers: this.foodLayers.map((i) => ({ key: i.texture.key, x: i.x, y: i.y, s: i.scale })), dishes: (Object.keys(FOODS) as FoodId[]).map((id) => { const q = this.foodSprite(id); return { id, visible: !!q?.visible, x: q?.x ?? 0, y: q?.y ?? 0 }; }) }),
      kingdom: () => this.kingdom?.debug() ?? null,
      kingdomApi: () => this.kingdom,
      envFx: () => this.kingdom?.debug().activeFx ?? 0,
      raceHud: () => this.ui.raceHudInfo,
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

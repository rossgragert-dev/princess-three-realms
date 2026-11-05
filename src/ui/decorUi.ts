import Phaser from 'phaser';
import { ThumbPool } from '../art/looks';
import { optionOf, slotOfWearable } from '../content/appearance';
import { DECOR, ownsDecor, optionsForSlot, type DecorDef, type SlotDef } from '../content/decorCatalog';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { burst, makeButton, pic, roundedPanel, sleep, type Btn } from './touchTargets';

type GO = Phaser.GameObjects.GameObject;

/** A decor picture fitted into `box` px. Single images and sheet frames both work. */
export function decorImage(scene: Phaser.Scene, def: DecorDef, x: number, y: number, box: number, maxScale = 6): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, def.sprite.key, def.sprite.frame);
  const sc = Math.max(1, Math.min(maxScale, Math.floor((box / Math.max(img.width, img.height)) * 2) / 2));
  return img.setScale(sc);
}

/**
 * Bedroom picker: a bottom sheet of big picture cards for ONE hotspot. Unlocked items are full colour; locked items
 * are dark silhouettes with a padlock and a picture of who/where gives them. Tap an item to place it (tap the placed
 * one again to take it away). No words anywhere.
 */
export class DecorPicker {
  private root: Phaser.GameObjects.Container;
  private objs: GO[] = [];
  private btns: Btn[] = [];
  isOpen = false;
  /** Where each card is on the 512x384 canvas (used by the browser test drivers). */
  cards: { id: string; x: number; y: number; owned: boolean }[] = [];

  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {
    this.root = scene.add.container(0, 0).setDepth(55).setVisible(false);
  }

  buttons(): Btn[] { return this.isOpen ? this.btns : []; }
  private add<T extends GO>(o: T): T { this.root.add(o); this.objs.push(o); return o; }

  /** Resolves with the chosen item id, `null` to empty the slot, or `undefined` if the child just closed it. */
  pick(slot: SlotDef, unlocked: readonly string[], current: string | undefined): Promise<string | null | undefined> {
    const s = this.scene;
    return new Promise((resolve) => {
      this.isOpen = true; this.setModal(true); this.root.setVisible(true);
      let done = false;
      const finish = (v: string | null | undefined, at?: { x: number; y: number }) => {
        if (done) return;
        done = true;
        if (at) burst(s, at.x, at.y, 12, 300);
        this.objs.forEach((o) => o.destroy()); this.objs = []; this.btns = []; this.cards = [];
        this.root.setVisible(false); this.isOpen = false; this.setModal(false);
        resolve(v);
      };
      // dim only the top; the room stays visible so the child sees what changes
      const dim = this.add(s.add.rectangle(256, 120, 512, 240, 0x1a1033, 0.25).setInteractive());
      dim.on('pointerdown', () => finish(undefined));
      const top = 262, h = 118;
      this.add(roundedPanel(s, 12, top, 488, h));
      const back = makeButton(s, 474, top - 6, 'icon_back', 0.9, () => finish(undefined));
      this.btns.push(back); this.root.add(back.container); this.objs.push(back.container);

      const options = optionsForSlot(slot.id);
      const gap = Math.min(100, 440 / options.length), cardW = Math.min(92, gap - 6), x0 = 256 - ((options.length - 1) * gap) / 2, cy = top + 62;
      options.forEach((d, i) => {
        const x = x0 + i * gap;
        const owned = ownsDecor(d.id, unlocked);
        this.cards.push({ id: d.id, x, y: cy, owned });
        const here = current === d.id;
        const g = s.add.graphics();
        g.fillStyle(owned ? 0xffffff : 0xd9d2ee, 1).fillRoundedRect(-cardW / 2, -46, cardW, 92, 14);
        g.lineStyle(here ? 7 : 4, here ? 0xffc800 : 0xc9b8ff, 1).strokeRoundedRect(-cardW / 2, -46, cardW, 92, 14);
        const img = decorImage(s, d, 0, 0, 66, 4);
        const parts: GO[] = [g, img];
        if (!owned) {
          img.setTintFill(0x6a4a8c).setAlpha(0.55);
          const lock = pic(s, 'icon_lock', 24, 26, 0.9);
          const who = pic(s, d.hintIcon, -24, 26, d.hintIcon.startsWith('icon_') ? 0.9 : 2);
          parts.push(lock, who);
        } else if (here) parts.push(pic(s, 'icon_check', 30, -30, 0.7));
        const c = s.add.container(x, cy, parts).setSize(cardW + 6, 98).setInteractive({ useHandCursor: true });
        c.on('pointerdown', () => {
          if (!owned) { // gentle "not yet": wobble and show who gives it
            services.audio.sfx('pop');
            s.tweens.add({ targets: c, x: x + 6, duration: 60, yoyo: true, repeat: 3 });
            return;
          }
          services.audio.sfx('sparkle');
          s.tweens.add({ targets: img, scale: img.scale * 1.2, duration: 100, yoyo: true });
          finish(here ? null : d.id, { x, y: cy });
        });
        this.add(c);
        if (owned && !here && !current && options.filter((o) => ownsDecor(o.id, unlocked)).length === 1) s.tweens.add({ targets: c, y: cy - 5, duration: dur(500), yoyo: true, repeat: -1 }); // single choice: bounce it
      });
    });
  }
}

/** "You got a new thing!" moment: big picture, rays, sparkles. Tap or wait. */
export class DecorReveal {
  isOpen = false;
  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {}

  async show(id: string): Promise<void> {
    const wearable = id.startsWith('w:') ? id.slice(2) : null;
    const wslot = wearable ? slotOfWearable(wearable) : undefined;
    const d = wearable ? undefined : DECOR[id];
    if (!d && !(wearable && wslot)) return;
    const s = this.scene;
    this.setModal(true);
    this.isOpen = true;
    services.audio.sfx('chime');
    const objs: GO[] = [];
    const add = <T extends GO>(o: T) => { objs.push(o); return o; };
    const dim = add(s.add.rectangle(256, 192, 512, 384, 0x1a1033, 0.7).setDepth(80).setInteractive());
    // slowly turning rays
    const rays = add(s.add.graphics().setDepth(81).setPosition(256, 178));
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      rays.fillStyle(i % 2 ? 0xfff3a0 : 0xffd93d, 0.35).fillTriangle(0, 0, Math.cos(a) * 190, Math.sin(a) * 190, Math.cos(a + 0.26) * 190, Math.sin(a + 0.26) * 190);
    }
    if (!services.save.state.settings.reducedEffects) s.tweens.add({ targets: rays, angle: 360, duration: 14000, repeat: -1 });
    const card = add(s.add.graphics().setDepth(82));
    card.fillStyle(0x40255a, 0.3).fillRoundedRect(256 - 98, 178 - 98 + 5, 196, 196, 24);
    card.fillStyle(0xfff6e4, 1).fillRoundedRect(256 - 98, 178 - 98, 196, 196, 24);
    card.lineStyle(7, 0xffc800, 1).strokeRoundedRect(256 - 98, 178 - 98, 196, 196, 24);
    let img: Phaser.GameObjects.Image;
    let hintIcon: string;
    if (d) { img = add(decorImage(s, d, 256, 178, 150, 6).setDepth(83)); hintIcon = d.hintIcon; }
    else {
      // a wearable: a real picture of her wearing it, then a cue towards the wardrobe / mirror
      const pool = new ThumbPool(s, 'reveal_thumb_', 1);
      pool.drawOption(0, services.save.state.appearance, wslot!, wearable!, { w: 88, h: 80 });
      img = add(s.add.image(256, 178, pool.key(0)).setOrigin(0.44, 0.476).setScale(1.7).setCrop(0, 0, 88, 80).setDepth(83));
      const opt = optionOf(wslot!, wearable!);
      hintIcon = opt?.hintIcon ?? 'sparkle0';
    }
    const final = img.scale;
    img.setScale(0.1);
    s.tweens.add({ targets: img, scale: final, duration: dur(550), ease: 'Back.Out' });
    if (!services.save.state.settings.reducedEffects) s.tweens.add({ targets: img, y: 172, duration: 900, yoyo: true, repeat: -1, delay: 600, ease: 'Sine.InOut' });
    burst(s, 256, 178, 24, 84);
    s.time.delayedCall(350, () => burst(s, 256, 178, 18, 84));
    const star = add(pic(s, 'sparkle0', 256 - 98, 178 - 98, 3).setDepth(84));
    const star2 = add(pic(s, 'sparkle1', 256 + 98, 178 + 98, 3).setDepth(84));
    s.tweens.add({ targets: [star, star2], scale: 4.5, duration: 500, yoyo: true, repeat: -1 });
    // who/where it came from, then the "go decorate" cue
    const from = add(pic(s, hintIcon, 256 - 56, 322, hintIcon.startsWith('icon_') ? 1.4 : 3).setDepth(83));
    const arrow = add(pic(s, 'icon_next', 256, 322, 1).setDepth(83));
    const station = wearable && wslot && ['hairstyle', 'hairColor', 'tiara', 'earrings', 'necklace', 'faceAccent', 'skinTone'].includes(wslot) ? 'icon_mirror' : 'icon_wardrobe';
    const home = add(pic(s, wearable ? station : 'icon_home', 256 + 56, 322, 1.4).setDepth(83));
    s.tweens.add({ targets: [from, arrow, home], y: 316, duration: 500, yoyo: true, repeat: -1 });
    await new Promise<void>((resolve) => {
      let fin = false;
      const end = () => { if (!fin) { fin = true; resolve(); } };
      const ok = makeButton(s, 440, 330, 'icon_check', 1.3, end);
      ok.container.setDepth(90); objs.push(ok.container); ok.pulse(true);
      dim.on('pointerdown', () => { if (s.time.now > armed) end(); });
      const armed = s.time.now + 900; // a stray double-tap must not skip the surprise
      s.time.delayedCall(6500, end);
    });
    await sleep(s, 40);
    objs.forEach((o) => o.destroy());
    this.isOpen = false;
    this.setModal(false);
  }
}

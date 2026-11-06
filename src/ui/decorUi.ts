import Phaser from 'phaser';
import { ThumbPool } from '../art/looks';
import { optionOf, slotOfWearable } from '../content/appearance';
import { DECOR, type DecorDef } from '../content/decorCatalog';
import { EXTRA_DECOR } from '../content/family';
import { furnitureById } from '../content/furniture';
import { services } from '../systems/services';
import { dur } from '../systems/accessibility';
import { burst, makeButton, pic, sleep } from './touchTargets';

type GO = Phaser.GameObjects.GameObject;

/** v0.4c: rewards that live only in the furniture catalog (no legacy slot) still get the same "new thing!" moment. */
function extraDecorDef(id: string): DecorDef | undefined {
  const f = EXTRA_DECOR.includes(id) ? furnitureById(id) : undefined;
  return f ? { id, name: f.name, category: 'accent', source: 'gift', flag: 'INTRO_DONE', hintIcon: 'sparkle0', sprite: { key: f.key, frame: f.frame }, layer: 'stand' } : undefined;
}

/** A decor picture fitted into `box` px. Single images and sheet frames both work. */
export function decorImage(scene: Phaser.Scene, def: DecorDef, x: number, y: number, box: number, maxScale = 6): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, def.sprite.key, def.sprite.frame);
  const sc = Math.max(1, Math.min(maxScale, Math.floor((box / Math.max(img.width, img.height)) * 2) / 2));
  return img.setScale(sc);
}

/** "You got a new thing!" moment: big picture, rays, sparkles. Tap or wait. */
export class DecorReveal {
  isOpen = false;
  private off = { x: 0, y: 0 };
  setOffset(ox: number, oy: number) { this.off = { x: ox, y: oy }; }
  constructor(private scene: Phaser.Scene, private setModal: (on: boolean) => void) {}

  async show(id: string): Promise<void> {
    const wearable = id.startsWith('w:') ? id.slice(2) : null;
    const wslot = wearable ? slotOfWearable(wearable) : undefined;
    const d = wearable ? undefined : DECOR[id] ?? extraDecorDef(id);
    if (!d && !(wearable && wslot)) return;
    const s = this.scene;
    this.setModal(true);
    this.isOpen = true;
    services.audio.sfx('chime');
    const objs: GO[] = [];
    const { x: ox, y: oy } = this.off;
    const cont = s.add.container(ox, oy).setDepth(80);
    objs.push(cont);
    const add = <T extends GO>(o: T) => { cont.add(o); return o; };
    const dim = add(s.add.rectangle(256, 192, 6000, 6000, 0x1a1033, 0.7).setDepth(80).setInteractive());
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
    burst(s, 256 + ox, 178 + oy, 24, 84);
    s.time.delayedCall(350, () => burst(s, 256 + ox, 178 + oy, 18, 84));
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
      ok.container.setDepth(90); cont.add(ok.container); ok.pulse(true);
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

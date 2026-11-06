import { StationScene } from './StationScene';
import { fullBackdrop } from '../ui/stage';

/** The Enchanted Vanity: large portrait in a golden lit mirror; hair, hair colour, tiara, jewellery, face sparkles, skin tone. */
export class VanityScene extends StationScene {
  constructor() {
    super({
      key: 'Vanity', kind: 'port', other: 'Wardrobe', otherIcon: 'icon_wardrobe',
      tabs: ['hairstyle', 'hairColor', 'tiara', 'earrings', 'necklace', 'faceAccent', 'skinTone'],
      tabIcons: { hairstyle: 'icon_hair', hairColor: 'icon_haircolor', tiara: 'icon_tiara', earrings: 'icon_earring', necklace: 'icon_necklace', faceAccent: 'icon_face', skinTone: 'icon_skin' }
    });
  }

  protected drawBackdrop() {
    const g = this.add.graphics().setDepth(0);
    fullBackdrop(this, 0xffe3f1, 0xffc1dd);
    // mirror: gold frame, pale glass, bulbs
    g.fillStyle(0xe2a53a, 1).fillRoundedRect(4, 14, 244, 340, 54);
    g.fillStyle(0xffd75a, 1).fillRoundedRect(10, 20, 232, 328, 48);
    g.fillStyle(0xcfeaff, 1).fillRoundedRect(18, 28, 216, 312, 42);
    g.fillStyle(0xffffff, 0.35).fillRoundedRect(26, 36, 200, 296, 36);
    g.fillStyle(0xf6f0ff, 0.0);
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
      g.fillStyle(0xfff3a0, 1).fillCircle(126 + Math.cos(a) * 112, 184 + Math.sin(a) * 160, 5).lineStyle(1, 0xc08a1c, 1).strokeCircle(126 + Math.cos(a) * 112, 184 + Math.sin(a) * 160, 5);
    }
    // table edge with jewellery box
    g.fillStyle(0xe9a5cf, 1).fillRect(0, 352, 252, 32);
    g.fillStyle(0xe2a53a, 1).fillRect(0, 350, 252, 4);
  }
}

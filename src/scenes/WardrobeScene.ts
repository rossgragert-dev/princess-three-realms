import { StationScene } from './StationScene';

/** The Royal Wardrobe: big full-body princess, dress / dress colour / shoes / cape-gloves-wings. */
export class WardrobeScene extends StationScene {
  constructor() {
    super({
      key: 'Wardrobe', kind: 'full', other: 'Vanity', otherIcon: 'icon_mirror',
      tabs: ['dress', 'dressColor', 'shoes', 'accessory'],
      tabIcons: { dress: 'icon_dress', dressColor: 'icon_palette', shoes: 'icon_shoe', accessory: 'icon_cape' }
    });
  }

  protected drawBackdrop() {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0xffd6ef, 0xffd6ef, 0xd9c2ff, 0xd9c2ff, 1).fillRect(0, 0, 512, 384);
    // armoire doors, open, behind her
    for (const [x, flip] of [[8, 1], [156, -1]] as const) {
      g.fillStyle(0xf7c1dd, 1).fillRoundedRect(x, 28, 88, 312, 8).lineStyle(5, 0xe2a53a, 1).strokeRoundedRect(x, 28, 88, 312, 8);
      g.fillStyle(0xffe7f4, 1).fillRoundedRect(x + 10, 44, 68, 120, 6).fillRoundedRect(x + 10, 176, 68, 140, 6);
      g.fillStyle(0xffc800, 1).fillCircle(x + (flip > 0 ? 76 : 12), 190, 6);
    }
    g.fillStyle(0xfff0fa, 1).fillRoundedRect(92, 20, 68, 322, 4);
    g.fillStyle(0xffffff, 0.55).fillRect(98, 28, 56, 306);
    g.fillStyle(0xb98be8, 1).fillRect(0, 338, 252, 46);
    g.fillStyle(0xe2a53a, 1).fillRect(0, 336, 252, 4);
    g.fillStyle(0x7d5aa8, 0.35).fillEllipse(124, 340, 150, 20).setDepth(1);
  }
}

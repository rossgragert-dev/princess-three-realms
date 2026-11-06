import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { WorldScene } from '../scenes/WorldScene';
import { UIScene } from '../scenes/UIScene';
import { StickerbookScene } from '../scenes/StickerbookScene';
import { WardrobeScene } from '../scenes/WardrobeScene';
import { VanityScene } from '../scenes/VanityScene';
import { RoomDesignerScene } from '../scenes/RoomDesignerScene';
import { FireworksScene } from '../scenes/FireworksScene';
import { WandWorkshopScene } from '../scenes/WandWorkshopScene';
import { DecorateScene } from '../scenes/DecorateScene';
import { ParentSettingsScene } from '../scenes/ParentSettingsScene';

export const LOGICAL_W = 512;
export const LOGICAL_H = 384;

export function makeConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: LOGICAL_W,
    height: LOGICAL_H,
    backgroundColor: '#1a1033',
    pixelArt: true,
    roundPixels: true,
    // v0.4b.2: EXPAND keeps 512x384 as the always-visible minimum and grows the game to the screen's aspect (see ui/stage.ts)
    scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH, width: LOGICAL_W, height: LOGICAL_H },
    input: { activePointers: 3, touch: { capture: true } },
    scene: [BootScene, TitleScene, WorldScene, UIScene, StickerbookScene, WardrobeScene, VanityScene, RoomDesignerScene, FireworksScene, WandWorkshopScene, DecorateScene, ParentSettingsScene]
  };
}

import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { WorldScene } from '../scenes/WorldScene';
import { UIScene } from '../scenes/UIScene';
import { StickerbookScene } from '../scenes/StickerbookScene';
import { WardrobeScene } from '../scenes/WardrobeScene';
import { VanityScene } from '../scenes/VanityScene';
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
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2, touch: { capture: true } },
    scene: [BootScene, TitleScene, WorldScene, UIScene, StickerbookScene, WardrobeScene, VanityScene, ParentSettingsScene]
  };
}

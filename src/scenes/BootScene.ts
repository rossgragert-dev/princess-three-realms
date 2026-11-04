import Phaser from 'phaser';

interface SheetEntry { key: string; file: string; frameWidth: number; frameHeight: number }
interface ImageEntry { key: string; file: string }
interface AnimEntry { key: string; sheet: string; frames: number[]; frameRate: number; repeat: number }
interface Manifest { sheets: SheetEntry[]; images: ImageEntry[]; anims: AnimEntry[] }

/** Loads every generated asset from public/assets/manifest.json, then builds all animations. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const bar = this.add.rectangle(256, 200, 4, 14, 0xffc800).setOrigin(0, 0.5);
    this.add.rectangle(256, 200, 200, 18, 0x000000, 0).setStrokeStyle(3, 0xffffff);
    bar.x = 156;
    this.load.on('progress', (v: number) => { bar.width = 200 * v; });
    this.load.json('manifest', 'assets/manifest.json');
    this.load.once('filecomplete-json-manifest', () => {
      const m = this.cache.json.get('manifest') as Manifest;
      for (const s of m.sheets) this.load.spritesheet(s.key, s.file, { frameWidth: s.frameWidth, frameHeight: s.frameHeight });
      for (const i of m.images) this.load.image(i.key, i.file);
    });
  }

  create() {
    const m = this.cache.json.get('manifest') as Manifest;
    for (const a of m.anims) {
      if (this.anims.exists(a.key)) continue;
      this.anims.create({ key: a.key, frames: this.anims.generateFrameNumbers(a.sheet, { frames: a.frames }), frameRate: a.frameRate, repeat: a.repeat });
    }
    this.scene.start('Title');
  }
}

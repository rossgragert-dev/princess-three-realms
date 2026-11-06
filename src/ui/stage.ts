import Phaser from 'phaser';

/**
 * v0.4b.2 responsive display helpers.
 *
 * The game is authored on a 512x384 "stage". The canvas now EXPANDS (Phaser.Scale.EXPAND): the stage is always fully visible and the
 * game size grows past it in whichever direction the screen is longer, so the logical pixel size never changes and nothing is stretched.
 *  - World: the camera simply sees more map.
 *  - HUD (UIScene): buttons are anchored to the real screen edges (see UIScene.layoutHud).
 *  - Menus and minigames: the 512x384 stage is centred and a full-bleed backdrop is drawn around it (useStage + fullBackdrop).
 */
import { STAGE_W, STAGE_H, HUGE, stageOffset, type StageAnchor, type Size, type Offset } from './stageMath';
export { STAGE_W, STAGE_H, HUGE, stageOffset, expandedSize } from './stageMath';
export type { StageAnchor, Size, Offset } from './stageMath';

export function gameSize(scene: Phaser.Scene): Size {
  const s = scene.scale.gameSize;
  return { w: Math.round(s.width), h: Math.round(s.height) };
}

/** Where the stage sits right now in this scene's game. */
export function stageOf(scene: Phaser.Scene, anchor: StageAnchor = 'center'): Offset {
  const { w, h } = gameSize(scene);
  return stageOffset(w, h, anchor);
}

/** Centres the 512x384 stage by scrolling this scene's camera; keeps it centred through rotation/resizes. Returns a refresh fn. */
export function useStage(scene: Phaser.Scene, anchor: StageAnchor = 'center'): () => void {
  const apply = () => { const o = stageOf(scene, anchor); scene.cameras.main.setScroll(-o.x, -o.y); };
  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, apply));
  return apply;
}

/** A pointer position in stage coordinates (the coordinates all menu code is written in). */
export function stagePoint(scene: Phaser.Scene, p: { x: number; y: number }): Offset {
  const w = scene.cameras.main.getWorldPoint(p.x, p.y);
  return { x: w.x, y: w.y };
}

/** Full-bleed vertical gradient: the stage's own gradient, with the top/bottom colours continued out to the real screen edges. */
export function fullBackdrop(scene: Phaser.Scene, top: number, bottom: number, depth = 0): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(top, 1).fillRect(-HUGE, -HUGE, STAGE_W + 2 * HUGE, HUGE);
  g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(-HUGE, 0, STAGE_W + 2 * HUGE, STAGE_H);
  g.fillStyle(bottom, 1).fillRect(-HUGE, STAGE_H, STAGE_W + 2 * HUGE, HUGE);
  return g;
}

/** A translucent screen-covering dimmer in stage space that also swallows taps. */
export function dimmer(scene: Phaser.Scene, color: number, alpha: number, depth?: number): Phaser.GameObjects.Rectangle {
  const r = scene.add.rectangle(STAGE_W / 2, STAGE_H / 2, HUGE, HUGE, color, alpha).setInteractive();
  if (depth !== undefined) r.setDepth(depth);
  return r;
}

# v0.4b.2 — Full-Screen iPad Experience (implementation)

## Approach (smallest robust change)
- `Phaser.Scale.EXPAND` with a 512x384 base. The base is the *minimum* visible area. On a wider screen the game grows horizontally (iPad landscape 1194x834 → ~550x384 logical), on a taller one vertically (iPad portrait → 512x~733). CSS scales the canvas to the viewport with one uniform factor, so pixels are never stretched; `pixelArt` keeps nearest-neighbour edges.
- Logical coordinates are unchanged: maps, collision, tiles, furniture, wand and joystick maths all still use the same units.
- `src/ui/stageMath.ts` (pure, unit tested): `expandedSize`, `stageOffset`. `src/ui/stage.ts`: `useStage` (centres the authored 512x384 menu stage by scrolling the scene camera, re-applied on RESIZE), `fullBackdrop`, `dimmer`, `stagePoint` (pointer → stage coordinates).
- Safe areas: `#game` keeps `env(safe-area-inset-*)` padding, so the canvas never sits under a notch or home bar.

## Where each piece lives
- **World** (`WorldScene.setupCamera`): camera bounds use the real camera size, re-run on RESIZE; maps smaller than the view are centred on the map colour; no gameplay area is invented. Bedroom decorate mode (`decorScroll`) centres the room above the bottom sheet; `DecorateScene` uses `useStage('bottom')` and converts room↔screen positions.
- **HUD** (`UIScene.layoutHud`): left items stay on the left, right items follow the real right edge (+bx), bottom items follow the real bottom (+by), centred items follow the middle. Dialogue is bottom-anchored; puzzle panel, reveal, counting tray and tag panel are centred.
- **Menus/minigames**: Title, Wardrobe, Vanity, Room Designer, Fireworks, Wand Workshop, Stickerbook, Parent Settings, station screens and Boot use the centred stage plus full-bleed backdrops and huge dimmers.

## Home Screen / PWA
`manifest.webmanifest`: `display: standalone`, `orientation: any`. `index.html` already has Apple web-app meta, `viewport-fit=cover`, `touch-action: none`, no selection/callout. `main.ts` blocks gesture/touchmove and refits after `orientationchange` and `visualViewport` resize. The service worker cache name is rewritten on every build by `tools/make_precache.mjs`, so a new publish refreshes the offline cache; saves live in localStorage and are untouched.

## Install on an iPad (after approval)
1. Open the approved link in **Safari**.
2. Tap Share → **Add to Home Screen** → Add.
3. Launch from the new icon; it opens without Safari bars. Open it once online so offline play is cached.
4. Existing saves carry over only if the same address (origin and path) is used; a Home Screen copy keeps its own storage, so check progress after first launch.

## Known limits
- Not verified on real iPad Safari or by a child. Chrome emulation only (see test results in the report).
- Very wide windows show more world (capped at ~2.4:1 in the sizing helper only; CSS does not cap).

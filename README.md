# Princess of Three Realms - v0.1 "The Magical Beginning"

An original, cozy, picture-first top-down adventure for a non-reading 5-year-old. iPad Safari / Home Screen web app, offline-capable.
Phaser 3.90 + TypeScript + Vite. **Read `docs/IMPLEMENTATION_STATUS.md` first: scenes are written but have not yet been run in a browser, and narration audio is not yet recorded.**

## Commands
```
npm install
npm run dev            # local dev server (--host for iPad on the same Wi-Fi)
npm run test:logic     # 71 rule/map/content tests (node:test via tsx) - these run today
npm run build          # tsc + vite build + offline precache list
npm run test:e2e       # Playwright (iPad landscape/portrait + desktop)
npm run art            # regenerate all pixel art deterministically (python3 + Pillow)
npm run audio:script   # regenerate docs/AUDIO_SCRIPT.md from the narration manifest
```

## Layout
- `src/systems`, `src/world` (navigation, guide, story), `src/actors/transformations.ts`, `src/content`: pure logic, unit tested, no Phaser.
- `src/scenes`, `src/ui`, `src/actors/player.ts`: Phaser presentation.
- `tools/`: art pipeline (Python) and doc/preview generators. `public/assets/`: generated art + `manifest.json`.
- Narration: drop `<key>.m4a` (and optionally `.ogg`) into `public/assets/audio/narration/`; keys are listed in `docs/AUDIO_SCRIPT.md`.

## Debugging on iPad
`window.__ptr` exposes state, tile, form and tap helpers (see `WorldScene.debugHook`).

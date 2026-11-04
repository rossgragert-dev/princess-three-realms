# Princess of Three Realms - v0.1 "The Magical Beginning"

An original, cozy, picture-first top-down adventure for a non-reading 5-year-old. iPad Safari / Home Screen web app, offline-capable.
Phaser 3.90 + TypeScript + Vite. **Read `docs/IMPLEMENTATION_STATUS.md` first.** v0.1a: Chapter 1 has been played end to end in real Chrome; the Vite build, CI, Safari/iPad and recorded narration are still outstanding.

## Commands
```
npm install
npm run dev            # local dev server (--host for iPad on the same Wi-Fi)
npm run test:logic     # 73 rule/map/content tests (node:test via tsx)
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

## More
- `docs/GITHUB_SETUP.md` - exact commands to create the repo and Pages preview
- `tools/local-verify/` - run the real game in real Chrome without npm
- `tools/make_tts_clips.py` - temporary narration clips + replaceable recordings
- `docs/screenshots/browser/` - actual browser screenshots

## Standalone site (v0.1b)
`site/` is the complete deployable game (plain static files). See `docs/DEPLOY_GITHUB_PAGES.md`. Rebuild with `tools/build-standalone.sh`.

## v0.2
- `docs/PICTURE_FIRST.md` (narration optional) and `docs/DECORATING.md` (bedroom rewards).

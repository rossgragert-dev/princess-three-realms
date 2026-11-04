# Implementation status - v0.1a "First Light"

Date: 2026-11-04. Hosted npm/PyPI were still unreachable from the authoring session, and GitHub repository creation is blocked, so the
**Vite production build, npm install, Playwright, GitHub Actions and Pages have NOT been run**. What changed this milestone: the game was run for the
first time, in a real browser, with the real engine.

## How the game was run without npm
The official Phaser 3.90.0 release was obtained as a read-only git checkout of the upstream tag `v3.90.0` through the session's permitted git proxy
(no registry mirror, no bypass). `tools/local-verify/` bundles `src/` with esbuild against that `phaser.js` and drives **Chrome for Testing 153** (headless,
touch emulation) through puppeteer-core. `package.json` still pins `phaser@3.90.0` from npm; nothing was vendored into the repo.

## Verified (actually executed)
| Area | Evidence |
|---|---|
| Real TypeScript typecheck against the real Phaser typings (`phaser/types/phaser.d.ts`) | 0 errors for `src/` and `tools/` (a deliberate wrong-type probe fails as it should) |
| Logic and content tests | `npm run test:logic`: 73 tests pass |
| Game boots, title renders, tilemaps render, princess walks (mouse and real touch events), all 5 scenes render | `docs/screenshots/browser/*.png` (real Chrome frames, not map renders) |
| **Chapter 1 end to end**: Pip + 3 carrots, tree /b/ puzzle, unicorn via wand tray, rainbow-bridge pattern, shore, mermaid transformation, dive, Marina + 3 starfish, push pearl x4, wishing star, home button, lamp placed | `tools/local-verify/chapter.mjs` exits 0 only on `LAMP_PLACED`; 0 page errors |
| Narration playback pipeline | With throw-away test tones (not committed): lines play, advance by themselves, replay button re-speaks, picture taps say their word, wrong answers give a spoken gentle hint with no penalty, 10 s idle re-prompts, hint button replays the goal, no back-to-back duplicate prompts |
| Responsive scaling | iPad 1024x768, 1180x820, 1366x1024, portrait 768x1024, phone landscape: canvas always fits, 4:3, no page scroll, buttons >= 56 logical px (>= 84 CSS px on iPad) |
| Touch and unintended gestures (Chrome) | Play/walk/interact by touch events; page scrolling and pinch disabled in CSS + meta; double-tap zoom prevented by `touch-action: none` |
| Optional on-screen d-pad | Parent gate (hold 3 s) -> toggle -> tap and hold walk; walking into objects interacts |
| Save and resume | Reload -> Play restores scene, tile, flags |
| PWA offline (Chrome) | Service worker precaches 45 files, reload with network off shows title and plays |

## Bugs found by running it (all fixed)
1. A story-triggered form change (shimmer -> mermaid) was blocked by the busy flag, so the mermaid transformation never happened.
2. A stale tree sprite from the woods crashed the next scene (shore) on arrival, leaving a black screen.
3. The puzzle panel repeated a question the dialogue had just spoken.
4. Parent settings layout overflowed; grotto looked like a beach (added a multiply water tint and bubbles); stale counting tray carried between scenes.

## NOT verified
- `npm install`, `npm run build` (Vite), `npm run test:e2e` (the Playwright specs are written, not run; an equivalent puppeteer driver is what passed), GitHub Actions, GitHub Pages.
- **Safari / real iPad**: Safari audio unlock and silent-switch behaviour, Home Screen install, iOS safe-area rendering, WebKit double-tap/gesture quirks, performance. See `docs/IPAD_TEST_PLAN.md`.
- Narration voices (below).

## Narration status: NOT complete
- The 81 lines are organised by character **and** scene in `docs/AUDIO_SCRIPT.md` (+ machine-readable `docs/narration_manifest.json`).
- **No audio files exist.** No text-to-speech engine was available here (no espeak/piper/macOS `say`; PyPI/npm unreachable; headless Chrome exposes no voices), so
  no temporary recordings were generated, and none are claimed. Without clips the game shows the pulsing next arrow and, for adults, captions; puzzles still work but are silent.
- Ready to go: `python3 tools/make_tts_clips.py --engine espeak-ng|piper|say|command` generates generic synthetic temp voices per character (never real people),
  encodes m4a+ogg, and records provenance. Any file you drop in `public/assets/audio/narration/` is treated as a custom recording and is never overwritten. `--status` reports `custom` / `temp-tts` / `missing`.

## iPad / design caveats worth knowing
- Portrait works (smaller) with a picture-only "turn sideways" hint; landscape is the intended mode.
- Dialogue captions are on by default for grown-ups; toggle in the parent menu.
- Bedroom decorating is tap-to-cycle on glowing spots (no separate decor tray).

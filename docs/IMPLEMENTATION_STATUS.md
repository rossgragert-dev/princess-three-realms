# Implementation status - v0.1b "Standalone Edition"

**v0.1b:** `site/` is a complete static website (built by `tools/build-standalone.sh`, esbuild + the official Phaser 3.90.0 `phaser.min.js`). It was served with
Python's `http.server` **from a sub-path** (`/princess-three-realms/`, like GitHub Pages) and verified in real Chrome: full Chapter 1 to the bedroom lamp with the narration clips
playing, offline PWA (209 precached files, offline reload and play), iPad/phone viewport fit, touch, save and resume, narration hint/replay/idle behaviour. Deploy steps: `docs/DEPLOY_GITHUB_PAGES.md`.
Still NOT run: Safari/iPad, the Vite build, Playwright, GitHub Actions/Pages (repo creation is blocked from this session).

---
# v0.1a notes (kept)

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
| Narration playback pipeline | v0.1a: with throw-away test tones; v0.1b: re-run against the shipped Flite clips: lines play, advance by themselves, replay button re-speaks, picture taps say their word, wrong answers give a spoken gentle hint with no penalty, 10 s idle re-prompts, hint button replays the goal, no back-to-back duplicate prompts |
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

## Narration status (updated v0.1b): temporary synthetic clips exist; final voices do not
- All 81 lines now have **temporary** `.m4a` + `.ogg` clips generated offline with CMU Flite (the `flite` filter in the local ffmpeg; no network, no real person's voice).
  Each character has its own synthetic voice/pitch. They are robotic placeholders: **I could only verify that they play, not how pleasant they sound to a 5-year-old.** Listen on the iPad.
- Provenance is in `site/assets/audio/narration/provenance.json` (`source: tts`). Files you add yourself are never overwritten by `tools/make_tts_clips.py`; `--status` shows `temp-tts` / `custom` / `missing`.
- Organised by character and scene in `docs/AUDIO_SCRIPT.md`; machine-readable `docs/narration_manifest.json`.
- Replace any clip by dropping `<key>.m4a` (+ `.ogg`) into `assets/audio/narration/` of the deployed site; no engine rebuild.

## iPad / design caveats worth knowing
- Portrait works (smaller) with a picture-only "turn sideways" hint; landscape is the intended mode.
- Dialogue captions are on by default for grown-ups; toggle in the parent menu.
- Bedroom decorating is tap-to-cycle on glowing spots (no separate decor tray).

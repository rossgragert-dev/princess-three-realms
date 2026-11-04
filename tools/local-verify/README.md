# Local browser verification (when `npm install` is unavailable)

These scripts run the **real game on real Phaser 3.90.0 in real Chrome** without npm:

1. Check out the official tag: `git clone --depth 1 --branch v3.90.0 https://github.com/phaserjs/phaser /home/claude/phaserjs/phaser`
2. `tools/local-verify/build.sh` bundles `src/` with esbuild against `phaser/dist/phaser.js` into `$SITE` (default `/tmp/ptr-site`).
3. `cd /tmp/ptr-site && python3 -m http.server 4173 &`
4. Run drivers with Node (needs `puppeteer-core`, set `PUPPETEER_DIR` to its node_modules; `CHROME` = Chrome binary).

| Script | What it proves |
|---|---|
| `chapter.mjs` | Whole Chapter 1 from Play to the bedroom lamp (exit code 0 only if `LAMP_PLACED`); reports narration clips played |
| `screenshots.mjs` | Writes the real browser screenshots in `docs/screenshots/browser/` |
| `device.mjs` | iPad/phone viewport fit, real touch events, save and resume after reload |
| `pwa.mjs` | Service worker precache and offline reload + play (run `PROD=true build.sh`, copy `public/sw.js`, then `node tools/make_precache.mjs $SITE`) |
| `narration.mjs` | Hint button, puzzle prompt, replay button, picture words, gentle hints, idle hint (needs clips present; test tones are fine) |

This is **not** the production build (Vite) and not Safari. `npm run build`, CI and the iPad pass remain the release gate.

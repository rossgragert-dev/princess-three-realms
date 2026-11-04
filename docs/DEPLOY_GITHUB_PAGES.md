# Deploying the standalone site (no npm, no Actions)

`site/` is the whole game as plain static files: `index.html`, `app.js` (the compiled game), `phaser.min.js` (official Phaser 3.90.0),
`assets/` (sprites, tiles, UI, 81 narration clips), `manifest.webmanifest`, `sw.js`, `precache.json`, `icons/`, `.nojekyll`.
All URLs are relative, so it works at the root of a domain or under `https://<you>.github.io/princess-three-realms/`.

## Option A - upload through the GitHub website (nothing to install)
1. github.com -> **New repository** -> name `princess-three-realms`, **Public**, create (an empty repo is fine).
2. **Add file -> Upload files**. Unzip `princess-three-realms-site.zip` on your computer and drag the **contents** (not the folder) into the page:
   `index.html`, `app.js`, `phaser.min.js`, `sw.js`, `precache.json`, `manifest.webmanifest`, `assets/`, `icons/`.
   - Dotfiles: the browser upload ignores dotfiles on some systems. Make sure `.nojekyll` exists: **Add file -> Create new file**, name it `.nojekyll`, leave it empty, commit.
   - The upload page handles ~100 files per drop; drag `assets/` in two or three batches if it stalls (the narration folder alone has 162 files).
3. Commit directly to `main`.
4. **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch -> Branch: `main`, folder `/ (root)` -> Save.**
5. After about a minute: `https://<you>.github.io/princess-three-realms/`

## Option B - command line with a `gh-pages` branch (what `docs/GITHUB_SETUP.md` automates)
The bundle `princess-three-realms.bundle` already contains a `gh-pages` branch holding exactly the contents of `site/`.
```bash
git clone princess-three-realms.bundle princess-three-realms && cd princess-three-realms
gh repo create princess-three-realms --public --source=. --remote=origin
git push origin main gh-pages
gh api -X POST repos/$(gh api user -q .login)/princess-three-realms/pages -f 'source[branch]=gh-pages' -f 'source[path]=/'
```
Or in the web UI: Settings -> Pages -> Source: Deploy from a branch -> `gh-pages` / `(root)`.
No workflow runs; nothing is built on GitHub. (The `.github/workflows/*.yml` files only apply to the future Vite build and can be ignored or deleted.)

## Updating the game later
Rebuild `site/` with `tools/build-standalone.sh` (needs esbuild + the Phaser 3.90.0 release file), then replace the files on `gh-pages`
(`git checkout gh-pages`, copy new `site/*`, commit, push). The service worker cache name changes with every build, so iPads pick up the new version on the next launch (fully close and reopen the Home Screen app once).

## Narration without rebuilding
Put `<key>.m4a` (and ideally `.ogg`) in `assets/audio/narration/` on the deployed branch. File names are in `docs/narration_manifest.json`.
The 81 clips shipped now are **temporary synthetic voices (CMU Flite)**, listed in `assets/audio/narration/provenance.json`. Recordings you add are never overwritten by the tool. After adding files, run `node tools/make_precache.mjs site` (or tell me) so offline mode caches them.

## Installing on iPad
Safari -> open the URL -> Share -> **Add to Home Screen**. First launch needs internet once; afterwards it runs offline.

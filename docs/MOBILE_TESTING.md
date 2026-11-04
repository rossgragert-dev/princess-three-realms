# Mobile testing and releases (no ZIP uploads)

## One-time GitHub Pages setting

Open https://github.com/rossgragert-dev/princess-three-realms/settings/pages

Under **Build and deployment → Source**, choose **GitHub Actions**. Do not choose a starter workflow; `.github/workflows/pages.yml` already exists.

This is a one-time switch from the old `gh-pages / (root)` publication method. The workflow publishes both:
- **Preview:** https://rossgragert-dev.github.io/princess-three-realms/preview/
- **Stable iPad release:** https://rossgragert-dev.github.io/princess-three-realms/

The preview always copies the committed `main/site/` folder. The stable site copies the last approved `gh-pages` branch. There is no npm install or Vite build in the Pages workflow.

## Each development update

1. Change the TypeScript source and/or art assets in the **existing project**.
2. Regenerate `site/` using `tools/build-standalone.sh` in an environment with the existing esbuild and Phaser 3.90.0 binaries. No npm registry access is required when those dependencies are already present.
3. Commit **both** the edited source and all changes under `site/` to `main`; push to GitHub using an **authenticated GitHub write connection**.
4. GitHub Actions deploys `site/` automatically to the preview address.
5. Open the preview URL directly on a phone or iPad; no ZIP download, local server, or installation required.

The Pages workflow copies *already built* files. Pushing changes to `src/` without rebuilding and committing `site/` will **not** change the preview. The Pages workflow checks that `site/index.html`, `app.js`, `phaser.min.js`, `sw.js`, `manifest.webmanifest`, and `precache.json` exist.

### No push access in Claude's environment?

A CI workflow cannot publish changes GitHub never receives. Connect Claude's development environment to GitHub with write permissions, use a repository-connected coding environment, or supply changes to an assistant with an authorized GitHub connection. Do **not** put an access token into the game, chat transcripts, or repository.

## Promote a tested build to the stable iPad URL

1. On GitHub, open **Actions → Princess — Mobile Preview and iPad Release (no npm)**.
2. Click **Run workflow**, choose `main`, and check the **promote** option.
3. The workflow copies `main/site/` into `gh-pages` (the approved snapshot) and publishes it to the stable root URL as well as the preview.

Never promote a build until it works in mobile Safari. Normal pushes update preview **only** and cannot replace stable.

## Offline / PWA behavior

Both installations are supported separately. The workflow namespaces cache storage by service-worker registration scope, avoiding collisions between stable and preview builds on the same origin.

When testing a fresh build, first reload the preview while online so Safari can fetch a new service worker; fully closing and reopening a Home Screen install may be necessary. Offline play must be reverified on a real iPad.

**Note:** Until the first GitHub Actions deployment succeeds, the preview URL may be missing. The stable root remains served by the existing branch setting.

## Recommended workflow

Use the preview as the in-progress development playground. Add the stable site to your daughter's iPad Home Screen only after you approve a mobile playtest. Keep the stable release unchanged while development continues.

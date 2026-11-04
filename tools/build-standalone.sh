#!/bin/sh
# STANDALONE BUILD: produces ./site/, a complete static website. No npm, Vite, node_modules or dev server needed to DEPLOY it.
# Building it needs only: an esbuild binary, and phaser.min.js from the official Phaser 3.90.0 release (github tag v3.90.0).
#   PHASER_ROOT  checkout of github.com/phaserjs/phaser @ v3.90.0  (default /home/claude/phaserjs/phaser)
#   ESBUILD      esbuild binary (default: esbuild on PATH)
#   OUT          output folder (default <repo>/site)
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
PHASER_ROOT=${PHASER_ROOT:-/home/claude/phaserjs/phaser}
ESBUILD=${ESBUILD:-esbuild}
OUT=${OUT:-$ROOT/site}
# keep recorded narration + provenance when rebuilding over an existing site
KEEP=$(mktemp -d); [ -d "$OUT/assets/audio/narration" ] && cp -r "$OUT/assets/audio/narration/." "$KEEP/" || true
rm -rf "$OUT"; mkdir -p "$OUT"
cp -r "$ROOT/public/." "$OUT/"
cp -r "$KEEP/." "$OUT/assets/audio/narration/" 2>/dev/null || true; rm -rf "$KEEP"
cp "$PHASER_ROOT/dist/phaser.min.js" "$OUT/phaser.min.js"
SHIM=$(mktemp); echo 'export default window.Phaser;' > "$SHIM.js"
"$ESBUILD" "$ROOT/src/main.ts" --bundle --minify --format=iife --target=es2020 --alias:phaser="$SHIM.js" \
  --define:import.meta.env.DEV=false --define:import.meta.env.PROD=true --outfile="$OUT/app.js" --log-level=error
rm -f "$SHIM" "$SHIM.js"
sed -e 's#<script type="module" src="/src/main.ts"></script>#<script src="./phaser.min.js"></script><script src="./app.js"></script>#' "$ROOT/index.html" > "$OUT/index.html"
grep -q 'phaser.min.js' "$OUT/index.html" || { echo "index.html rewrite failed" >&2; exit 1; }
touch "$OUT/.nojekyll"
node "$ROOT/tools/make_precache.mjs" "$OUT"
echo "standalone site built at $OUT ($(du -sh "$OUT" | cut -f1))"

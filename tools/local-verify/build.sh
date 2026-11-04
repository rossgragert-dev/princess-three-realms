#!/bin/sh
# LOCAL VERIFICATION BUILD (not the production build): bundles src/ with esbuild against the official Phaser 3.90.0 dist
# so the game can be run in a real browser where `npm install` is impossible. Production = `npm run build` (Vite).
#   PHASER_ROOT  checkout of github.com/phaserjs/phaser at tag v3.90.0   (default /home/claude/phaserjs/phaser)
#   ESBUILD      esbuild binary                                           (default: esbuild on PATH)
#   SITE         output folder                                            (default /tmp/ptr-site)
#   PROD=true    enables service-worker registration (offline test)
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
PHASER_ROOT=${PHASER_ROOT:-/home/claude/phaserjs/phaser}
SITE=${SITE:-/tmp/ptr-site}
ESBUILD=${ESBUILD:-esbuild}
mkdir -p "$SITE"
cp -r "$ROOT/public/." "$SITE/"
cp "$PHASER_ROOT/dist/phaser.js" "$SITE/phaser.js"
echo 'export default window.Phaser;' > "$SITE/.phaser-shim.js"
"$ESBUILD" "$ROOT/src/main.ts" --bundle --format=iife --target=es2020 --alias:phaser="$SITE/.phaser-shim.js" \
  --define:import.meta.env.DEV=false --define:import.meta.env.PROD=${PROD:-false} --outfile="$SITE/app.js" --log-level=error
sed -e 's#<script type="module" src="/src/main.ts"></script>#<script src="./phaser.js"></script><script src="./app.js"></script>#' "$ROOT/index.html" > "$SITE/index.html"
rm -f "$SITE/.phaser-shim.js"
echo "built $SITE (serve with: cd $SITE && python3 -m http.server 4173)"

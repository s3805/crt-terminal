#!/bin/bash
# Rebuild CRT-1990.app: regenerate the icon set and sync the runtime copy
# inside the bundle with the sources in this directory.
# Run this after changing any code, so the .app never drifts out of sync.
#
# Note: the bundled runtime has no node_modules of its own — Node resolves
# them by walking up parent directories — so keep the .app inside the project.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "[build-app] generating icon..."
python3 build_icon.py
rm -rf AppIcon.iconset
mkdir -p AppIcon.iconset
for s in 16 32 128 256 512; do
  sips -z "$s" "$s" AppIcon_1024.png --out "AppIcon.iconset/icon_${s}x${s}.png" >/dev/null
  sips -z $((s * 2)) $((s * 2)) AppIcon_1024.png --out "AppIcon.iconset/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns AppIcon.iconset -o AppIcon.icns
cp AppIcon.icns "CRT-1990.app/Contents/Resources/AppIcon.icns"

echo "[build-app] syncing runtime copy..."
RT="CRT-1990.app/Contents/Resources/runtime"
mkdir -p "$RT/public"
rsync -a server.js pty_bridge.py package.json package-lock.json "$RT/"
rsync -a public/ "$RT/public/"

# Refresh any installed copies of the app (Desktop and/or /Applications),
# keeping their .chrome-profile and node_modules untouched.
for DEST_APP in "$HOME/Desktop/CRT-1990.app" "/Applications/CRT-1990.app"; do
  if [ -d "$DEST_APP" ]; then
    echo "[build-app] syncing $DEST_APP ..."
    cp "$DIR/CRT-1990.app/Contents/MacOS/launcher.sh" "$DEST_APP/Contents/MacOS/launcher.sh"
    cp "$DIR/CRT-1990.app/Contents/Resources/AppIcon.icns" "$DEST_APP/Contents/Resources/AppIcon.icns"
    cp "$RT/server.js" "$RT/pty_bridge.py" "$RT/package.json" "$DEST_APP/Contents/Resources/runtime/"
    cp "$RT/public/"* "$DEST_APP/Contents/Resources/runtime/public/"
    chmod +x "$DEST_APP/Contents/MacOS/launcher.sh"
  fi
done

echo "[build-app] done."

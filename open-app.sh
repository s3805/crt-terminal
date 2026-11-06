#!/bin/bash
# Launch CRT-1990 PRO as a 100% standalone desktop application.
# Priority: Electron Standalone Window -> Chrome App Mode -> Default Browser.
# Double-click CRT-1990.app, or run:  bash open-app.sh  or  npm run desktop

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ---- locate a usable node binary ----
NODE=""
for p in /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node "$HOME/.workbuddy/binaries/node/versions/22.22.2/bin/node"; do
  [ -x "$p" ] && NODE="$p" && break
done
[ -z "$NODE" ] && NODE="$(command -v node || echo node)"
if ! "$NODE" --version >/dev/null 2>&1; then
  echo "需要 Node.js 才能运行。请先安装：https://nodejs.org 或 brew install node"
  exit 1
fi

# 1. Preferred: Launch Electron Standalone Desktop Window (No Chrome required!)
ELECTRON_BIN=""
if [ -x "$DIR/node_modules/.bin/electron" ]; then
  ELECTRON_BIN="$DIR/node_modules/.bin/electron"
elif command -v electron >/dev/null 2>&1; then
  ELECTRON_BIN="$(command -v electron)"
fi

if [ -n "$ELECTRON_BIN" ]; then
  echo "[CRT-1990 PRO] 启动独立桌面应用 (Electron Standalone)..."
  # Pass --no-sandbox if running under Linux container environments
  if [ "$(uname -s)" = "Linux" ]; then
    "$ELECTRON_BIN" --no-sandbox . "$@"
  else
    "$ELECTRON_BIN" . "$@"
  fi
  exit $?
fi

# 2. Fallback: Standalone Chrome App mode
find_chrome() {
  local c
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/System/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" "/usr/bin/chromium" "/usr/bin/chromium-browser"; do
    [ -x "$c" ] && { echo "$c"; return 0; }
  done
  c="$(mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'" 2>/dev/null | head -1)"
  [ -n "$c" ] && [ -x "$c/Contents/MacOS/Google Chrome" ] && { echo "$c/Contents/MacOS/Google Chrome"; return 0; }
  c="$(command -v google-chrome google-chrome-stable chromium chromium-browser 2>/dev/null | head -1)"
  [ -n "$c" ] && { echo "$c"; return 0; }
  return 1
}

healthy() {
  curl -s --max-time 1 http://127.0.0.1:7681/health | grep -q '"ok"'
}
OUR_PID=""
if ! healthy; then
  "$NODE" server.js >/tmp/crt1990-server.log 2>&1 &
  OUR_PID=$!
  sleep 1.5
fi

CHROME="$(find_chrome || true)"
PROFILE="$DIR/.chrome-profile"

if [ -n "$CHROME" ]; then
  echo "[CRT-1990 PRO] 未检测到 Electron，使用 Chrome 应用模式启动..."
  "$CHROME" --user-data-dir="$PROFILE" \
    --no-first-run --no-default-browser-check \
    --app=http://127.0.0.1:7681 \
    --start-fullscreen --hide-scrollbars --disable-default-apps &
  CHROME_PID=$!
  wait "$CHROME_PID"
else
  echo "[CRT-1990 PRO] 改用系统默认浏览器打开..."
  open http://127.0.0.1:7681 2>/dev/null || xdg-open http://127.0.0.1:7681 2>/dev/null
  exit 0
fi

if [ -n "$OUR_PID" ]; then
  kill "$OUR_PID" 2>/dev/null
fi
echo "CRT-1990 closed."

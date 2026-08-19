#!/bin/bash
# Launch CRT-1990 as a standalone, borderless Chrome "app" window.
# No address bar / tabs — it reads like a real appliance.
# Double-click CRT-1990.app, or run:  bash open-app.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ---- locate a usable node binary (GUI apps get a minimal PATH) ----
NODE=""
for p in /usr/local/bin/node /opt/homebrew/bin/node /usr/bin/node "$HOME/.workbuddy/binaries/node/versions/22.22.2/bin/node"; do
  [ -x "$p" ] && NODE="$p" && break
done
[ -z "$NODE" ] && NODE="$(command -v node || echo node)"
if ! "$NODE" --version >/dev/null 2>&1; then
  echo "需要 Node.js 才能运行。请先安装：https://nodejs.org 或 brew install node"
  exit 1
fi

# ---- locate Chrome / Chromium (macOS, Linux, generic) ----
find_chrome() {
  local c
  for c in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/System/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/usr/bin/google-chrome" "/usr/bin/google-chrome-stable" "/usr/bin/chromium" "/usr/bin/chromium-browser"; do
    [ -x "$c" ] && { echo "$c"; return 0; }
  done
  # Spotlight on macOS
  c="$(mdfind "kMDItemCFBundleIdentifier == 'com.google.Chrome'" 2>/dev/null | head -1)"
  [ -n "$c" ] && [ -x "$c/Contents/MacOS/Google Chrome" ] && { echo "$c/Contents/MacOS/Google Chrome"; return 0; }
  # PATH
  c="$(command -v google-chrome google-chrome-stable chromium chromium-browser 2>/dev/null | head -1)"
  [ -n "$c" ] && { echo "$c"; return 0; }
  return 1
}

# ---- start the backend terminal server only if it isn't already running ----
OUR_PID=""
if ! curl -s -o /dev/null --max-time 2 http://127.0.0.1:7681/health; then
  "$NODE" server.js >/tmp/crt1990-server.log 2>&1 &
  OUR_PID=$!
  sleep 1.5
fi

CHROME="$(find_chrome || true)"
PROFILE="$DIR/.chrome-profile"

if [ -n "$CHROME" ]; then
  # Force a fresh, isolated Chrome instance so --app mode is honored and the
  # whole thing quits cleanly when the window is closed.
  "$CHROME" --user-data-dir="$PROFILE" \
    --no-first-run --no-default-browser-check \
    --app=http://127.0.0.1:7681 \
    --start-fullscreen --hide-scrollbars --disable-default-apps &
  CHROME_PID=$!
  wait "$CHROME_PID"
else
  echo "未找到 Google Chrome/Chromium，改用默认浏览器打开（非全屏独立窗口）。"
  echo "建议安装 Chrome 以获得完整体验：https://www.google.com/chrome/"
  open http://127.0.0.1:7681 2>/dev/null || xdg-open http://127.0.0.1:7681 2>/dev/null
  # cannot track a default-browser window, just leave the server running
  echo "已在默认浏览器打开。关闭浏览器页面后，后端仍在运行（可执行 bash stop.sh 关闭）。"
  exit 0
fi

# Chrome window closed — tear down the server we started (if any).
if [ -n "$OUR_PID" ]; then
  kill "$OUR_PID" 2>/dev/null
fi
echo "CRT-1990 closed."

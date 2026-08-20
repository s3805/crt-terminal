'use strict';

/* =========================================================
   CRT-1990 — Real local terminal (xterm.js over WebSocket PTY)

   Design note (the fix for the "blank / can't type" bug):
   A real minicomputer's firmware prints its POST/self-test INTO the
   very screen the shell later uses. So we do the same — the boot
   text is written straight into xterm, and the shell prompt follows
   it naturally. There is NO separate HTML overlay layer, so there is
   no z-index / display / timing race that can blank the screen.
   ========================================================= */

// Derive the WebSocket host from the page URL so a custom PORT env on the
// server keeps working; fall back for exotic embeds that report no host.
const WS_HOST = window.location.host || '127.0.0.1:7681';

/* =========================================================
   Display styles — presets tuned after cool-retro-term's
   built-in profiles (Amber / Apple ][ / IBM 3278 / ...).
   Each style drives the xterm color theme AND the CRT effect
   knobs (CSS variables): glow tint, scanline / noise / beam /
   ambient-light intensity.
   Switch with Ctrl+Shift+K or by clicking the panel model name.
   ========================================================= */
const THEMES = [
  {
    label: 'GREEN PHOSPHOR',
    css: { '--phosphor': '#33ff66', '--phosphor-dim': '#1f9c3f', '--screen-bg': '#020a04', '--glow-rgb': '51,255,102', '--beam-rgb': '190,255,205', '--scan-o': '.9', '--beam-o': '1', '--dot-o': '.12', '--noise-o': '.05', '--ambient-o': '.06' },
    colors: { bg: '#020a04', fg: '#33ff66', bright: '#7dffa6', dim: '#1c5e30', black: '#0b1a0f', white: '#bdf5c8', brightWhite: '#e8ffea' },
  },
  {
    label: 'AMBER PHOSPHOR',
    css: { '--phosphor': '#ffb000', '--phosphor-dim': '#b87a00', '--screen-bg': '#0a0402', '--glow-rgb': '255,176,0', '--beam-rgb': '255,225,170', '--scan-o': '.9', '--beam-o': '1', '--dot-o': '.12', '--noise-o': '.05', '--ambient-o': '.07' },
    colors: { bg: '#0a0402', fg: '#ffb000', bright: '#ffd24a', dim: '#6e4a00', black: '#1a1005', white: '#f2ddb0', brightWhite: '#fff3d6' },
  },
  {
    label: 'APPLE ][ GREEN',
    css: { '--phosphor': '#4dff6b', '--phosphor-dim': '#2fb84f', '--screen-bg': '#001100', '--glow-rgb': '77,255,107', '--beam-rgb': '200,255,210', '--scan-o': '.95', '--beam-o': '1', '--dot-o': '.12', '--noise-o': '.07', '--ambient-o': '.10' },
    colors: { bg: '#001100', fg: '#4dff6b', bright: '#a8ffc0', dim: '#145c26', black: '#04150a', white: '#c8ffd4', brightWhite: '#eafff0' },
  },
  {
    label: 'DEEP BLUE',
    css: { '--phosphor': '#7fb4ff', '--phosphor-dim': '#4a7ac0', '--screen-bg': '#000814', '--glow-rgb': '127,180,255', '--beam-rgb': '210,230,255', '--scan-o': '.9', '--beam-o': '1', '--dot-o': '.12', '--noise-o': '.04', '--ambient-o': '.07' },
    colors: { bg: '#000814', fg: '#7fb4ff', bright: '#bcd8ff', dim: '#1d3a66', black: '#050d1a', white: '#cfe2ff', brightWhite: '#ecf4ff' },
  },
  {
    label: 'NEON CYAN',
    css: { '--phosphor': '#52f7ff', '--phosphor-dim': '#2fb3bd', '--screen-bg': '#001018', '--glow-rgb': '82,247,255', '--beam-rgb': '220,255,255', '--scan-o': '.9', '--beam-o': '1', '--dot-o': '.12', '--noise-o': '.05', '--ambient-o': '.08' },
    colors: { bg: '#001018', fg: '#52f7ff', bright: '#aefcff', dim: '#14545c', black: '#051318', white: '#d2fbff', brightWhite: '#ecffff' },
  },
  {
    // cool-retro-term's "IBM 3278 Reborn": a clean modern tube — no noise,
    // faint scanlines, no beam, no mask, minimal glow.
    label: 'IBM 3278 CLEAN',
    css: { '--phosphor': '#3cff7a', '--phosphor-dim': '#1c8a44', '--screen-bg': '#000000', '--glow-rgb': '60,255,122', '--beam-rgb': '200,255,215', '--scan-o': '.4', '--beam-o': '0', '--dot-o': '0', '--noise-o': '0', '--ambient-o': '.03' },
    colors: { bg: '#000000', fg: '#3cff7a', bright: '#8dffb4', dim: '#14532d', black: '#061207', white: '#c2ffd6', brightWhite: '#e6fff0' },
  },
];

// Build a full 16-color xterm palette around a phosphor tint; accent hues
// stay standard (muted) so `ls` colors etc. remain distinguishable.
function buildXtermTheme(c) {
  return {
    background: c.bg,
    foreground: c.fg,
    cursor: c.bright,
    cursorAccent: c.bg,
    selectionBackground: c.dim,
    black: c.black,
    red: '#ff5c5c',
    green: c.fg,
    yellow: '#ffd24a',
    blue: '#4aa3ff',
    magenta: '#c77dff',
    cyan: '#3ef0d0',
    white: c.white,
    brightBlack: c.dim,
    brightRed: '#ff8585',
    brightGreen: c.bright,
    brightYellow: '#ffe488',
    brightBlue: '#84c4ff',
    brightMagenta: '#dda6ff',
    brightCyan: '#88f5e0',
    brightWhite: c.brightWhite,
  };
}

function initTerminal() {
  const term = new Terminal({
    fontSize: 18,
    // Menlo is macOS's classic Terminal.app face: smooth vector rendering
    // (no pixelated bitmap look) while keeping the monospace CRT feel.
    // PingFang SC etc. cover CJK so Chinese keeps full-cell alignment.
    fontFamily: "'Menlo', 'Monaco', 'Sarasa Mono SC', 'PingFang SC', 'Noto Sans Mono CJK SC', 'WenQuanYi Micro Hei Mono', monospace",
    lineHeight: 1.25,
    letterSpacing: 0,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 3000,
    allowProposedApi: true,
    theme: buildXtermTheme(THEMES[0].colors),
  });

  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById('terminal'));

  const statusEl = document.getElementById('status');
  const baudEl = document.getElementById('baud');
  const hintEl = document.getElementById('hint');
  const modelEl = document.getElementById('model');
  const toastEl = document.getElementById('toast');

  // --- Display-style switching (persisted across sessions) ---
  let themeIndex = 0;
  try {
    themeIndex = parseInt(localStorage.getItem('crt-theme') || '0', 10) || 0;
    if (themeIndex < 0 || themeIndex >= THEMES.length) themeIndex = 0;
  } catch (e) {}

  function applyTheme(i, announce) {
    themeIndex = ((i % THEMES.length) + THEMES.length) % THEMES.length;
    const t = THEMES[themeIndex];
    const root = document.documentElement.style;
    Object.entries(t.css).forEach(([k, v]) => root.setProperty(k, v));
    term.options.theme = buildXtermTheme(t.colors);
    if (modelEl) modelEl.textContent = 'CRT-1990 · ' + t.label;
    try { localStorage.setItem('crt-theme', String(themeIndex)); } catch (e) {}
    if (announce && toastEl) {
      toastEl.textContent = '◈ ' + t.label;
      toastEl.classList.add('show');
      clearTimeout(applyTheme._timer);
      applyTheme._timer = setTimeout(() => toastEl.classList.remove('show'), 1200);
    }
  }
  applyTheme(themeIndex, false);

  // Ctrl+Shift+K cycles styles; the combo never reaches the shell.
  term.attachCustomKeyEventHandler((ev) => {
    if (ev.type === 'keydown' && ev.ctrlKey && ev.shiftKey && !ev.altKey && !ev.metaKey && ev.code === 'KeyK') {
      applyTheme(themeIndex + 1, true);
      return false;
    }
    return true;
  });
  // Clicking the panel model name cycles too.
  if (modelEl) modelEl.addEventListener('click', () => applyTheme(themeIndex + 1, true));
  const chipEl = document.getElementById('stylechip');
  if (chipEl) chipEl.addEventListener('click', (ev) => {
    ev.stopPropagation();
    applyTheme(themeIndex + 1, true);
  });

  let ws = null;
  let wsReady = false;
  let everConnected = false;  // true once the first connection has opened
  let inputBuffer = [];      // keystrokes typed before the socket is open
  let postBuffer = [];       // shell output arriving during the POST animation
  let booting = true;        // true until runBoot() finishes

  function doFit() {
    try { fit.fit(); } catch (e) {}
  }
  doFit();
  applyCrtWarp();

  // Re-fit and resize the PTY whenever the glass changes size.
  const ro = new ResizeObserver(() => {
    doFit();
    scheduleCrtWarp();
    if (wsReady) ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
  });
  ro.observe(document.getElementById('crt'));
  window.addEventListener('resize', () => {
    doFit();
    scheduleCrtWarp();
    if (wsReady) ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(doFit);
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    ws = new WebSocket('ws://' + WS_HOST + '/pty');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      wsReady = true;
      if (everConnected) {
        // A reconnect means the old session is gone and a fresh shell is
        // starting. Reset the terminal: if the connection died mid-escape-
        // sequence or mid-UTF-8-character, the parser state would otherwise
        // garble everything written afterwards.
        term.reset();
        term.write('\x1b[32m[ 已重新连接 / RECONNECTED — 新会话已启动 ]\x1b[0m\r\n');
      }
      everConnected = true;
      statusEl.textContent = '● ONLINE';
      baudEl.textContent = term.cols + 'x' + term.rows + ' GREEN';
      if (inputBuffer.length) {
        ws.send(JSON.stringify({ type: 'input', data: inputBuffer.join('') }));
        inputBuffer = [];
      }
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (ev) => {
      const data = (ev.data instanceof ArrayBuffer) ? new Uint8Array(ev.data) : ev.data;
      if (booting) {
        // Hold shell output until the POST text has finished, so the
        // firmware banner and the shell prompt don't interleave.
        postBuffer.push(data);
      } else {
        term.write(data);
      }
    };

    ws.onclose = () => {
      wsReady = false;
      statusEl.textContent = '● OFFLINE';
      // Drop output buffered from the dead connection so stale bytes don't
      // land on screen after the POST animation finishes.
      postBuffer = [];
      if (!booting) {
        // The client retries automatically (see connect() below), so say so —
        // "restart the server" would be misleading advice.
        term.write('\r\n\x1b[33m*** 连接中断 / CONNECTION LOST — 自动重连中… ***\x1b[0m\r\n');
      }
      setTimeout(connect, 3000); // auto-retry
    };

    ws.onerror = () => {
      statusEl.textContent = '● ERROR';
    };
  }

  term.onData((data) => {
    if (wsReady) {
      ws.send(JSON.stringify({ type: 'input', data: data }));
    } else {
      inputBuffer.push(data);
    }
  });

  connect();

  // Chrome throttles timers in hidden windows (down to ~1/min), which delays
  // the 3s reconnect loop. When the window becomes visible again — e.g. after
  // the system slept — reconnect immediately instead of waiting for a timer.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ws && ws.readyState !== WebSocket.OPEN) connect();
  });

  // --- Focus management: inside an iframe the screen must be clicked once
  //     before it captures the keyboard. Make that effortless. ---
  const focusNow = () => { term.focus(); if (hintEl) hintEl.style.display = 'none'; };
  if (term.textarea) term.textarea.addEventListener('focus', () => { if (hintEl) hintEl.style.display = 'none'; });
  window.addEventListener('focus', focusNow);
  document.addEventListener('click', focusNow);
  document.addEventListener('keydown', () => { if (hintEl) hintEl.style.display = 'none'; });
  document.getElementById('crt').addEventListener('click', focusNow);
  term.focus();
  if (hintEl) hintEl.style.display = 'block';

  // If the server isn't reachable after a few seconds, say so plainly.
  setTimeout(() => {
    if (!wsReady) {
      term.write('\r\n\x1b[33m[ 终端服务器未连接 / SERVER NOT REACHABLE ]\x1b[0m\r\n');
      term.write('\x1b[33m请确认本机已运行:  node server.js\x1b[0m\r\n');
      term.write('\x1b[33m或直接在本机浏览器打开:  http://127.0.0.1:7681\x1b[0m\r\n');
    }
  }, 4000);

  function finishBoot() {
    booting = false;
    for (const chunk of postBuffer) {
      term.write(chunk);
    }
    postBuffer = [];
  }

  return { term, finishBoot };
}

/* =========================================================
   Real CRT barrel curvature — an SVG feDisplacementMap warp.

   cool-retro-term bends the tube face with the sampling field
   s = q + k·q·|q|²  (output pixels sample FARTHER OUT, so the picture
   wraps around the bulge: edges compress, like a convex tube).
   A bake of that field into a canvas texture drives feDisplacementMap;
   the terminal renders with an overscan margin (like a real CRT, whose
   raster is larger than the visible glass) so outward sampling at the
   corners never clips characters.
   ========================================================= */
const WARP_STRENGTH = 0;     // 桶形畸变强度;0 = 关闭(0.022 为典型凸面曲率)

let warpTimer = null;
function applyCrtWarp() {
  const warpEl = document.getElementById('warp');
  if (!warpEl) return;
  if (WARP_STRENGTH <= 0) {
    // Curvature disabled: render flat, no overscan margin.
    warpEl.style.filter = 'none';
    warpEl.style.removeProperty('--overscan');
    return;
  }
  const rect = warpEl.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w < 40 || h < 40) return;

  const maxDisp = Math.max(4, Math.round(WARP_STRENGTH * w));
  const k = maxDisp / (0.25 * w); // so the extreme corner samples maxDisp px out
  // Overscan margin: the source must extend past the visible tube face by at
  // least the corner sampling distance, or corners would sample empty space.
  const margin = maxDisp + 4;

  // Bake the displacement field into an sRGB texture: R = 0.5 + dx/2M, G = 0.5 + dy/2M
  const mw = 160;
  const mh = Math.max(24, Math.round((160 * h) / w));
  const c = document.createElement('canvas');
  c.width = mw; c.height = mh;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) {
    const v = y / (mh - 1) - 0.5;
    for (let x = 0; x < mw; x++) {
      const u = x / (mw - 1) - 0.5;
      const r2 = u * u + v * v;
      const dx = k * u * r2 * w;   // outward: convex bulge
      const dy = k * v * r2 * w;
      const i = (y * mw + x) * 4;
      img.data[i]     = Math.round((0.5 + dx / (2 * maxDisp)) * 255);
      img.data[i + 1] = Math.round((0.5 + dy / (2 * maxDisp)) * 255);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const SVG_NS = 'http://www.w3.org/2000/svg';
  let svg = document.getElementById('crtwarp-svg');
  if (!svg) {
    svg = document.createElementNS(SVG_NS, 'svg');
    svg.id = 'crtwarp-svg';
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';
    document.body.appendChild(svg);
  }
  // The filter region must cover the overscanned (bled) source, not just the
  // visible box, so the corners can sample from beyond the tube face.
  svg.innerHTML =
    '<filter id="crtWarp" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">' +
    '<feImage href="' + c.toDataURL() + '" result="map" x="' + (-margin) + '" y="' + (-margin) + '" width="' + (w + 2 * margin) + '" height="' + (h + 2 * margin) + '" preserveAspectRatio="none"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (2 * maxDisp) + '" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter>';
  warpEl.style.filter = 'url(#crtWarp)';
  // Publish the overscan margin so #screen and the effect layers bleed their
  // content beyond the visible glass for the warp to sample.
  warpEl.style.setProperty('--overscan', '-' + margin + 'px');
}

function scheduleCrtWarp() {
  clearTimeout(warpTimer);
  warpTimer = setTimeout(applyCrtWarp, 150);
}

/* =========================================================
   POST / self-test, typed straight into the live screen.
   ========================================================= */
async function runBoot(term) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const type = async (s, cps = 220) => {
    for (const ch of s) {
      term.write(ch);
      await sleep(1000 / cps + Math.random() * 6);
    }
    term.write('\r\n');
  };

  term.write('\x1b[2J\x1b[H'); // clear screen, home
  await type('CRT-1990  GREEN PHOSPHOR DISPLAY SYSTEM', 360);
  await type('(c) 1990 NORTHBRIDGE MICROSYSTEMS  -  ALL RIGHTS RESERVED', 540);
  term.write('\r\n');
  await type('SYSTEM BIOS  v3.71 .................. OK', 820);
  await type('CPU  Z80A @ 4.0 MHz ................ OK', 820);

  // Live memory-count animation, rewritten in place.
  term.write('MEMORY TEST  ');
  for (let k = 0; k <= 640; k += 64) {
    term.write('\x1b[2K\rMEMORY TEST  ' + String(k).padStart(4, '0') + 'K');
    await sleep(40);
  }
  term.write('\x1b[2K\rMEMORY TEST  0640K ................ OK\r\n');
  await sleep(120);

  await type('VIDEO CONTROLLER  MDA/GREEN ...... OK', 820);
  await type('SERIAL PORT  COM1 @ 9600 8N1 .... OK', 820);
  await type('LOADING TERMINAL FIRMWARE ......... OK', 820);
  term.write('\r\n');
  await type('ESTABLISHING LOCAL SESSION .......', 680);
  await sleep(300);
  term.write('\r\n');
}

(async function () {
  const ctx = initTerminal();
  await runBoot(ctx.term);
  // Hand control to the shell: release any buffered output that arrived
  // during the POST animation, then let live output flow to the screen.
  ctx.finishBoot();
})();

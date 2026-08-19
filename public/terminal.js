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

const WS_HOST = '127.0.0.1:7681';

function initTerminal() {
  const term = new Terminal({
    fontSize: 20,
    // VT323 only covers Latin glyphs. Add real monospace CJK fallbacks so
    // Chinese characters keep cell alignment and don't collapse/overlap.
    fontFamily: "'VT323', 'Sarasa Mono SC', 'Noto Sans Mono CJK SC', 'WenQuanYi Micro Hei Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace",
    lineHeight: 1.25,
    letterSpacing: 0.5,
    cursorBlink: true,
    cursorStyle: 'block',
    scrollback: 3000,
    allowProposedApi: true,
    theme: {
      background: '#020a04',
      foreground: '#33ff66',
      cursor: '#7dffa6',
      cursorAccent: '#020a04',
      selectionBackground: '#1c5e30',
      black: '#0b1a0f',
      red: '#ff5c5c',
      green: '#33ff66',
      yellow: '#ffd24a',
      blue: '#4aa3ff',
      magenta: '#c77dff',
      cyan: '#3ef0d0',
      white: '#bdf5c8',
      brightBlack: '#1f3a26',
      brightRed: '#ff8585',
      brightGreen: '#7dffa6',
      brightYellow: '#ffe488',
      brightBlue: '#84c4ff',
      brightMagenta: '#dda6ff',
      brightCyan: '#88f5e0',
      brightWhite: '#e8ffea',
    },
  });

  const fit = new FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById('terminal'));

  const statusEl = document.getElementById('status');
  const baudEl = document.getElementById('baud');
  const hintEl = document.getElementById('hint');

  let ws = null;
  let wsReady = false;
  let inputBuffer = [];      // keystrokes typed before the socket is open
  let postBuffer = [];       // shell output arriving during the POST animation
  let booting = true;        // true until runBoot() finishes

  function doFit() {
    try { fit.fit(); } catch (e) {}
  }
  doFit();

  // Re-fit and resize the PTY whenever the glass changes size.
  const ro = new ResizeObserver(() => {
    doFit();
    if (wsReady) ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
  });
  ro.observe(document.getElementById('crt'));
  window.addEventListener('resize', () => {
    doFit();
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
      if (!booting) {
        term.write('\r\n\x1b[31m*** CONNECTION CLOSED — restart with: node server.js ***\x1b[0m\r\n');
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
    for (const chunk of postBuffer) term.write(chunk);
    postBuffer = [];
  }

  return { term, finishBoot };
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

'use strict';

/* =========================================================
   CRT-1990 PRO — Authentic 90s CRT Minicomputer Terminal
   With Photorealistic Chassis, Optical Layers, Web Audio & PTY
   ========================================================= */

const WS_HOST = window.location.host || '127.0.0.1:7681';

/* =========================================================
   Retro Web Audio Synthesizer (Zero External Audio Dependencies)
   Simulates authentic CRT relay clicks, flyback hum & degauss coil
   ========================================================= */
class RetroAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Heavy mechanical toggle switch snap
  playSwitch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.05);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);

    // Micro contact bounce
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'square';
      o2.frequency.setValueAtTime(260, t2);
      g2.gain.setValueAtTime(0.25, t2);
      g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.03);
      o2.connect(g2);
      g2.connect(this.ctx.destination);
      o2.start(t2);
      o2.stop(t2 + 0.035);
    }, 18);
  }

  // Rotary knob detent tick
  playKnob() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.02);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Authentic 60Hz Degauss Coil discharge: heavy thump and resonant decay
  playDegauss() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sub-bass 60Hz magnetic saturation
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.linearRampToValueAtTime(55, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.9);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    // Low-pass filter for inductive coil timbre
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.1);
  }
}

const audio = new RetroAudio();

/* =========================================================
   Phosphor Display Themes
   ========================================================= */
const THEMES = [
  {
    label: 'GREEN P1',
    css: {
      '--phosphor': '#33ff66',
      '--phosphor-dim': '#1f9c3f',
      '--screen-bg': '#020a04',
      '--glow-rgb': '51,255,102',
      '--beam-rgb': '190,255,205',
      '--scan-o': '0.85',
      '--beam-o': '0.95',
      '--dot-o': '0.14',
      '--noise-o': '0.05',
      '--ambient-o': '0.08',
    },
    colors: {
      bg: '#020a04',
      fg: '#33ff66',
      bright: '#7dffa6',
      dim: '#1c5e30',
      black: '#0b1a0f',
      white: '#bdf5c8',
      brightWhite: '#e8ffea',
    },
  },
  {
    label: 'AMBER P3',
    css: {
      '--phosphor': '#ffb000',
      '--phosphor-dim': '#b87a00',
      '--screen-bg': '#0a0402',
      '--glow-rgb': '255,176,0',
      '--beam-rgb': '255,225,170',
      '--scan-o': '0.85',
      '--beam-o': '0.95',
      '--dot-o': '0.14',
      '--noise-o': '0.05',
      '--ambient-o': '0.09',
    },
    colors: {
      bg: '#0a0402',
      fg: '#ffb000',
      bright: '#ffd24a',
      dim: '#6e4a00',
      black: '#1a1005',
      white: '#f2ddb0',
      brightWhite: '#fff3d6',
    },
  },
  {
    label: 'APPLE ][ GREEN',
    css: {
      '--phosphor': '#4dff6b',
      '--phosphor-dim': '#2fb84f',
      '--screen-bg': '#001100',
      '--glow-rgb': '77,255,107',
      '--beam-rgb': '200,255,210',
      '--scan-o': '0.95',
      '--beam-o': '1.0',
      '--dot-o': '0.16',
      '--noise-o': '0.07',
      '--ambient-o': '0.12',
    },
    colors: {
      bg: '#001100',
      fg: '#4dff6b',
      bright: '#a8ffc0',
      dim: '#145c26',
      black: '#04150a',
      white: '#c8ffd4',
      brightWhite: '#eafff0',
    },
  },
  {
    label: 'DEEP BLUE',
    css: {
      '--phosphor': '#7fb4ff',
      '--phosphor-dim': '#4a7ac0',
      '--screen-bg': '#000814',
      '--glow-rgb': '127,180,255',
      '--beam-rgb': '210,230,255',
      '--scan-o': '0.85',
      '--beam-o': '0.95',
      '--dot-o': '0.14',
      '--noise-o': '0.04',
      '--ambient-o': '0.08',
    },
    colors: {
      bg: '#000814',
      fg: '#7fb4ff',
      bright: '#bcd8ff',
      dim: '#1d3a66',
      black: '#050d1a',
      white: '#cfe2ff',
      brightWhite: '#ecf4ff',
    },
  },
  {
    label: 'NEON CYAN',
    css: {
      '--phosphor': '#52f7ff',
      '--phosphor-dim': '#2fb3bd',
      '--screen-bg': '#001018',
      '--glow-rgb': '82,247,255',
      '--beam-rgb': '220,255,255',
      '--scan-o': '0.85',
      '--beam-o': '0.95',
      '--dot-o': '0.14',
      '--noise-o': '0.05',
      '--ambient-o': '0.08',
    },
    colors: {
      bg: '#001018',
      fg: '#52f7ff',
      bright: '#aefcff',
      dim: '#14545c',
      black: '#051318',
      white: '#d2fbff',
      brightWhite: '#ecffff',
    },
  },
  {
    label: 'IBM 3278 CLEAN',
    css: {
      '--phosphor': '#3cff7a',
      '--phosphor-dim': '#1c8a44',
      '--screen-bg': '#000000',
      '--glow-rgb': '60,255,122',
      '--beam-rgb': '200,255,215',
      '--scan-o': '0.45',
      '--beam-o': '0',
      '--dot-o': '0',
      '--noise-o': '0',
      '--ambient-o': '0.04',
    },
    colors: {
      bg: '#000000',
      fg: '#3cff7a',
      bright: '#8dffb4',
      dim: '#14532d',
      black: '#061207',
      white: '#c2ffd6',
      brightWhite: '#e6fff0',
    },
  },
];

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

let warpStrength = 0.022; // default 90s convex curvature on

function applyCrtWarp() {
  const warpEl = document.getElementById('warp');
  if (!warpEl) return;
  if (warpStrength <= 0) {
    warpEl.style.filter = 'contrast(var(--crt-contrast)) brightness(var(--crt-brightness))';
    warpEl.style.removeProperty('--overscan');
    return;
  }
  const rect = warpEl.getBoundingClientRect();
  const w = Math.round(rect.width);
  const h = Math.round(rect.height);
  if (w < 40 || h < 40) return;

  const maxDisp = Math.max(4, Math.round(warpStrength * w));
  const k = maxDisp / (0.25 * w);
  const margin = maxDisp + 4;

  const mw = 160;
  const mh = Math.max(24, Math.round((160 * h) / w));
  const c = document.createElement('canvas');
  c.width = mw;
  c.height = mh;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) {
    const v = y / (mh - 1) - 0.5;
    for (let x = 0; x < mw; x++) {
      const u = x / (mw - 1) - 0.5;
      const r2 = u * u + v * v;
      const dx = k * u * r2 * w;
      const dy = k * v * r2 * w;
      const i = (y * mw + x) * 4;
      img.data[i] = Math.round((0.5 + dx / (2 * maxDisp)) * 255);
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
  svg.innerHTML =
    '<filter id="crtWarp" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">' +
    '<feImage href="' + c.toDataURL() + '" result="map" x="' + (-margin) + '" y="' + (-margin) + '" width="' + (w + 2 * margin) + '" height="' + (h + 2 * margin) + '" preserveAspectRatio="none"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + (2 * maxDisp) + '" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter>';
  warpEl.style.filter = 'url(#crtWarp) contrast(var(--crt-contrast)) brightness(var(--crt-brightness))';
  warpEl.style.setProperty('--overscan', '-' + margin + 'px');
}

let warpTimer = null;
function scheduleCrtWarp() {
  clearTimeout(warpTimer);
  warpTimer = setTimeout(applyCrtWarp, 150);
}

function showToast(msg) {
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toastEl.classList.remove('show'), 1400);
}

/* =========================================================
   POST Boot Sequence
   ========================================================= */
async function runBoot(term) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const type = async (s, cps = 260) => {
    for (const ch of s) {
      term.write(ch);
      await sleep(1000 / cps + Math.random() * 5);
    }
    term.write('\r\n');
  };

  term.write('\x1b[2J\x1b[H');
  await type('CRT-1990 PRO  MULTISCAN COLOR DISPLAY SYSTEM', 380);
  await type('(c) 1990-1995 NORTHBRIDGE MICROSYSTEMS · TRINITRON TUBE EMULATION', 560);
  term.write('\r\n');
  await type('SYSTEM ROM BIOS  v4.02 ................. OK', 900);
  await type('PROCESSOR  Z80A / 68000 WORKSTATION .... OK', 900);

  term.write('BASE MEMORY CHECK  ');
  for (let k = 0; k <= 640; k += 64) {
    term.write('\x1b[2K\rBASE MEMORY CHECK  ' + String(k).padStart(4, '0') + 'K');
    await sleep(35);
  }
  term.write('\x1b[2K\rBASE MEMORY CHECK  0640K ............... OK\r\n');
  await sleep(100);

  await type('VIDEO CONTROLLER  1024x768 75Hz NI .... OK', 900);
  await type('SERIAL COMMUNICATION  COM1:9600 8N1 ... OK', 900);
  await type('PHOSPHOR DECAY ENGINE ................ OK', 900);
  term.write('\r\n');
  await type('INITIALIZING HOST PTY INTERFACE ......', 720);
  await sleep(250);
  term.write('\r\n');
}

/* =========================================================
   Terminal Core & Hardware Hookup
   ========================================================= */
function initSystem() {
  const term = new Terminal({
    fontSize: 17,
    fontFamily: "'Menlo', 'Monaco', 'Sarasa Mono SC', 'PingFang SC', 'Noto Sans Mono CJK SC', 'WenQuanYi Micro Hei Mono', monospace",
    lineHeight: 1.24,
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
  const crtEl = document.getElementById('crt');
  const monitorEl = document.getElementById('monitor');
  const powerLed = document.getElementById('power-led');
  const btnPower = document.getElementById('btn-power');
  const btnDegauss = document.getElementById('btn-degauss');
  const btnTheme = document.getElementById('btn-theme');
  const themeName = document.getElementById('theme-name');
  const btnWarp = document.getElementById('btn-warp');
  const warpName = document.getElementById('warp-name');
  const btnChassis = document.getElementById('btn-chassis');
  const chassisName = document.getElementById('chassis-name');
  const btnAudio = document.getElementById('btn-audio');
  const audioName = document.getElementById('audio-name');
  const dialBrightness = document.getElementById('dial-brightness');
  const dialContrast = document.getElementById('dial-contrast');
  const crtPowerFx = document.getElementById('crt-power-fx');

  // --- 1. Display Themes ---
  let themeIndex = 0;
  try {
    themeIndex = parseInt(localStorage.getItem('crt-theme') || '0', 10) || 0;
  } catch (e) {}

  function applyTheme(i, announce) {
    themeIndex = ((i % THEMES.length) + THEMES.length) % THEMES.length;
    const t = THEMES[themeIndex];
    const root = document.documentElement.style;
    Object.entries(t.css).forEach(([k, v]) => root.setProperty(k, v));
    term.options.theme = buildXtermTheme(t.colors);
    if (themeName) themeName.textContent = t.label;
    try { localStorage.setItem('crt-theme', String(themeIndex)); } catch (e) {}
    if (announce) showToast('◈ ' + t.label);
  }
  applyTheme(themeIndex, false);

  btnTheme.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.playSwitch();
    applyTheme(themeIndex + 1, true);
  });

  // --- 2. Chassis Switch (Beige / Dark) ---
  let isBeige = true;
  try {
    isBeige = (localStorage.getItem('crt-chassis') !== 'dark');
  } catch (e) {}

  function setChassis(beige, announce) {
    isBeige = beige;
    if (isBeige) {
      monitorEl.classList.add('chassis-beige');
      monitorEl.classList.remove('chassis-dark');
      chassisName.textContent = '机壳: 米黄';
    } else {
      monitorEl.classList.remove('chassis-beige');
      monitorEl.classList.add('chassis-dark');
      chassisName.textContent = '机壳: 黑灰';
    }
    try { localStorage.setItem('crt-chassis', isBeige ? 'beige' : 'dark'); } catch (e) {}
    if (announce) showToast(isBeige ? '🖥 经典复古米黄机壳 (Vintage Beige)' : '🖥 专业工程黑灰机壳 (Industrial Dark)');
  }
  setChassis(isBeige, false);

  btnChassis.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.playSwitch();
    setChassis(!isBeige, true);
  });

  // --- 3. CRT Curvature (Warp) Switch ---
  function setWarp(enabled, announce) {
    warpStrength = enabled ? 0.022 : 0;
    if (enabled) {
      crtEl.classList.add('curved-tube');
      warpName.textContent = '显像管: 凸面';
    } else {
      crtEl.classList.remove('curved-tube');
      warpName.textContent = '显像管: 纯平';
    }
    applyCrtWarp();
    if (announce) showToast(enabled ? '📺 凸面球形显像管 (Curved Tube)' : '📺 特丽珑纯平显像管 (Flat Trinitron)');
  }
  setWarp(true, false);

  btnWarp.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.playSwitch();
    setWarp(warpStrength === 0, true);
  });

  // --- 4. Audio Switch ---
  btnAudio.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.enabled = !audio.enabled;
    audioName.textContent = audio.enabled ? '🔊 音效: 开' : '🔇 音效: 关';
    showToast(audio.enabled ? '🔊 硬件音效已开启' : '🔇 硬件音效已静音');
    if (audio.enabled) audio.playSwitch();
  });

  // --- 5. Brightness & Contrast Knobs ---
  const brightnessLevels = [0.8, 0.92, 1.0, 1.15, 1.3];
  const brightnessAngles = [-40, -20, 0, 20, 40];
  let bIndex = 2;

  dialBrightness.addEventListener('click', (e) => {
    e.stopPropagation();
    bIndex = (bIndex + 1) % brightnessLevels.length;
    dialBrightness.style.transform = `rotate(${brightnessAngles[bIndex]}deg)`;
    document.documentElement.style.setProperty('--crt-brightness', String(brightnessLevels[bIndex]));
    audio.playKnob();
    showToast(`☀ 屏幕亮度: ${Math.round(brightnessLevels[bIndex] * 100)}%`);
  });

  const contrastLevels = [1.0, 1.15, 1.3, 1.45];
  const glowSpreads = ['1px', '1.5px', '2.2px', '3.0px'];
  const contrastAngles = [-30, 0, 30, 60];
  let cIndex = 1;

  dialContrast.addEventListener('click', (e) => {
    e.stopPropagation();
    cIndex = (cIndex + 1) % contrastLevels.length;
    dialContrast.style.transform = `rotate(${contrastAngles[cIndex]}deg)`;
    document.documentElement.style.setProperty('--crt-contrast', String(contrastLevels[cIndex]));
    document.documentElement.style.setProperty('--crt-glow-spread', glowSpreads[cIndex]);
    audio.playKnob();
    showToast(`⚡ 磷光对比度: ${Math.round(contrastLevels[cIndex] * 100)}%`);
  });

  // --- 6. Degauss Functionality ---
  function triggerDegauss() {
    audio.playDegauss();
    crtEl.classList.remove('degaussing');
    void crtEl.offsetWidth; // reflow
    crtEl.classList.add('degaussing');
    showToast('🧲 消磁线圈已激发 / DEGAUSSING COIL ACTIVE');
    setTimeout(() => {
      crtEl.classList.remove('degaussing');
    }, 1150);
  }

  btnDegauss.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDegauss();
  });

  // --- 7. Power Switch & Realistic Collapse Animation ---
  let isPoweredOn = true;

  btnPower.addEventListener('click', async (e) => {
    e.stopPropagation();
    audio.playSwitch();
    if (isPoweredOn) {
      // Turn OFF
      isPoweredOn = false;
      btnPower.classList.remove('power-on');
      btnPower.classList.add('power-off');
      powerLed.classList.add('off');
      statusEl.textContent = '● POWER OFF';
      statusEl.classList.remove('online-pill');
      crtPowerFx.classList.add('collapsing');
      showToast('POWER STANDBY');
    } else {
      // Turn ON
      isPoweredOn = true;
      btnPower.classList.add('power-on');
      btnPower.classList.remove('power-off');
      powerLed.classList.remove('off');
      statusEl.textContent = '● ONLINE';
      statusEl.classList.add('online-pill');
      crtPowerFx.classList.remove('collapsing');

      crtEl.classList.add('powering-on');
      setTimeout(() => crtEl.classList.remove('powering-on'), 600);

      term.reset();
      await runBoot(term);
    }
  });

  // --- 8. Keyboard Shortcuts ---
  term.attachCustomKeyEventHandler((ev) => {
    if (ev.type === 'keydown') {
      if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyK') {
        applyTheme(themeIndex + 1, true);
        return false;
      }
      if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyB') {
        setChassis(!isBeige, true);
        return false;
      }
      if (ev.ctrlKey && ev.code === 'KeyD' && !ev.shiftKey && !ev.altKey) {
        triggerDegauss();
        return false;
      }
    }
    return true;
  });

  // Global document shortcuts
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyK') {
      applyTheme(themeIndex + 1, true);
    }
    if (ev.ctrlKey && ev.shiftKey && ev.code === 'KeyB') {
      setChassis(!isBeige, true);
    }
    if (ev.code === 'F11') {
      // Native or browser fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  });

  // --- 9. WebSocket & PTY Connection ---
  let ws = null;
  let wsReady = false;
  let everConnected = false;
  let inputBuffer = [];
  let postBuffer = [];
  let booting = true;

  function doFit() {
    try { fit.fit(); } catch (e) {}
  }
  doFit();
  applyCrtWarp();

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
        term.reset();
        term.write('\x1b[32m[ 已重新连接 / RECONNECTED — 新会话已启动 ]\x1b[0m\r\n');
      }
      everConnected = true;
      if (isPoweredOn) {
        statusEl.textContent = '● ONLINE';
        statusEl.classList.add('online-pill');
      }
      baudEl.textContent = term.cols + 'x' + term.rows + ' 9600 BAUD';
      if (inputBuffer.length) {
        ws.send(JSON.stringify({ type: 'input', data: inputBuffer.join('') }));
        inputBuffer = [];
      }
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (ev) => {
      if (!isPoweredOn) return;
      const data = (ev.data instanceof ArrayBuffer) ? new Uint8Array(ev.data) : ev.data;
      if (booting) {
        postBuffer.push(data);
      } else {
        term.write(data);
      }
    };

    ws.onclose = () => {
      wsReady = false;
      if (isPoweredOn) {
        statusEl.textContent = '● OFFLINE';
        statusEl.classList.remove('online-pill');
      }
      postBuffer = [];
      if (!booting && isPoweredOn) {
        term.write('\r\n\x1b[33m*** 连接中断 / CONNECTION LOST — 自动重连中… ***\x1b[0m\r\n');
      }
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      if (isPoweredOn) {
        statusEl.textContent = '● ERROR';
        statusEl.classList.remove('online-pill');
      }
    };
  }

  term.onData((data) => {
    if (!isPoweredOn) return;
    if (wsReady) {
      ws.send(JSON.stringify({ type: 'input', data: data }));
    } else {
      inputBuffer.push(data);
    }
  });

  connect();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ws && ws.readyState !== WebSocket.OPEN) connect();
  });

  // Keyboard focus
  const focusNow = () => {
    if (isPoweredOn) {
      term.focus();
      if (hintEl) hintEl.style.display = 'none';
    }
  };
  if (term.textarea) term.textarea.addEventListener('focus', () => { if (hintEl) hintEl.style.display = 'none'; });
  window.addEventListener('focus', focusNow);
  document.addEventListener('click', focusNow);
  document.addEventListener('keydown', () => { if (hintEl) hintEl.style.display = 'none'; });
  crtEl.addEventListener('click', focusNow);
  term.focus();
  if (hintEl) hintEl.style.display = 'block';

  setTimeout(() => {
    if (!wsReady && isPoweredOn) {
      term.write('\r\n\x1b[33m[ 终端服务器未连接 / SERVER NOT REACHABLE ]\x1b[0m\r\n');
      term.write('\x1b[33m请确认已运行:  npm start  或桌面独立应用:  npm run desktop\x1b[0m\r\n');
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

(async function () {
  const ctx = initSystem();
  await runBoot(ctx.term);
  ctx.finishBoot();
})();

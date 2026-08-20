'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 7681;
const HOST = '127.0.0.1'; // local-only, do not expose to network

const app = express();

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve xterm.js assets straight from node_modules (no CDN dependency)
app.use('/vendor/xterm', express.static(path.join(__dirname, 'node_modules/@xterm/xterm')));
app.use('/vendor/addon-fit', express.static(path.join(__dirname, 'node_modules/@xterm/addon-fit')));

app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/pty' });

// Locate a usable python3 for the PTY bridge
function findPython() {
  const candidates = [
    process.env.PYTHON_BIN,
    '/usr/bin/python3',
    '/usr/local/bin/python3',
  ];
  for (const c of candidates) {
    if (c && require('fs').existsSync(c)) return c;
  }
  return 'python3';
}

// Run the user's real shell, the way Terminal.app does: a login shell so
// ~/.zprofile / ~/.zshrc (or ~/.bash_profile) load and PATH resolves to the
// user's installed commands. pty.fork() provides a proper controlling
// terminal, which is what zsh's ZLE needs — earlier "zsh misbehaves" notes
// date from a no-PTY prototype. Override with SHELL_FOR_TERMINAL.
function findShell() {
  const override = process.env.SHELL_FOR_TERMINAL;
  if (override && require('fs').existsSync(override)) return override;
  const s = process.env.SHELL || '';
  if (s && require('fs').existsSync(s)) return s;
  if (require('fs').existsSync('/bin/bash')) return '/bin/bash';
  return '/bin/sh';
}

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  // Safety: only accept loopback connections
  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    ws.close();
    return;
  }
  // Safety: browser WebSocket connections are not subject to same-origin
  // policy, so any web page you visit could otherwise reach this shell —
  // its connection would also come from 127.0.0.1. Require our own origin.
  // (Non-browser clients send no Origin header and stay allowed.)
  const origin = req.headers.origin;
  const allowed = new Set([
    `http://127.0.0.1:${PORT}`,
    `http://localhost:${PORT}`,
  ]);
  if (origin && !allowed.has(origin)) {
    ws.close(1008, 'forbidden origin');
    return;
  }

  let cols = 80;
  let rows = 24;

  const shell = findShell();
  const env = Object.assign({}, process.env, {
    SHELL: shell,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
    LANG: process.env.LANG || 'en_US.UTF-8',
    LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
    INIT_COLS: String(cols),
    INIT_ROWS: String(rows),
    HOME: process.env.HOME || require('os').homedir(),
  });

  console.log('[crt-terminal] session shell: ' + shell);

  let child;
  try {
    child = spawn(findPython(), [path.join(__dirname, 'pty_bridge.py')], {
      env: env,
      // fd0 stdin(r), fd1 stdout(w), fd2 stderr(w), fd3 resize control(r)
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
    });
  } catch (err) {
    ws.send('\r\n\x1b[31m[terminal] failed to start shell: ' + err.message + '\x1b[0m\r\n');
    ws.close();
    return;
  }

  // spawn() reports a missing binary asynchronously via 'error'; without
  // this listener the exception would crash the whole server process.
  child.on('error', (err) => {
    if (ws.readyState === ws.OPEN) {
      ws.send('\r\n\x1b[31m[terminal] failed to start shell: ' + err.message + '\x1b[0m\r\n');
      ws.close();
    }
  });

  // An aborted client socket surfaces as an 'error' on the ws; swallow it
  // so a dropped connection never takes the server down.
  ws.on('error', () => {});

  const ctrl = child.stdio[3]; // resize control channel (writable from parent)

  child.stdout.on('data', (data) => {
    if (ws.readyState === ws.OPEN) ws.send(data);
  });
  child.stderr.on('data', () => {}); // ignore bridge diagnostics

  child.on('exit', (code) => {
    if (ws.readyState === ws.OPEN) {
      ws.send('\r\n\x1b[90m[connection closed — shell exited with code ' + code + ']\x1b[0m\r\n');
      ws.close();
    }
  });

  ws.on('message', (msg) => {
    let m;
    try {
      m = JSON.parse(msg.toString());
    } catch (e) {
      if (child.stdin) child.stdin.write(msg.toString());
      return;
    }
    if (m.type === 'resize' && m.cols && m.rows) {
      rows = m.rows;
      cols = m.cols;
      try {
        if (ctrl && !ctrl.destroyed) ctrl.write(rows + ' ' + cols + '\n');
      } catch (e) { /* ignore */ }
    } else if (m.type === 'input') {
      if (child.stdin) child.stdin.write(m.data);
    }
  });

  ws.on('close', () => {
    try { if (child.stdin) child.stdin.end(); } catch (e) {}
    try { child.kill(); } catch (e) {}
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[crt-terminal] green-phosphor minicomputer terminal running at http://${HOST}:${PORT}`);
});

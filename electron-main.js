'use strict';

const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 7681;
const URL = `http://127.0.0.1:${PORT}`;

let mainWindow = null;
let serverProcess = null;

// Check if server is already running
function checkServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${URL}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start backend server as a child process if needed
async function ensureServer() {
  const isRunning = await checkServerRunning();
  if (isRunning) {
    console.log(`[desktop] Using existing server at ${URL}`);
    return;
  }

  console.log(`[desktop] Spawning backend server on port ${PORT}...`);
  serverProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('[desktop] Failed to start server process:', err);
  });

  // Wait for server healthcheck
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 150));
    if (await checkServerRunning()) {
      console.log(`[desktop] Backend server ready at ${URL}`);
      return;
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 890,
    minWidth: 880,
    minHeight: 640,
    title: 'CRT-1990 PRO · 90s Minicomputer Terminal',
    backgroundColor: '#0f1012',
    show: false,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  // Build Retro Application Menu
  const template = [
    {
      label: 'CRT-1990',
      submenu: [
        { role: 'about', label: '关于 CRT-1990' },
        { type: 'separator' },
        { role: 'quit', label: '退出 (Quit)' },
      ],
    },
    {
      label: '显示控制 (Display)',
      submenu: [
        {
          label: '🧲 激发消磁线圈 (Degauss)',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.executeJavaScript('document.getElementById("btn-degauss").click()');
          },
        },
        {
          label: '◈ 切换荧光粉显示风格 (Switch Phosphor)',
          accelerator: 'CmdOrCtrl+Shift+K',
          click: () => {
            mainWindow.webContents.executeJavaScript('document.getElementById("btn-theme").click()');
          },
        },
        {
          label: '🖥 切换复古机壳配色 (Switch Bezel: Beige/Dark)',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => {
            mainWindow.webContents.executeJavaScript('document.getElementById("btn-chassis").click()');
          },
        },
        {
          label: '📺 切换显像管曲率 (Toggle Curvature)',
          click: () => {
            mainWindow.webContents.executeJavaScript('document.getElementById("btn-warp").click()');
          },
        },
        {
          label: '⚡ 开关显示器电源 (Toggle Power)',
          click: () => {
            mainWindow.webContents.executeJavaScript('document.getElementById("btn-power").click()');
          },
        },
      ],
    },
    {
      label: '视图 (View)',
      submenu: [
        { role: 'reload', label: '重新载入 (Reload)' },
        { role: 'forceReload', label: '强制刷新' },
        { role: 'toggleDevTools', label: '开发者工具 (DevTools)', accelerator: 'F12' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏模式 (Toggle Fullscreen)', accelerator: 'F11' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.loadURL(URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  await ensureServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function cleanup() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch (e) {}
    serverProcess = null;
  }
}

app.on('before-quit', cleanup);
app.on('window-all-closed', () => {
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

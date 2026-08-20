# CRT-1990 — Green Phosphor Terminal

1990 年代小型机风格的绿磷光终端模拟器,基于 **xterm.js + WebSocket + 真实本地 PTY**(`pty.fork()`),在浏览器/独立窗口中运行你本机的交互式 shell。

## 特性

- 真实本地 PTY:不是模拟输出,而是运行你机器上的真实 shell(`/bin/bash` 等)
- 复古 CRT 视觉:扫描线、点阵 shadow-mask、辉光、暗角、刷新闪烁、玻璃曲率高光
- 开机 POST 自检动画,直接打印进真实终端屏幕(无覆盖层,无 z-index 竞态)
- 实时窗口尺寸同步:`TIOCSWINSZ` 随窗口 reflow(vim / less 同步适配)
- 中文支持:CJK 字体回退 + full-width 单元格,不乱码不塌陷
- 仅监听 `127.0.0.1`,拒绝非回环连接,并校验 WebSocket `Origin`(防止浏览器中的恶意网页跨域连入本地 shell)

## 运行

```bash
npm install          # 安装依赖(express / ws / @xterm/xterm / @xterm/addon-fit)
npm start            # 启动 server(默认 http://127.0.0.1:7681)
```

然后浏览器打开 <http://127.0.0.1:7681>。

需要 Python 3(PTY bridge 依赖)。默认 shell 可用 `SHELL_FOR_TERMINAL` 环境变量覆盖。

### 独立 App 窗口(macOS)

```bash
bash open-app.sh
```

会以无边框 Chrome `--app` 窗口全屏打开终端,关闭窗口即自动停掉后端。

## 文件结构

```
server.js          # Node 后端:express 静态服务 + WebSocket PTY 代理
pty_bridge.py      # Python PTY bridge:pty.fork() + TIOCSWINSZ 缩放控制
public/
  index.html       # 单页前端
  style.css        # CRT 视觉效果
  terminal.js      # xterm.js 接线 + POST 开机动画
build_icon.py      # 生成 AppIcon_1024.png(PIL)
build-app.sh       # 一键重建 .app:重新生成图标并同步 runtime 副本
open-app.sh        # macOS 独立窗口启动脚本
stop.sh            # 按端口停止后端(默认 7681,可用 CRT_PORT 覆盖)
```

## 备注

- `package-lock.json` 未入库,`npm install` 会自动生成。
- `node_modules/`、`CRT-1990.app/`(打包产物)已通过 `.gitignore` 排除。
- 图标二进制(`AppIcon.icns` / `AppIcon_1024.png` / `AppIcon.iconset/`)未入库,运行 `python3 build_icon.py` 可重新生成 1024px 图标。

## 技术细节

- 后端:`server.js` 中 `findShell()` 优先使用 `/bin/bash`,避免 zsh ZLE 在 PTY 桥下的行为问题
- 缩放:浏览器 `ResizeObserver` → WebSocket `{type:'resize'}` → fd3 → `TIOCSWINSZ`
- 安全:仅接受 `127.0.0.1` / `::1` WebSocket 连接,且只允许本服务的 `Origin`(无 `Origin` 的非浏览器客户端不受影响)

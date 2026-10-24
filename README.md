# CRT-1990 — Green Phosphor Terminal

1990 年代小型机风格的绿磷光终端模拟器,基于 **xterm.js + WebSocket + 真实本地 PTY**(`pty.fork()`),在浏览器/独立窗口中运行你本机的交互式 shell。

![CRT-1990](https://img.shields.io/badge/platform-macOS-green) ![style](https://img.shields.io/badge/style-retro-brightgreen)

## 特性

- **真实本地 PTY**:运行你机器上的真实 shell,以**登录 shell** 启动(zsh `-l -i`),`~/.zshrc` / `~/.zprofile` 照常加载,PATH 与 Terminal.app 完全一致
- **6 种显示风格**:GREEN PHOSPHOR / AMBER / APPLE ][ / DEEP BLUE / NEON CYAN / IBM 3278 CLEAN,每种同时切换配色与 CRT 效果参数
- **CRT 视觉效果**(参照 [cool-retro-term](https://github.com/Swordfish90/cool-retro-term) 调校):三角剖面扫描线、环境光溢出、动态静态噪点、有机闪烁、刷新亮线、暗角、玻璃高光
- **可选桶形畸变**:SVG feDisplacementMap 实现的凸面曲率(默认关闭以保证文字锐利,`terminal.js` 中 `WARP_STRENGTH = 0.022` 可开启)
- **开机 POST 自检动画**直接打印进真实终端屏幕
- **实时窗口尺寸同步**:`TIOCSWINSZ` 随窗口 reflow(vim / less 同步适配)
- **睡眠唤醒自愈**:服务端 WebSocket 心跳检测半开连接,重连后自动重置终端(不会乱码),窗口恢复可见即刻重连
- **中文支持**:CJK 字体回退 + full-width 单元格;Menlo 主字体平滑清晰,无外网字体依赖
- **安全**:仅监听 `127.0.0.1`,拒绝非回环连接,并校验 WebSocket `Origin`(防浏览器恶意网页连入)

## 运行

```bash
npm install          # 安装依赖(express / ws / @xterm/xterm / @xterm/addon-fit)
npm start            # 启动 server(默认 http://127.0.0.1:7681)
```

然后浏览器打开 <http://127.0.0.1:7681>。

需要 Python 3(PTY bridge 依赖)。shell 可用 `SHELL_FOR_TERMINAL` 环境变量覆盖,默认跟随系统登录 shell。

## 快捷键与操作

| 操作 | 说明 |
|---|---|
| `Ctrl+Shift+K` | 循环切换显示风格(不传给 shell) |
| 点击屏幕右上角 `◈ STYLE` | 同上 |
| 点击底部面板型号名 | 同上 |

风格选择自动记忆(localStorage),下次打开保持。

## macOS 独立 App

```bash
bash open-app.sh        # 打包并启动独立全屏窗口
bash build-app.sh       # 仅重建:生成图标 + 同步所有已安装副本
bash stop.sh            # 按端口停止后端(默认 7681,可用 CRT_PORT 覆盖)
```

`build-app.sh` 会自动同步**每一个已安装位置**的 `CRT-1990.app`(桌面、`/Applications`),保留各自的浏览器配置与 node_modules。App 完全自包含,拷到其他 Mac(需 Node.js + Python3,推荐 Chrome)双击即用。

## 文件结构

```
server.js          # Node 后端:express 静态服务 + WebSocket PTY 代理 + 心跳
pty_bridge.py      # Python PTY bridge:pty.fork() + TIOCSWINSZ 缩放控制
public/
  index.html       # 单页前端
  style.css        # CRT 视觉效果(CSS 变量驱动,可主题化)
  terminal.js      # xterm.js 接线 + POST 动画 + 主题系统 + 可选畸变
build_icon.py      # 生成 AppIcon_1024.png(PIL)
build-app.sh       # 一键重建 .app 并同步所有已安装副本
open-app.sh        # macOS 独立窗口启动脚本
stop.sh            # 按端口停止后端
```

## 技术细节

- **shell**:跟随系统登录 shell(zsh/bash 以 `-l -i` 启动),行为与 Terminal.app 一致
- **缩放**:浏览器 `ResizeObserver` → WebSocket `{type:'resize'}` → fd3 按行缓冲解析 → `TIOCSWINSZ`
- **断连自愈**:服务端 25s 心跳 ping,两轮无响应即断开;前端自动重连(3s 间隔,窗口重新可见时立即),重连后 `term.reset()` 清理解析器状态
- **安全**:仅接受 `127.0.0.1` / `::1` 连接,且只允许本服务的 `Origin`(无 `Origin` 的非浏览器客户端不受影响)

## 故障排查

- **开机后长时间黑屏无提示符**:多半是 pyenv 陈旧锁,执行 `rm -f ~/.pyenv/shims/.pyenv-shim` 后重开窗口
- **看到"连接中断 — 自动重连中"**:正常现象(如系统睡眠唤醒),无需处理,几秒内自动恢复
- **图标丢失**:运行 `bash build-app.sh` 重新生成

## 备注

- `node_modules/`、`CRT-1990.app/`、图标二进制等构建产物已通过 `.gitignore` 排除;`package-lock.json` 已入库保证依赖版本一致

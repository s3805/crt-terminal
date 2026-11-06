# CRT-1990 PRO — 90s Retro Minicomputer Terminal

1990 年代小型机与工作站风格的真实终端模拟器，采用 **拟真 90 年代 CRT 显示器外观（特丽珑柱面管/球面管 + 散热格栅 + 立体金属铭牌 + 机械电源翘板 + 调光调色旋钮 + 消磁线圈 + 纯物理 Web Audio 继电器音效）**，基于 **Electron 独立桌面原生窗口 + xterm.js + WebSocket + 真实本地 PTY** (`pty.fork()`)，可作为完全独立的桌面软件脱离外部浏览器运行。

![CRT-1990 PRO](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-green) ![style](https://img.shields.io/badge/style-90s%20Photorealistic%20CRT-brightgreen)

## 为什么原项目之前需要 Chrome 浏览器？

1. **依赖 Chrome `--app` 无边框参数**：原项目为了隐藏浏览器的标签栏、网址栏和导航按钮以假装成一个“独立的无边框桌面程序”，在启动脚本中调用了 Google Chrome 的 `--app=http://127.0.0.1:7681` 命令行参数。
2. **重度 CSS/SVG 滤镜与 xterm.js 性能**：显像管的多层扫描线乘法混合 (`mix-blend-mode: multiply`)、动态噪点、SVG 凸面曲率位移滤镜 (`feDisplacementMap`) 等需要极好的硬件加速图形渲染。
3. **快捷键独占**：Chrome 的 app 模式能把大部分控制键直通给终端。
4. **原方案痛点**：若用户未安装 Chrome，就会被强行回退到普通浏览器标签页打开，网址栏和标签页完全破坏了 90 年代老电脑的沉浸感；且需要手动在后台维护 Node 进程。

**全新方案**：现已升级为 **Electron 独立桌面原生应用**，无需安装外部 Chrome，双击或运行 `npm run desktop` 即可拉起全功能的独立桌面终端窗口，后台服务与 PTY 生命周期自动完全接管！

---

## 90 年代拟真 CRT 显示器外观特性

- **经典工业造型机壳（双色可选）**：
  - **经典复古米黄（Vintage Beige）**：90 年代 IBM PS/2、NEC MultiSync、Macintosh 标志性电脑灰白注塑塑料质感，带倒角与高光边缘。
  - **专业工程黑灰（Industrial Dark）**：90 年代末图形工作站 Sony Trinitron 特丽珑高阶冷灰黑。
  - 顶部立体凹陷**散热格栅（Cooling Vents）**与俯仰底座。
  - 顶部拉丝金属高光浮雕铭牌（`TRINITRON MULTISCAN · 17sf`）。
- **极度震撼的 CRT 关机坍缩特效**：
  - 按下机身红色机械 `POWER` 按键，屏幕瞬间高亮坍缩成一条极细水平白线，进而凝聚成中心一个刺眼的白炽光点，伴随高压放电余辉缓慢熄灭，指示灯熄灭；再次开启时中心爆开荧光闪烁！
- **真实消磁线圈体验（DEGAUSS）**：
  - 点击前面板 `🧲 DEGAUSS` 按键（或快捷键 `Ctrl+D` / `Cmd+D`），屏幕伴随剧烈的磁场几何抖动失真与彩虹色斑分离，平息后恢复锐利，并触发 Web Audio 实时合成的 60Hz 变压器消磁轰鸣声（"BWWOOOOONNGG~~~"）。
- **可旋转交互旋钮**：
  - `BRIGHT`（亮度旋钮）：调节显像管黑电平与背景光亮度。
  - `CONTRAST`（对比度旋钮）：调节荧光粉辉光爆发度与高光光晕。
- **特丽珑 RGB 垂直光栅与光学层**：
  - 超精细红绿蓝三原色垂直光栅（Aperture Grille）、三角剖面扫描线、阴极扫描刷新束、动态静态噪点、有机管体微闪烁、弧面玻璃窗户反光与边框投射深层阴影。
- **纯物理 Web Audio 音效**：
  - 继电器强力咔哒声、消磁线圈放电轰鸣、电位器微小档位声，纯代码振荡器合成，0 外部音频文件依赖，随时可一键静音。
- **6 种标志性荧光粉预设**：
  - GREEN P1（经典绿磷光）、AMBER P3（琥珀暖黄）、APPLE ][ GREEN、DEEP BLUE（深邃冷蓝）、NEON CYAN（赛博青）、IBM 3278 CLEAN（纯净黑白/微弱扫描线）。

---

## 运行方式

### 方式 1：独立桌面运行（推荐，脱离任何外部浏览器）

```bash
npm install               # 安装依赖 (已包含 electron / xterm.js / express / ws)
npm run desktop           # 启动独立桌面应用窗口
```
或执行：
```bash
bash open-app.sh          # 自动优先以 Electron 原生桌面窗口运行
```

### 方式 2：纯 Web 服务模式（供局域网/远程终端访问）

```bash
npm start                 # 启动后台服务 (http://127.0.0.1:7681)
```

---

## 快捷键与物理按键

| 操作 | 对应快捷键 | 说明 |
|---|---|---|
| 点击前面板 `🧲 DEGAUSS` | `Ctrl+D` / `Cmd+D` | 激发消磁线圈，抖动画面并消除色斑 |
| 点击前面板 `◈ 荧光粉` | `Ctrl+Shift+K` | 循环切换 6 款经典荧光管配色与参数 |
| 点击前面板 `机壳: 米黄/黑灰` | `Ctrl+Shift+B` | 一键在“经典复古米黄”与“工程黑灰”机身切换 |
| 点击前面板 `显像管: 凸面/纯平` | — | 切换凸面球形显像管与特丽珑纯平显像管 |
| 点击红色 `POWER` 翘板按键 | — | 触发显像管水平坍缩与中心光点熄灭/重启 |
| 点击 `BRIGHT` 旋钮 | — | 调节显像管亮度 (80% ~ 130%) |
| 点击 `CONTRAST` 旋钮 | — | 调节荧光粉对比度与辉光扩散度 |
| 点击 `🔊 音效` | — | 开启/静音继电器与消磁音效 |
| 全屏切换 | `F11` | 沉浸式全屏享受整台 90 年代老式显示器 |

---

## 文件结构

```
electron-main.js   # Electron 桌面应用入口（自动管理后端进程与窗口生命周期）
server.js          # Node 后端：express 静态服务 + WebSocket PTY 代理 + 心跳检测
pty_bridge.py      # Python PTY bridge：pty.fork() + TIOCSWINSZ 缩放控制
public/
  index.html       # 90年代 CRT 显示器完整立体机壳结构、散热孔、铭牌、旋钮、控制板
  style.css        # 拟真材质、米黄/黑灰质感、RGB特丽珑光栅、玻璃反光、坍缩动画
  terminal.js      # Web Audio音效引擎 + 旋钮与按键逻辑 + POST自检 + xterm.js接线
build-app.sh       # 打包并更新 macOS .app 副本
open-app.sh        # 一键启动脚本（优先以原生桌面运行）
stop.sh            # 停止后台服务
```

#!/bin/bash
# 修复本地 Claude Code 的 aicodee / MiniMax 模型配置(幂等,可重复运行)
# 1) ~/.claude/settings.json  补 env.ANTHROPIC_AUTH_TOKEN(否则裸 claude 报 "Not logged in")
# 2) ~/.zshrc                更新过时的 provider 切换注释
set -euo pipefail

SETTINGS="$HOME/.claude/settings.json"
ZSHRC="$HOME/.zshrc"
KEY="sk-cfb4cca88d625db9379a3b75da8bd385"

if [ ! -f "$SETTINGS" ]; then echo "错误: 找不到 $SETTINGS"; exit 1; fi

# ---------- 1) settings.json: 补 ANTHROPIC_AUTH_TOKEN ----------
if python3 -c "import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get('env',{}).get('ANTHROPIC_AUTH_TOKEN')==sys.argv[2] else 1)" "$SETTINGS" "$KEY"; then
  echo "[1/2] $SETTINGS 已包含 ANTHROPIC_AUTH_TOKEN,无需修改"
else
  python3 - "$SETTINGS" "$KEY" <<'PY'
import json, sys
path, key = sys.argv[1], sys.argv[2]
s = open(path).read()
old = '"ANTHROPIC_API_KEY": "%s",' % key
new = '"ANTHROPIC_API_KEY": "%s",\n    "ANTHROPIC_AUTH_TOKEN": "%s",' % (key, key)
if old in s and 'ANTHROPIC_AUTH_TOKEN' not in s:
    open(path, 'w').write(s.replace(old, new, 1))
    print('[1/2] 已写入 env.ANTHROPIC_AUTH_TOKEN →', path)
else:
    print('[1/2] 跳过: %s 已含 AUTH_TOKEN 或未匹配到 API_KEY 行' % path)
PY
fi

# ---------- 2) .zshrc: 更新过时注释 ----------
if [ -f "$ZSHRC" ]; then
  python3 - "$ZSHRC" <<'PY'
import sys
path = sys.argv[1]
s = open(path).read()
old = """# === Claude Code provider 切换 (2026-06-14) ===
# 裸 `claude`     → 智谱 GLM-5.1            (配置: ~/.claude/settings.json)
# `claude-mmm`   → MiniMax M2.5 经 aicodee  (配置: ~/.claude/settings.minimax.json)
#   会话内切到 M2.7:  /model MiniMax-M2.7-highspeed"""
new = """# === Claude Code provider 切换 (2026-06-14, 模型已更新为 aicodee MiniMax) ===
# 裸 `claude`     → MiniMax-M2.7-highspeed 经 aicodee (配置: ~/.claude/settings.json)
# `claude-mmm`   → MiniMax-M2.5-highspeed 经 aicodee (配置: ~/.claude/settings.minimax.json)
#   会话内切换:  /model MiniMax-M2.7-highspeed | /model MiniMax-M2.5-highspeed"""
if old in s:
    open(path, 'w').write(s.replace(old, new, 1))
    print('[2/2] 已更新注释 →', path)
else:
    print('[2/2] 跳过: %s 中未找到目标注释段(可能已更新过)' % path)
PY
else
  echo "[2/2] 跳过: 不存在 $ZSHRC"
fi

echo
echo "完成。验证: claude -p \"hi\" 应能正常回复(裸 claude 走 MiniMax-M2.7-highspeed)。"

#!/bin/bash
# Stop the CRT-1990 backend if it is still running.
# Kill by listening port — precise, unlike a broad `pkill -f "node server.js"`
# which could match unrelated processes that happen to use the same name.
PORT="${CRT_PORT:-7681}"
PID="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null)"
if [ -n "$PID" ]; then
  kill $PID 2>/dev/null
  sleep 0.3
  echo "CRT-1990 后端已停止 (pid $PID, port $PORT)。"
else
  echo "端口 $PORT 上没有正在运行的后端。"
fi

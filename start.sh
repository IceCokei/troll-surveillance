#!/bin/bash
# 启动 iOS 越狱雷达（Next 服务 + 600 秒自动同步）
cd "$(dirname "$0")" || exit 1
mkdir -p logs data
PORT=3210

lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | xargs -r kill 2>/dev/null
sleep 1

[ -d .next ] || npx next build
nohup ./node_modules/.bin/next start -p $PORT >> logs/server.log 2>&1 &
sleep 3

if ! pgrep -f "scripts/watch.ts" > /dev/null; then
  WATCH_MS=${WATCH_MS:-600000} nohup ./node_modules/.bin/tsx scripts/watch.ts >> logs/watch.log 2>&1 &
  echo $! > logs/watch.pid
  echo "watcher started (600s interval), pid $(cat logs/watch.pid)"
else
  echo "watcher already running"
fi

echo "started: http://127.0.0.1:$PORT  (LAN: http://$(ipconfig getifaddr en0 2>/dev/null || echo 127.0.0.1):$PORT)"

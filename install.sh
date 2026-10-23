#!/bin/bash
# 一条命令装完依赖并启动：./install.sh
set -e
cd "$(dirname "$0")"

command -v node >/dev/null 2>&1 || { echo "需要 Node.js 20+：https://nodejs.org"; exit 1; }
echo "==> 安装依赖（首次约 1-2 分钟）"
npm install --no-audit --no-fund

echo "==> 构建"
npm run build

echo "==> 启动（Next 服务 + 600 秒自动同步）"
./start.sh

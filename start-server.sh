#!/bin/bash
set -e
cd "$(dirname "$0")/server"

echo "📦 检查依赖..."
pnpm install --ignore-scripts --registry https://registry.npmmirror.com 2>/dev/null

echo "🚀 启动 FlashMind 同步服务器..."
exec node --experimental-sqlite --experimental-strip-types index.ts

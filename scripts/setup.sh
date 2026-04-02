#!/bin/bash
# xiaoxi-dreams 安装脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🌀 安装 xiaoxi-dreams..."

# 创建必要目录
mkdir -p "$PROJECT_DIR/memory/episodes"
mkdir -p "$PROJECT_DIR/docs"

# 创建 memory 目录（如不存在）
if [ ! -d "$HOME/.openclaw/workspace/memory" ]; then
    echo "创建 memory 目录..."
    mkdir -p "$HOME/.openclaw/workspace/memory"
fi

# 创建 index.json（如不存在）
if [ ! -f "$HOME/.openclaw/workspace/memory/index.json" ]; then
    echo '{"version": "1.0", "lastDream": null, "health": 0}' > "$HOME/.openclaw/workspace/memory/index.json"
fi

echo "✅ 安装完成！"
echo ""
echo "下一步："
echo "1. 重启 Gateway: openclaw gateway restart"
echo "2. 手动触发 Dream: '做个梦'"
echo "3. 或等待每天 04:00 自动运行"

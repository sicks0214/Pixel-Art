#!/bin/bash
# 修复 env.example 文件
# 根据VPS部署指导书要求，使用直接赋值替代模板变量

set -e

cd "$(dirname "$0")/backend"

echo "🔧 修复 env.example 文件..."

# 备份旧文件
if [ -f "env.example" ]; then
    echo "📦 备份旧文件为 env.example.old"
    mv env.example env.example.old
fi

# 使用新文件
if [ -f "env.example.new" ]; then
    echo "✅ 使用新的 env.example.new"
    mv env.example.new env.example
    echo "✅ env.example 已更新"
    echo ""
    echo "📝 下一步："
    echo "   1. 查看新文件: cat backend/env.example"
    echo "   2. 复制为.env: cp backend/env.example backend/.env"
    echo "   3. 修改配置: nano backend/.env"
else
    echo "❌ env.example.new 文件不存在"
    exit 1
fi

echo ""
echo "✨ 修复完成！"


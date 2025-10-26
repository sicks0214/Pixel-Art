#!/bin/bash
# 前端构建脚本 - 使用Docker容器构建，避免环境依赖问题
# 遵循VPS部署指南的分离式构建策略

set -e

echo "🎨 开始构建前端应用..."

cd frontend

# 检查并修复 package.json 构建脚本（移除 TypeScript 编译）
echo "📝 检查 package.json 构建配置..."
if grep -q '"build": "tsc && vite build"' package.json; then
    echo "⚠️  发现 TypeScript 编译，正在移除..."
    sed -i.bak 's/"build": "tsc && vite build"/"build": "vite build"/g' package.json
    echo "✅ 已修改为使用 esbuild 构建"
fi

# 检查 vite.config.ts 是否使用 esbuild minify
echo "📝 检查 Vite 压缩配置..."
if ! grep -q "minify: 'esbuild'" vite.config.ts; then
    echo "⚠️  未指定 minify 配置，构建时将使用 esbuild"
fi

# 生成 package-lock.json（如果不存在）
if [ ! -f "package-lock.json" ]; then
    echo "📦 生成 package-lock.json..."
    docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "npm install --package-lock-only"
fi

# 使用 Docker 容器构建前端
echo "🔨 使用 Docker 容器构建前端（Node.js 22）..."
docker run --rm \
    -v $(pwd):/app \
    -w /app \
    node:22-alpine sh -c "
        echo '📦 安装依赖...'
        npm ci --no-audit --no-fund
        
        echo '🔨 构建前端...'
        npm run build
        
        echo '🔧 修复文件权限...'
        chown -R $(id -u):$(id -g) dist 2>/dev/null || chown -R 1000:1000 dist
    "

# 验证构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ 构建失败：dist/index.html 不存在"
    exit 1
fi

echo "✅ 前端构建完成"
echo "📊 构建产物："
ls -lh dist/ | head -10

# 复制构建产物到后端目录
echo ""
echo "📁 复制构建产物到后端目录..."
rm -rf ../backend/frontend/dist
mkdir -p ../backend/frontend
cp -r dist ../backend/frontend/

echo "✅ 构建产物已复制到 backend/frontend/dist"
echo ""
echo "🎉 前端构建完成！"
echo "📍 构建产物位置："
echo "   - frontend/dist/"
echo "   - backend/frontend/dist/"


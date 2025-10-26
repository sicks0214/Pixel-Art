#!/bin/bash
# Site2 (PIXELARTLAND.CC) VPS部署脚本
# 专门针对 /docker/site2 优化

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Site2 配置
PROJECT_NAME="pixelartland"
SITE_NUMBER="site2"
CONTAINER_NAME="site2"
IMAGE_NAME="site2:latest"
ENV_FILE="backend/.env"
DOMAIN="PIXELARTLAND.CC"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   PIXELARTLAND.CC - Site2 部署脚本     ║${NC}"
echo -e "${CYAN}║   /docker/site2                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1：环境检查
echo -e "${YELLOW}[1/8] 检查部署环境...${NC}"

# 检查当前目录
CURRENT_DIR=$(pwd)
if [[ ! "$CURRENT_DIR" =~ site2$ ]]; then
    echo -e "${YELLOW}⚠️  当前目录: $CURRENT_DIR${NC}"
    echo -e "${YELLOW}⚠️  建议在 /docker/site2 目录执行${NC}"
    read -p "是否继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi
echo "  ✅ Docker: $(docker --version | cut -d' ' -f3)"

# 检查环境变量文件
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 环境变量文件不存在: $ENV_FILE${NC}"
    echo -e "${YELLOW}正在创建默认配置文件...${NC}"
    
    mkdir -p backend
    cat > "$ENV_FILE" << 'ENVEOF'
# Site2 - PIXELARTLAND.CC 配置
NODE_ENV=production
PORT=3001
TZ=America/New_York
ALLOWED_ORIGINS=https://pixelartland.cc,https://www.pixelartland.cc
FRONTEND_URL=https://pixelartland.cc
MAX_FILE_SIZE=10485760
MAX_IMAGE_WIDTH=8000
MAX_IMAGE_HEIGHT=8000
ENABLE_REDIS_CACHE=false
ENVEOF
    
    chmod 600 "$ENV_FILE"
    echo -e "${GREEN}✅ 已创建默认环境变量文件${NC}"
    echo -e "${YELLOW}请检查并修改 $ENV_FILE 后重新运行此脚本${NC}"
    exit 0
fi

# 检查必需的环境变量
echo "  检查必需的环境变量..."
source "$ENV_FILE"
MISSING_VARS=()

[ -z "$ALLOWED_ORIGINS" ] && MISSING_VARS+=("ALLOWED_ORIGINS")
[ -z "$TZ" ] && MISSING_VARS+=("TZ")

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ 缺少必需的环境变量: ${MISSING_VARS[*]}${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 环境检查通过${NC}"

# 步骤2：配置Docker网络
echo -e "\n${YELLOW}[2/8] 配置 Docker 网络...${NC}"
docker network create webproxy 2>/dev/null && echo "  ✅ 创建 webproxy 网络" || echo "  ℹ️  webproxy 网络已存在"
docker network create shared_net 2>/dev/null && echo "  ✅ 创建 shared_net 网络" || echo "  ℹ️  shared_net 网络已存在"
echo -e "${GREEN}✅ 网络配置完成${NC}"

# 步骤3：构建前端
echo -e "\n${YELLOW}[3/8] 构建前端应用...${NC}"

if [ ! -f "build-frontend.sh" ]; then
    echo -e "${RED}❌ build-frontend.sh 不存在${NC}"
    exit 1
fi

chmod +x build-frontend.sh
./build-frontend.sh

if [ ! -d "backend/frontend/dist" ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端构建完成${NC}"

# 步骤4：编译后端 TypeScript
echo -e "\n${YELLOW}[4/8] 编译后端 TypeScript...${NC}"
cd backend

if [ -f "tsconfig.json" ]; then
    echo "  编译 TypeScript 代码..."
    
    # 检查是否有 dist 目录和 package.json
    if [ -f "package.json" ]; then
        # 使用Docker容器编译
        docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "
            echo '  安装TypeScript...'
            npm install --no-save typescript @types/node 2>/dev/null
            echo '  编译代码...'
            npx tsc
        " 2>&1 | grep -v "npm WARN"
    fi
    
    if [ ! -f "dist/index.js" ]; then
        echo -e "${YELLOW}⚠️  TypeScript 编译失败，尝试使用源代码${NC}"
    else
        echo "  ✅ TypeScript 编译成功"
        
        # 验证 ALLOWED_ORIGINS
        if grep -q "ALLOWED_ORIGINS" dist/index.js; then
            echo "  ✅ 已验证 ALLOWED_ORIGINS 支持"
        else
            echo -e "${YELLOW}⚠️  警告：编译后的代码中未找到 ALLOWED_ORIGINS${NC}"
        fi
    fi
else
    echo "  ℹ️  未找到 tsconfig.json，跳过编译"
fi

cd ..
echo -e "${GREEN}✅ 后端准备完成${NC}"

# 步骤5：构建 Docker 镜像
echo -e "\n${YELLOW}[5/8] 构建 Docker 镜像...${NC}"

if [ ! -f "backend/Dockerfile.simple" ]; then
    echo -e "${RED}❌ backend/Dockerfile.simple 不存在${NC}"
    exit 1
fi

echo "  构建镜像: $IMAGE_NAME"
docker build \
    --no-cache \
    -f backend/Dockerfile.simple \
    -t $IMAGE_NAME \
    ./backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Docker 镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker 镜像构建完成${NC}"

# 步骤6：停止并删除旧容器
echo -e "\n${YELLOW}[6/8] 清理旧容器...${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "  停止旧容器..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    echo "  删除旧容器..."
    docker rm $CONTAINER_NAME 2>/dev/null || true
    echo "  ✅ 旧容器已清理"
else
    echo "  ℹ️  未发现旧容器"
fi

# 步骤7：启动新容器
echo -e "\n${YELLOW}[7/8] 启动新容器...${NC}"

docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    --env-file $ENV_FILE \
    $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器启动失败${NC}"
    echo "查看错误日志："
    docker logs $CONTAINER_NAME 2>&1 | tail -20
    exit 1
fi

echo "  ✅ 容器已启动"

# 连接到网络
echo "  连接到 webproxy 网络..."
docker network connect webproxy $CONTAINER_NAME 2>/dev/null || echo "  ℹ️  已在 webproxy 网络中"

echo "  连接到 shared_net 网络..."
docker network connect shared_net $CONTAINER_NAME 2>/dev/null || echo "  ℹ️  已在 shared_net 网络中"

# 等待容器启动
echo "  等待容器完全启动..."
sleep 5

echo -e "${GREEN}✅ 容器启动完成${NC}"

# 步骤8：验证部署
echo -e "\n${YELLOW}[8/8] 验证部署...${NC}"

# 检查容器状态
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 容器未运行${NC}"
    echo "查看日志："
    docker logs $CONTAINER_NAME --tail 30
    exit 1
fi
echo "  ✅ 容器运行正常"

# 获取容器 IP
CONTAINER_IP=$(docker inspect $CONTAINER_NAME 2>/dev/null | grep '"IPAddress"' | head -1 | cut -d'"' -f4 | grep -v '^$' | head -1)
if [ -z "$CONTAINER_IP" ]; then
    # 如果获取不到IPv4，尝试获取其他网络的IP
    CONTAINER_IP=$(docker inspect $CONTAINER_NAME 2>/dev/null | grep -A 1 "webproxy" | grep "IPAddress" | cut -d'"' -f4 | head -1)
fi

if [ -n "$CONTAINER_IP" ]; then
    echo "  ✅ 容器 IP: $CONTAINER_IP"
else
    echo "  ⚠️  无法获取容器IP（可能使用了自定义网络）"
fi

# 健康检查
echo "  执行健康检查..."
sleep 3

# 尝试容器内部健康检查
HEALTH_CHECK=$(docker exec $CONTAINER_NAME curl -sf http://localhost:3001/api/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}  ✅ 健康检查通过${NC}"
else
    echo -e "${YELLOW}  ⚠️  健康检查失败，查看日志：${NC}"
    docker logs $CONTAINER_NAME --tail 20
fi

# 检查CORS配置
echo "  验证CORS配置..."
CORS_CHECK=$(docker logs $CONTAINER_NAME 2>&1 | grep "允许的CORS源" | tail -1)
if [ -n "$CORS_CHECK" ]; then
    echo "  ✅ $CORS_CHECK"
else
    echo -e "${YELLOW}  ⚠️  未找到CORS配置日志${NC}"
fi

# 检查静态文件
echo "  检查静态文件..."
if docker exec $CONTAINER_NAME ls /app/frontend/dist/index.html >/dev/null 2>&1; then
    echo "  ✅ 前端静态文件已集成"
else
    echo -e "${YELLOW}  ⚠️  前端静态文件不存在${NC}"
fi

# 显示部署信息
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Site2 部署成功！                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📋 部署信息：${NC}"
echo "  • 站点: $SITE_NUMBER"
echo "  • 域名: $DOMAIN"
echo "  • 容器名称: $CONTAINER_NAME"
echo "  • 容器IP: ${CONTAINER_IP:-无法获取}"
echo "  • 路径: /docker/site2"
echo ""
echo -e "${CYAN}🔍 验证命令：${NC}"
if [ -n "$CONTAINER_IP" ]; then
    echo "  • 健康检查: curl http://$CONTAINER_IP:3001/api/health"
fi
echo "  • 健康检查: docker exec $CONTAINER_NAME curl http://localhost:3001/api/health"
echo "  • 查看日志: docker logs $CONTAINER_NAME -f"
echo "  • 查看状态: docker ps | grep $CONTAINER_NAME"
echo ""
echo -e "${CYAN}📝 Nginx Proxy Manager 配置：${NC}"
echo "  1. 访问: http://your-vps-ip:81"
echo "  2. 添加 Proxy Host:"
echo "     • Domain Names: pixelartland.cc, www.pixelartland.cc"
echo "     • Scheme: http"
echo "     • Forward Hostname: $CONTAINER_NAME"
echo "     • Forward Port: 3001"
echo "  3. SSL标签页:"
echo "     • Request a new SSL Certificate"
echo "     • Force SSL: 启用"
echo "     • Email: your-email@example.com"
echo ""
echo -e "${CYAN}🌐 CORS 配置的域名：${NC}"
echo "  • $ALLOWED_ORIGINS"
echo ""
echo -e "${CYAN}🔧 常用命令：${NC}"
echo "  • 重启容器: docker restart $CONTAINER_NAME"
echo "  • 停止容器: docker stop $CONTAINER_NAME"
echo "  • 删除容器: docker rm -f $CONTAINER_NAME"
echo "  • 进入容器: docker exec -it $CONTAINER_NAME sh"
echo "  • 完整诊断: ./diagnose-site2.sh"
echo ""
echo -e "${GREEN}✨ 下一步：配置Nginx Proxy Manager并申请SSL证书${NC}"
echo ""


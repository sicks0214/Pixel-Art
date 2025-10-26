#!/bin/bash
# VPS一键部署脚本
# 遵循部署指南的分离式构建和单体容器部署策略

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="site2"
CONTAINER_NAME="site2"
IMAGE_NAME="site2:latest"
ENV_FILE="backend/.env"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   像素画转换器 VPS 部署脚本           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 步骤1：环境检查
echo -e "${YELLOW}[1/7] 检查部署环境...${NC}"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

# 检查环境变量文件
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 环境变量文件不存在: $ENV_FILE${NC}"
    echo -e "${YELLOW}请先创建 $ENV_FILE 文件，参考 .env.vps.example${NC}"
    exit 1
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

# 步骤2：创建外部网络
echo -e "\n${YELLOW}[2/7] 配置 Docker 网络...${NC}"
docker network create webproxy 2>/dev/null && echo "  ✅ 创建 webproxy 网络" || echo "  ℹ️  webproxy 网络已存在"
docker network create shared_net 2>/dev/null && echo "  ✅ 创建 shared_net 网络" || echo "  ℹ️  shared_net 网络已存在"
echo -e "${GREEN}✅ 网络配置完成${NC}"

# 步骤3：构建前端
echo -e "\n${YELLOW}[3/7] 构建前端应用...${NC}"
chmod +x build-frontend.sh
./build-frontend.sh

if [ ! -d "backend/frontend/dist" ]; then
    echo -e "${RED}❌ 前端构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端构建完成${NC}"

# 步骤4：编译后端 TypeScript
echo -e "\n${YELLOW}[4/7] 编译后端 TypeScript...${NC}"
cd backend
if [ -f "tsconfig.json" ]; then
    echo "  编译 TypeScript 代码..."
    docker run --rm -v $(pwd):/app -w /app node:22-alpine sh -c "
        npm install --no-save typescript @types/node
        npx tsc
    "
    
    if [ ! -f "dist/index.js" ]; then
        echo -e "${RED}❌ TypeScript 编译失败${NC}"
        exit 1
    fi
    
    # 验证 ALLOWED_ORIGINS 是否在编译后的代码中
    if grep -q "ALLOWED_ORIGINS" dist/index.js; then
        echo "  ✅ 已验证 ALLOWED_ORIGINS 支持"
    else
        echo -e "${YELLOW}⚠️  警告：编译后的代码中未找到 ALLOWED_ORIGINS${NC}"
    fi
else
    echo "  ℹ️  未找到 tsconfig.json，跳过编译"
fi
cd ..
echo -e "${GREEN}✅ 后端编译完成${NC}"

# 步骤5：构建 Docker 镜像
echo -e "\n${YELLOW}[5/7] 构建 Docker 镜像...${NC}"
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
echo -e "\n${YELLOW}[6/7] 清理旧容器...${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "  停止旧容器..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    echo "  删除旧容器..."
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi
echo -e "${GREEN}✅ 旧容器已清理${NC}"

# 步骤7：启动新容器
echo -e "\n${YELLOW}[7/7] 启动新容器...${NC}"

docker run -d \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    --env-file $ENV_FILE \
    $IMAGE_NAME

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi

# 连接到网络
echo "  连接到 webproxy 网络..."
docker network connect webproxy $CONTAINER_NAME 2>/dev/null || echo "  ℹ️  已在 webproxy 网络中"

echo "  连接到 shared_net 网络..."
docker network connect shared_net $CONTAINER_NAME 2>/dev/null || echo "  ℹ️  已在 shared_net 网络中"

# 等待容器启动
echo "  等待容器启动..."
sleep 5

# 步骤8：验证部署
echo -e "\n${YELLOW}验证部署...${NC}"

# 检查容器状态
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 容器未运行${NC}"
    echo "查看日志："
    docker logs $CONTAINER_NAME --tail 20
    exit 1
fi

# 获取容器 IP
CONTAINER_IP=$(docker inspect $CONTAINER_NAME | grep '"IPAddress"' | head -1 | cut -d'"' -f4 | grep -v '^$' | head -1)
echo "  容器 IP: $CONTAINER_IP"

# 健康检查
echo "  执行健康检查..."
sleep 3
HEALTH_CHECK=$(docker exec $CONTAINER_NAME curl -sf http://localhost:3001/api/health 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 健康检查通过${NC}"
else
    echo -e "${YELLOW}⚠️  健康检查失败，查看日志：${NC}"
    docker logs $CONTAINER_NAME --tail 20
fi

# 显示部署信息
echo -e "\n${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        部署成功！                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 部署信息：${NC}"
echo "  • 容器名称: $CONTAINER_NAME"
echo "  • 容器IP: $CONTAINER_IP"
echo "  • 健康检查: http://$CONTAINER_IP:3001/api/health"
echo ""
echo -e "${BLUE}📝 Nginx Proxy Manager 配置：${NC}"
echo "  • Scheme: http"
echo "  • Forward Hostname/IP: $CONTAINER_NAME 或 $CONTAINER_IP"
echo "  • Forward Port: 3001"
echo "  • 启用 WebSocket 支持"
echo ""
echo -e "${BLUE}🔍 常用命令：${NC}"
echo "  • 查看日志: docker logs $CONTAINER_NAME -f"
echo "  • 查看状态: docker ps | grep $CONTAINER_NAME"
echo "  • 进入容器: docker exec -it $CONTAINER_NAME sh"
echo "  • 重启容器: docker restart $CONTAINER_NAME"
echo "  • 停止容器: docker stop $CONTAINER_NAME"
echo ""
echo -e "${BLUE}🌐 CORS 配置的域名：${NC}"
echo "  $ALLOWED_ORIGINS"
echo ""


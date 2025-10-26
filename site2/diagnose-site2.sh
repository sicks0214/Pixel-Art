#!/bin/bash
# Site2 (PIXELARTLAND.CC) 诊断脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONTAINER_NAME="site2"
DOMAIN="pixelartland.cc"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  PIXELARTLAND.CC (Site2) - 诊断报告           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 1. 容器状态
echo -e "${YELLOW}1. 容器状态${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    STATUS=$(docker ps --format "{{.Status}}" --filter "name=$CONTAINER_NAME")
    echo -e "  ${GREEN}✅ 容器运行中${NC}"
    echo -e "  状态: $STATUS"
else
    echo -e "  ${RED}❌ 容器未运行${NC}"
    if docker ps -a | grep -q "$CONTAINER_NAME"; then
        echo "  容器存在但未运行，查看状态："
        docker ps -a | grep "$CONTAINER_NAME"
    else
        echo "  容器不存在"
    fi
fi
echo ""

# 2. 容器IP
echo -e "${YELLOW}2. 容器IP地址${NC}"
CONTAINER_IP=$(docker inspect $CONTAINER_NAME 2>/dev/null | grep '"IPAddress"' | head -1 | cut -d'"' -f4 | grep -v '^$' | head -1)
if [ -n "$CONTAINER_IP" ]; then
    echo -e "  ${GREEN}✅ IP地址: $CONTAINER_IP${NC}"
else
    # 尝试从webproxy网络获取
    CONTAINER_IP=$(docker inspect $CONTAINER_NAME 2>/dev/null | grep -A 1 "webproxy" | grep "IPAddress" | cut -d'"' -f4 | head -1)
    if [ -n "$CONTAINER_IP" ]; then
        echo -e "  ${GREEN}✅ IP地址 (webproxy): $CONTAINER_IP${NC}"
    else
        echo -e "  ${YELLOW}⚠️  无法获取IP地址${NC}"
    fi
fi
echo ""

# 3. 健康检查
echo -e "${YELLOW}3. 健康检查${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    # 容器内部检查
    if docker exec $CONTAINER_NAME curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
        HEALTH_DATA=$(docker exec $CONTAINER_NAME curl -s http://localhost:3001/api/health 2>/dev/null)
        echo -e "  ${GREEN}✅ 健康检查通过${NC}"
        echo "  响应: $HEALTH_DATA"
    else
        echo -e "  ${RED}❌ 健康检查失败${NC}"
    fi
else
    echo -e "  ${RED}❌ 容器未运行，无法检查${NC}"
fi
echo ""

# 4. CORS配置
echo -e "${YELLOW}4. CORS配置${NC}"
CORS_CONFIG=$(docker logs $CONTAINER_NAME 2>&1 | grep "允许的CORS源" | tail -1)
if [ -n "$CORS_CONFIG" ]; then
    echo -e "  ${GREEN}✅ CORS配置:${NC}"
    echo "  $CORS_CONFIG"
    
    # 验证是否包含域名
    if echo "$CORS_CONFIG" | grep -q "pixelartland.cc"; then
        echo -e "  ${GREEN}✅ 已包含 pixelartland.cc${NC}"
    else
        echo -e "  ${YELLOW}⚠️  未找到 pixelartland.cc${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  未找到CORS配置日志${NC}"
fi
echo ""

# 5. 静态文件
echo -e "${YELLOW}5. 静态文件检查${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    if docker exec $CONTAINER_NAME ls /app/frontend/dist/index.html >/dev/null 2>&1; then
        FILE_COUNT=$(docker exec $CONTAINER_NAME find /app/frontend/dist -type f 2>/dev/null | wc -l)
        echo -e "  ${GREEN}✅ 前端文件存在${NC}"
        echo "  文件数量: $FILE_COUNT"
    else
        echo -e "  ${RED}❌ 前端文件不存在${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  容器未运行，无法检查${NC}"
fi
echo ""

# 6. 网络连接
echo -e "${YELLOW}6. Docker网络连接${NC}"
if docker network inspect webproxy 2>/dev/null | grep -q "$CONTAINER_NAME"; then
    echo -e "  ${GREEN}✅ 已连接 webproxy 网络${NC}"
else
    echo -e "  ${RED}❌ 未连接 webproxy 网络${NC}"
fi

if docker network inspect shared_net 2>/dev/null | grep -q "$CONTAINER_NAME"; then
    echo -e "  ${GREEN}✅ 已连接 shared_net 网络（可选）${NC}"
else
    echo -e "  ${YELLOW}⚠️  未连接 shared_net 网络（可选）${NC}"
fi
echo ""

# 7. 环境变量
echo -e "${YELLOW}7. 关键环境变量${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    NODE_ENV=$(docker exec $CONTAINER_NAME env 2>/dev/null | grep NODE_ENV | cut -d= -f2)
    PORT=$(docker exec $CONTAINER_NAME env 2>/dev/null | grep "^PORT=" | cut -d= -f2)
    TZ=$(docker exec $CONTAINER_NAME env 2>/dev/null | grep "^TZ=" | cut -d= -f2)
    ALLOWED=$(docker exec $CONTAINER_NAME env 2>/dev/null | grep ALLOWED_ORIGINS | cut -d= -f2)
    
    echo "  NODE_ENV: ${NODE_ENV:-未设置}"
    echo "  PORT: ${PORT:-未设置}"
    echo "  TZ: ${TZ:-未设置}"
    echo "  ALLOWED_ORIGINS: ${ALLOWED:-未设置}"
else
    echo -e "  ${YELLOW}⚠️  容器未运行，无法检查${NC}"
fi
echo ""

# 8. 最近日志
echo -e "${YELLOW}8. 最近日志（最后10行）${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    docker logs $CONTAINER_NAME --tail 10 2>&1
else
    echo -e "  ${YELLOW}⚠️  容器不存在${NC}"
fi
echo ""

# 9. 最近错误
echo -e "${YELLOW}9. 最近错误（最后3条）${NC}"
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    ERROR_LOGS=$(docker logs $CONTAINER_NAME 2>&1 | grep -i error | tail -3)
    if [ -n "$ERROR_LOGS" ]; then
        echo "$ERROR_LOGS"
    else
        echo -e "  ${GREEN}✅ 未发现错误日志${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  容器不存在${NC}"
fi
echo ""

# 10. 资源使用
echo -e "${YELLOW}10. 资源使用${NC}"
if docker ps | grep -q "$CONTAINER_NAME"; then
    docker stats $CONTAINER_NAME --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
else
    echo -e "  ${YELLOW}⚠️  容器未运行，无法检查${NC}"
fi
echo ""

# 11. 域名DNS解析
echo -e "${YELLOW}11. DNS解析检查${NC}"
if command -v nslookup >/dev/null 2>&1; then
    echo "  检查 $DOMAIN:"
    nslookup $DOMAIN 2>/dev/null | grep -A 1 "Name:" || echo -e "  ${YELLOW}⚠️  DNS解析失败${NC}"
    
    echo ""
    echo "  检查 www.$DOMAIN:"
    nslookup www.$DOMAIN 2>/dev/null | grep -A 1 "Name:" || echo -e "  ${YELLOW}⚠️  DNS解析失败${NC}"
else
    echo -e "  ${YELLOW}⚠️  nslookup 命令不可用${NC}"
fi
echo ""

# 12. SSL证书检查（如果域名可访问）
echo -e "${YELLOW}12. SSL证书检查${NC}"
if command -v openssl >/dev/null 2>&1; then
    echo "  检查 https://$DOMAIN 证书..."
    CERT_INFO=$(echo | timeout 5 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    if [ -n "$CERT_INFO" ]; then
        echo -e "  ${GREEN}✅ SSL证书有效${NC}"
        echo "$CERT_INFO" | sed 's/^/  /'
    else
        echo -e "  ${YELLOW}⚠️  无法获取SSL证书信息（域名可能未配置或证书未申请）${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠️  openssl 命令不可用${NC}"
fi
echo ""

# 总结
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  诊断总结                                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# 检查关键项
CRITICAL_ISSUES=0
WARNINGS=0

if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 严重: 容器未运行${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if docker ps | grep -q "$CONTAINER_NAME"; then
    if ! docker exec $CONTAINER_NAME curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
        echo -e "${RED}❌ 严重: 健康检查失败${NC}"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
    
    if ! docker exec $CONTAINER_NAME ls /app/frontend/dist/index.html >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  警告: 前端文件不存在${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

if ! docker network inspect webproxy 2>/dev/null | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}❌ 严重: 未连接 webproxy 网络${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
fi

if [ $CRITICAL_ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ 所有检查通过！系统运行正常。${NC}"
elif [ $CRITICAL_ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $WARNINGS 个警告，但系统可以运行。${NC}"
else
    echo -e "${RED}❌ 发现 $CRITICAL_ISSUES 个严重问题，需要修复！${NC}"
fi

echo ""
echo -e "${BLUE}建议操作：${NC}"
if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo "  1. 检查容器日志: docker logs $CONTAINER_NAME --tail 50"
    echo "  2. 检查环境变量: cat backend/.env"
    echo "  3. 重新部署: ./deploy-site2.sh"
fi
if [ $WARNINGS -gt 0 ]; then
    echo "  • 运行前端构建: ./build-frontend.sh"
    echo "  • 重启容器: docker restart $CONTAINER_NAME"
fi
echo ""


#!/bin/bash
# 🚀 Pixel Art Converter - VPS快速部署命令
# 域名: pixelartland.cc, www.pixelartland.cc
# 站点: site2

# ==========================================
# ⚠️ 使用说明
# ==========================================
# 1. 不要直接执行此文件
# 2. 根据你的部署阶段，复制对应的命令块
# 3. 逐行执行并验证结果
# ==========================================

# ==========================================
# 阶段1：VPS初始环境准备
# ==========================================

# 创建目录
mkdir -p /docker/site2
cd /docker/site2

# 创建网络（如果不存在）
docker network create webproxy 2>/dev/null || echo "webproxy网络已存在"
docker network create shared_net 2>/dev/null || echo "shared_net网络已存在"

# ==========================================
# 阶段2：上传代码（选择一种方式）
# ==========================================

# 方式A：Git克隆
# git clone YOUR_REPO_URL temp
# mv temp/site2/* ./
# mv temp/site2/.* ./ 2>/dev/null || true
# rm -rf temp

# 方式B：rsync（在本地执行）
# rsync -avz --exclude 'node_modules' --exclude 'dist' \
#   ~/Documents/GitHub/Pixel-Art/site2/ \
#   root@YOUR_VPS_IP:/docker/site2/

# ==========================================
# 阶段3：配置环境变量
# ==========================================

# 创建.env文件
cp env.vps.example backend/.env

# 编辑.env（使用nano或vim）
nano backend/.env

# 必须配置的内容：
# NODE_ENV=production
# PORT=3001
# ALLOWED_ORIGINS=https://pixelartland.cc,https://www.pixelartland.cc
# TZ=America/New_York
# ENABLE_DATABASE=false
# ENABLE_REDIS_CACHE=false

# 验证配置
cat backend/.env | grep ALLOWED_ORIGINS

# ==========================================
# 阶段4：执行部署
# ==========================================

# 赋予执行权限
chmod +x build-frontend.sh deploy.sh

# 一键部署
./deploy.sh

# 预期输出：
# [1/7] 检查部署环境... ✅
# [2/7] 配置 Docker 网络... ✅
# [3/7] 构建前端应用... ✅
# [4/7] 编译后端 TypeScript... ✅
# [5/7] 构建 Docker 镜像... ✅
# [6/7] 清理旧容器... ✅
# [7/7] 启动新容器... ✅
# 
# ╔════════════════════════════════════════╗
# ║        部署成功！                      ║
# ╚════════════════════════════════════════╝

# ==========================================
# 阶段5：验证部署
# ==========================================

# 检查容器状态
docker ps | grep site2

# 查看日志
docker logs site2 --tail 30

# 健康检查
docker exec site2 curl -s http://localhost:3001/api/health

# 验证CORS配置
docker logs site2 | grep "允许的CORS源"

# 获取容器IP
docker inspect site2 | grep '"IPAddress"' | head -1

# 测试容器内部访问
CONTAINER_IP=$(docker inspect site2 | grep '"IPAddress"' | head -1 | cut -d'"' -f4 | grep -v '^$' | head -1)
curl http://$CONTAINER_IP:3001/api/health

# 验证网络连接
docker network inspect webproxy | grep site2
docker network inspect shared_net | grep site2

# ==========================================
# 阶段6：Nginx Proxy Manager配置
# ==========================================

# 登录NPM: http://YOUR_VPS_IP:81

# 配置主域名 (pixelartland.cc):
# - Domain Names: pixelartland.cc
# - Scheme: http
# - Forward Hostname/IP: site2（或使用上面获取的容器IP）
# - Forward Port: 3001
# - Block Common Exploits: ✅
# - Websockets Support: ✅
# - SSL: 申请Let's Encrypt证书，Force SSL: ✅

# 配置www域名 (www.pixelartland.cc):
# - 配置同上，域名改为 www.pixelartland.cc
# - SSL也需要单独申请

# ⚠️ 重要：申请SSL证书前，Cloudflare必须设置为灰云☁️
# ✅ 证书申请成功后，再切换为橙云🟠

# ==========================================
# 阶段7：外部访问测试
# ==========================================

# 测试HTTP（应该301重定向到HTTPS）
curl -I http://pixelartland.cc
curl -I http://www.pixelartland.cc

# 测试HTTPS（应该200 OK）
curl -I https://pixelartland.cc
curl -I https://www.pixelartland.cc

# ==========================================
# 常用运维命令
# ==========================================

# 查看日志（实时）
# docker logs site2 -f

# 重启容器
# docker restart site2

# 停止容器
# docker stop site2

# 删除容器
# docker rm site2

# 进入容器
# docker exec -it site2 sh

# 查看容器资源使用
# docker stats site2

# 查看网络详情
# docker inspect site2 | grep -A 20 "Networks"

# ==========================================
# 更新部署（代码更新后）
# ==========================================

# 备份.env
# cp backend/.env backend/.env.backup

# 拉取最新代码
# git stash
# git pull origin main
# git stash pop

# 恢复.env
# cp backend/.env.backup backend/.env

# 重新部署
# ./deploy.sh

# ==========================================
# 故障排除
# ==========================================

# 问题1：CORS错误
# docker logs site2 | grep "CORS阻止"
# nano backend/.env  # 修改ALLOWED_ORIGINS
# docker restart site2

# 问题2：健康检查失败
# docker logs site2 --tail 50
# docker exec site2 curl -v http://localhost:3001/api/health

# 问题3：容器启动失败
# docker logs site2 --tail 100
# ls -la backend/.env  # 检查环境变量文件

# 问题4：502 Bad Gateway
# docker ps | grep site2  # 确认容器运行
# docker inspect site2 | grep IPAddress  # 获取IP
# 使用容器IP配置NPM而非容器名

# ==========================================
# 清理命令（谨慎使用）
# ==========================================

# 停止并删除容器（不影响镜像和代码）
# docker stop site2 && docker rm site2

# 删除镜像（需要重新构建）
# docker rmi site2:latest

# 清理未使用的镜像（谨慎）
# docker image prune -a

# ==========================================
# 完成！
# ==========================================

echo "📚 更多信息请查看："
echo "  - VPS部署指南_pixelartland.cc.md"
echo "  - 部署前检查清单.md"
echo "  - docs/VPS部署问题处理指南 1001.md"


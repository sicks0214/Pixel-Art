# 🎨 Pixel Art Converter - VPS部署指南

> **域名**: pixelartland.cc, www.pixelartland.cc  
> **站点编号**: Site2  
> **部署路径**: /docker/site2  
> **最后更新**: 2025-10-26

---

## 📋 部署前检查清单

### ✅ 已验证符合要求

- [x] **ALLOWED_ORIGINS支持** - 后端已实现多域名CORS配置
- [x] **分离式构建** - build-frontend.sh使用Docker容器构建
- [x] **单阶段Dockerfile** - Dockerfile.simple符合指南
- [x] **健康检查** - /api/health端点已实现
- [x] **时区配置** - 美东时区 (America/New_York)
- [x] **TypeScript支持** - 使用npx tsx运行
- [x] **一键部署脚本** - deploy.sh已配置为site2

### 📁 项目结构

```
site2/
├── frontend/                 # React前端源码
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Node.js后端源码
│   ├── src/
│   │   └── index.ts         # ✅ 已实现ALLOWED_ORIGINS
│   ├── package.json
│   ├── Dockerfile.simple    # ✅ 单阶段构建
│   └── .env                 # ⚠️ 需要创建（参考env.vps.example）
├── build-frontend.sh        # ✅ 前端构建脚本
├── deploy.sh                # ✅ VPS部署脚本（已配置为site2）
└── env.vps.example          # ✅ VPS环境变量模板
```

---

## 🚀 完整部署流程

### 步骤1：VPS环境准备

```bash
# 1.1 SSH登录VPS
ssh root@YOUR_VPS_IP

# 1.2 进入Docker目录
cd /docker

# 1.3 创建站点目录
mkdir -p site2
cd site2
```

### 步骤2：上传代码到VPS

**方式A：Git克隆（推荐）**
```bash
# 在VPS上执行
cd /docker
git clone YOUR_REPO_URL temp
mv temp/site2/* ./site2/
mv temp/site2/.* ./site2/ 2>/dev/null || true
rm -rf temp

# 或者如果仓库根目录就是site2
git clone YOUR_REPO_URL site2
cd site2
```

**方式B：本地推送到VPS**
```bash
# 在本地执行
cd ~/Documents/GitHub/Pixel-Art/site2
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  ./ root@YOUR_VPS_IP:/docker/site2/
```

### 步骤3：配置环境变量

```bash
# 在VPS上执行
cd /docker/site2

# 创建.env文件
cp env.vps.example backend/.env

# 编辑.env文件
nano backend/.env
```

**必须配置的环境变量：**
```bash
NODE_ENV=production
PORT=3001
ALLOWED_ORIGINS=https://pixelartland.cc,https://www.pixelartland.cc
TZ=America/New_York
ENABLE_DATABASE=false
ENABLE_REDIS_CACHE=false
```

**保存并验证：**
```bash
# 按Ctrl+O保存，Ctrl+X退出
# 验证配置
cat backend/.env | grep ALLOWED_ORIGINS
```

### 步骤4：执行部署

```bash
# 在VPS /docker/site2 目录下执行
chmod +x build-frontend.sh deploy.sh
./deploy.sh
```

**部署脚本会自动：**
1. ✅ 检查Docker和环境变量
2. ✅ 创建webproxy和shared_net网络
3. ✅ 使用Docker容器构建前端
4. ✅ 编译TypeScript后端代码
5. ✅ 构建Docker镜像
6. ✅ 清理旧容器
7. ✅ 启动新容器并连接网络
8. ✅ 执行健康检查

**预期输出：**
```
╔════════════════════════════════════════╗
║        部署成功！                      ║
╚════════════════════════════════════════╝

📋 部署信息：
  • 容器名称: site2
  • 容器IP: 172.18.0.X
  • 健康检查: http://172.18.0.X:3001/api/health

📝 Nginx Proxy Manager 配置：
  • Scheme: http
  • Forward Hostname/IP: site2 或 172.18.0.X
  • Forward Port: 3001
  • 启用 WebSocket 支持

🌐 CORS 配置的域名：
  https://pixelartland.cc,https://www.pixelartland.cc
```

### 步骤5：配置Nginx Proxy Manager

**5.1 添加代理主机**

登录 Nginx Proxy Manager: `http://YOUR_VPS_IP:81`

**创建第一个代理（主域名）：**
- **Domain Names**: `pixelartland.cc`
- **Scheme**: `http`
- **Forward Hostname/IP**: `site2` 或容器IP
- **Forward Port**: `3001`
- **Block Common Exploits**: ✅ 启用
- **Websockets Support**: ✅ 启用

**SSL配置：**
1. **先设置Cloudflare为灰云☁️** （关闭CDN代理）
2. 在NPM的SSL标签：
   - Request a new SSL Certificate
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - Email: 你的邮箱
   - ✅ I Agree to Let's Encrypt TOS
3. 等待证书申请成功
4. **再切换Cloudflare为橙云🟠** （启用CDN代理）

**创建第二个代理（www子域名）：**
- **Domain Names**: `www.pixelartland.cc`
- 其他配置与主域名相同
- SSL也需要单独申请

### 步骤6：验证部署

```bash
# 在VPS上验证
docker logs site2 --tail 30
docker exec site2 curl -s http://localhost:3001/api/health

# 验证CORS配置
docker logs site2 | grep "允许的CORS源"
# 应该看到：
# 📍 VPS ALLOWED_ORIGINS: [ 'https://pixelartland.cc', 'https://www.pixelartland.cc' ]

# 验证网络连接
docker network inspect webproxy | grep site2
docker network inspect shared_net | grep site2

# 外部访问测试
curl -I https://pixelartland.cc
curl -I https://www.pixelartland.cc
```

**预期结果：**
- ✅ 健康检查返回200 OK
- ✅ CORS日志显示两个域名
- ✅ 两个域名都返回HTTP/1.1 200 OK

---

## 🔄 更新部署流程

### 更新代码

```bash
# 方式A：Git拉取（推荐）
cd /docker/site2
cp backend/.env backend/.env.backup     # 备份.env
git stash                               # 暂存本地修改
git pull origin main                    # 拉取最新代码
git stash pop                           # 恢复本地修改
cp backend/.env.backup backend/.env     # 恢复.env

# 方式B：本地推送
# 在本地执行
cd ~/Documents/GitHub/Pixel-Art/site2
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  ./ root@YOUR_VPS_IP:/docker/site2/
```

### 重新部署

```bash
cd /docker/site2
./deploy.sh
```

---

## 🛠️ 常用运维命令

### 容器管理

```bash
# 查看容器状态
docker ps | grep site2

# 查看日志（实时）
docker logs site2 -f

# 查看最近日志
docker logs site2 --tail 50

# 重启容器
docker restart site2

# 停止容器
docker stop site2

# 删除容器
docker rm site2

# 进入容器
docker exec -it site2 sh
```

### 健康检查

```bash
# 容器内健康检查
docker exec site2 curl -s http://localhost:3001/api/health

# 获取容器IP
docker inspect site2 | grep IPAddress | head -1

# 从外部访问
CONTAINER_IP=$(docker inspect site2 | grep '"IPAddress"' | head -1 | cut -d'"' -f4 | grep -v '^$' | head -1)
curl http://$CONTAINER_IP:3001/api/health
```

### 网络诊断

```bash
# 查看容器网络
docker inspect site2 | grep -A 10 "Networks"

# 查看webproxy网络
docker network inspect webproxy | grep -A 5 site2

# 重新连接网络
docker network connect webproxy site2
docker network connect shared_net site2

# 测试网络连接
docker exec site2 ping -c 3 google.com
```

### CORS配置检查

```bash
# 查看CORS日志
docker logs site2 | grep "CORS"

# 查看允许的源
docker logs site2 | grep "允许的CORS源"

# 查看被阻止的源
docker logs site2 | grep "CORS阻止"

# 检查环境变量
docker exec site2 env | grep ALLOWED_ORIGINS
```

---

## 🐛 故障排除

### 问题1：容器无法启动

**诊断：**
```bash
docker logs site2 --tail 50
docker ps -a | grep site2
```

**常见原因：**
- ❌ .env文件缺失 → 复制env.vps.example为backend/.env
- ❌ 端口冲突 → 检查3001端口是否被占用
- ❌ 前端未构建 → 检查backend/frontend/dist是否存在

### 问题2：CORS错误（www被阻止）

**诊断：**
```bash
docker logs site2 | grep "CORS"
```

**解决方案：**
```bash
# 检查.env配置
cat backend/.env | grep ALLOWED_ORIGINS
# 应该是：ALLOWED_ORIGINS=https://pixelartland.cc,https://www.pixelartland.cc

# 如果配置错误，修改后重启
nano backend/.env
docker restart site2

# 验证
docker logs site2 | grep "允许的CORS源"
```

### 问题3：健康检查失败

**诊断：**
```bash
docker exec site2 curl -v http://localhost:3001/api/health
docker logs site2 --tail 30
```

**常见原因：**
- ❌ 应用启动失败 → 查看日志错误信息
- ❌ 端口未监听 → 检查PORT环境变量
- ❌ TypeScript编译错误 → 重新编译：cd backend && npm run build

### 问题4：502 Bad Gateway

**诊断：**
```bash
# 检查容器是否运行
docker ps | grep site2

# 检查NPM配置的IP是否正确
docker inspect site2 | grep IPAddress

# 测试容器内部访问
docker exec site2 curl http://localhost:3001/api/health
```

**解决方案：**
- 使用容器IP而非容器名配置NPM
- 确保容器在webproxy网络中
- 重启NPM容器

---

## 📊 性能监控

### 资源使用

```bash
# 查看容器资源使用
docker stats site2

# 查看容器详细信息
docker inspect site2 | grep -A 10 "Memory"

# 查看磁盘使用
docker exec site2 du -sh /app
```

### 日志管理

```bash
# 查看日志大小
docker inspect site2 | grep LogPath

# 清理旧日志（谨慎）
docker container prune --filter "until=24h"

# 限制日志大小（在docker-compose.yml中配置）
logging:
  options:
    max-size: "10m"
    max-file: "3"
```

---

## 📚 参考文档

### 相关文件

- `docs/从零指导程序开发建设 1001.md` - 完整部署指南
- `docs/VPS部署问题处理指南 1001.md` - 问题诊断流程
- `env.vps.example` - 环境变量模板
- `deploy.sh` - 一键部署脚本
- `build-frontend.sh` - 前端构建脚本

### 关键规范

1. **容器名称**: site2（遵循站点编号规范）
2. **部署路径**: /docker/site2
3. **网络**: webproxy + shared_net
4. **端口**: 3001
5. **时区**: America/New_York
6. **CORS**: 环境变量驱动，支持多域名

---

## ✅ 部署完成后的验证清单

- [ ] 容器正常运行：`docker ps | grep site2`
- [ ] 健康检查通过：`curl http://localhost:3001/api/health`
- [ ] CORS配置正确：`docker logs site2 | grep "允许的CORS源"`
- [ ] 主域名访问正常：`curl -I https://pixelartland.cc`
- [ ] www域名访问正常：`curl -I https://www.pixelartland.cc`
- [ ] SSL证书有效：浏览器显示🔒绿锁
- [ ] 功能测试：上传图片并转换成功
- [ ] 国际化测试：默认英语界面正常显示

---

**部署时间估计**: 15-20分钟（首次部署）  
**更新时间估计**: 5-8分钟（代码更新重新部署）

**最后更新**: 2025-10-26  
**版本**: v1.0  
**状态**: 准备就绪，可以部署 ✅


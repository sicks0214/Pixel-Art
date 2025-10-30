# 🎨 像素画转换器 - Site2 (PIXELARTLAND.CC)

> **VPS部署版本** - 部署到 /docker/site2  
> **域名**: pixelartland.cc, www.pixelartland.cc

---

## 📋 快速开始

### 本地开发

```bash
# 前端开发
cd frontend
npm install
npm run dev

# 后端开发（可选）
cd backend
npm install
npm run dev
```

### VPS部署

详细部署说明请查看：

1. **快速开始**: [README_SITE2.md](README_SITE2.md)
2. **完整指南**: [DEPLOY_TO_SITE2.md](DEPLOY_TO_SITE2.md)
3. **快速参考**: [SITE2_QUICK_REFERENCE.md](SITE2_QUICK_REFERENCE.md)

### 一键部署

```bash
# 在VPS上 /docker/site2 目录执行
./deploy-site2.sh
```

---

## 📁 项目结构

```
site2/
├── frontend/           # React前端应用
├── backend/            # Node.js后端API
├── scripts/            # 工具脚本
├── docs/               # 项目文档（在根目录）
├── deploy-site2.sh     # Site2部署脚本
├── diagnose-site2.sh   # Site2诊断脚本
├── build-frontend.sh   # 前端构建脚本
└── README.md          # 本文档
```

---

## 🚀 功能特点

- 🎯 专业图像转像素画算法
- 🌍 7种语言国际化支持
- ⚡ 实时预览和参数调节
- 📱 响应式设计
- 🔧 多种部署方式支持

---

## 🔧 技术栈

### 前端
- React 18 + TypeScript
- Vite 4.x
- TailwindCSS
- Zustand (状态管理)
- react-i18next (国际化)

### 后端
- Node.js + Express
- TypeScript
- Sharp (图像处理)
- Redis (缓存，可选)

### 部署
- Docker
- Nginx Proxy Manager
- VPS自托管

---

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [**ARCHITECTURE_AND_FEATURES.md**](../ARCHITECTURE_AND_FEATURES.md) | **程序架构和功能说明** ⭐ |
| [README_SITE2.md](README_SITE2.md) | Site2快速开始指南 |
| [DEPLOY_TO_SITE2.md](DEPLOY_TO_SITE2.md) | 完整部署指南 |
| [SITE2_QUICK_REFERENCE.md](SITE2_QUICK_REFERENCE.md) | 快速参考卡片 |
| [SITE2_DEPLOYMENT_SUMMARY.md](SITE2_DEPLOYMENT_SUMMARY.md) | 部署总结 |
| [docs/guides/VPS_DEPLOYMENT_GUIDE.md](../docs/guides/VPS_DEPLOYMENT_GUIDE.md) | VPS通用部署指南 |

---

## 🌐 在线访问

- **生产环境**: https://pixelartland.cc
- **备用域名**: https://www.pixelartland.cc

---

## 🆘 获取帮助

### 快速诊断

```bash
./diagnose-site2.sh
```

### 查看日志

```bash
# 如果已部署到Docker
docker logs site2 -f
```

### 重新部署

```bash
./deploy-site2.sh
```

---

## 📝 开发说明

### 环境要求

- Node.js 18+
- npm 8+
- Docker 20.10+ (VPS部署)

### 本地开发配置

前端开发服务器会自动代理API请求到后端：

```
http://localhost:5173 → http://localhost:3001/api
```

### 环境变量

VPS部署需要配置 `backend/.env` 文件，详见 [ENV_CONFIGURATION.md](../docs/guides/ENV_CONFIGURATION.md)

---

## 🎯 Site2 配置信息

```yaml
站点: site2
域名: pixelartland.cc, www.pixelartland.cc
VPS路径: /docker/site2
容器名: site2
端口: 3001
时区: America/New_York
```

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**更新时间**: 2025年10月  
**版本**: v2.0  
**状态**: 生产就绪 ✅


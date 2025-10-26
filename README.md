# 🎨 像素画转换器 - Pixel Art Converter

> **专业的图像转像素画 Web 应用**  
> 支持多种算法、实时预览、7种语言国际化

---

## 📁 项目结构

```
Pixel-Art/
├── site2/                  # 🚀 主项目（VPS部署版本）
│   ├── frontend/           # React前端应用
│   ├── backend/            # Node.js后端API
│   ├── api/                # Vercel Serverless Functions
│   ├── scripts/            # 工具脚本
│   ├── deploy-site2.sh     # Site2部署脚本
│   ├── diagnose-site2.sh   # Site2诊断脚本
│   └── README.md          # Site2说明文档
│
├── docs/                   # 📚 项目文档
│   ├── guides/             # 部署和使用指南
│   ├── architecture/       # 架构文档
│   └── *.md               # 其他文档
│
└── README.md              # 本文档
```

---

## 🚀 快速开始

### 进入项目目录

```bash
cd site2
```

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

```bash
# 在VPS上 /docker/site2 目录执行
cd site2
./deploy-site2.sh
```

详细说明请查看：
- **Site2说明**: [site2/README.md](site2/README.md)
- **快速开始**: [site2/README_SITE2.md](site2/README_SITE2.md)
- **完整部署指南**: [site2/DEPLOY_TO_SITE2.md](site2/DEPLOY_TO_SITE2.md)

---

## ✨ 功能特点

- 🎯 **专业转换**: 4种像素化模式（normal, enhanced, isolated, original）
- 🌍 **多语言**: 支持7种语言国际化（中/英/日/韩/德/法/俄）
- ⚡ **实时预览**: 参数调整时即时显示转换效果
- 🎛️ **直观控制**: 专业的参数调节界面
- 📱 **响应式**: 完美适配桌面端和移动端

---

## 🛠️ 技术栈

### 前端
- React 18 + TypeScript
- Vite 4.x
- TailwindCSS
- Zustand（状态管理）
- react-i18next（国际化）

### 后端
- Node.js + Express
- TypeScript
- Sharp（图像处理）
- Redis（缓存，可选）

### 部署
- Docker
- Nginx Proxy Manager
- Vercel / Railway（云平台可选）

---

## 🌐 部署方式

### 方式一：VPS自托管（推荐）

适合：完全控制、自定义域名

```bash
cd site2
./deploy-site2.sh
```

文档：[site2/DEPLOY_TO_SITE2.md](site2/DEPLOY_TO_SITE2.md)

### 方式二：Vercel云平台

适合：快速部署、零配置

文档：[docs/guides/VERCEL_GUIDE.md](docs/guides/VERCEL_GUIDE.md)

### 方式三：Railway云平台

适合：后端服务、数据库集成

文档：[docs/guides/VERCEL_RAILWAY_部署指南.md](docs/guides/VERCEL_RAILWAY_部署指南.md)

---

## 📚 文档导航

### 快速开始
- [Site2快速开始](site2/README_SITE2.md)
- [5分钟快速部署](site2/VPS_QUICK_START.md)

### 部署指南
- [VPS完整部署指南](site2/DEPLOY_TO_SITE2.md)
- [VPS通用指南](docs/guides/VPS_DEPLOYMENT_GUIDE.md)
- [环境变量配置](docs/guides/ENV_CONFIGURATION.md)

### 开发文档
- [**程序架构和功能说明**](ARCHITECTURE_AND_FEATURES.md) ⭐ 推荐
- [详细架构文档](docs/architecture/像素画转换器完整架构文档.md)
- [双架构设计](docs/architecture/双架构设计方案.md)
- [从零开发指导](docs/从零指导程序开发建设%201001.md)

### 运维文档
- [VPS部署问题处理](docs/VPS部署问题处理指南%201001.md)
- [Site2快速参考](site2/SITE2_QUICK_REFERENCE.md)

---

## 🎯 Site2 部署信息

### 生产环境

- **域名**: pixelartland.cc, www.pixelartland.cc
- **VPS路径**: /docker/site2
- **容器名**: site2
- **端口**: 3001

### 快速命令

```bash
# 部署
cd site2 && ./deploy-site2.sh

# 诊断
cd site2 && ./diagnose-site2.sh

# 日志
docker logs site2 -f

# 重启
docker restart site2
```

---

## 🎨 像素化模式

1. **Normal**: 基础像素化 + 调色板匹配
2. **Enhanced**: 卡通化 + 重描边（K-means聚类 + Canny边缘检测）
3. **Isolated**: 像素化 + 细描边（网格线显示）
4. **Original**: 纯像素化（保持原始分辨率的马赛克效果）

---

## 🌍 国际化支持

支持7种语言：

| 语言 | 代码 | 完成度 |
|------|------|--------|
| 中文（简体） | zh | ✅ 100% |
| English | en | ✅ 100% |
| 日本語 | ja | ✅ 100% |
| 한국어 | ko | ✅ 100% |
| Deutsch | de | ✅ 100% |
| Français | fr | ✅ 100% |
| Русский | ru | ✅ 100% |

---

## 🔧 开发说明

### 环境要求

- Node.js 18+
- npm 8+
- Docker 20.10+（VPS部署）

### 本地开发

```bash
cd site2

# 前端开发（http://localhost:5173）
cd frontend
npm install
npm run dev

# 后端开发（http://localhost:3001）
cd backend
npm install
npm run dev
```

### 构建

```bash
cd site2

# 前端构建
./build-frontend.sh

# 后端构建
cd backend
npm run build
```

---

## 📊 性能指标

| 指标 | 目标值 | 实际值 |
|------|--------|--------|
| **首屏加载时间** | < 2秒 | ~1.5秒 ✅ |
| **图像处理时间** | < 3秒 | ~2秒 ✅ |
| **内存使用** | < 512MB | ~300MB ✅ |
| **TypeScript覆盖率** | 100% | 100% ✅ |

---

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](site2/LICENSE) 文件

---

## 🆘 获取帮助

### 快速诊断

```bash
cd site2
./diagnose-site2.sh
```

### 查看日志

```bash
# 本地开发
npm run dev

# VPS部署
docker logs site2 -f
```

### 常见问题

查看文档：
- [VPS部署问题处理](docs/VPS部署问题处理指南%201001.md)
- [Site2部署指南](site2/DEPLOY_TO_SITE2.md)

---

## 📞 联系方式

- **项目主页**: [GitHub Repository]
- **问题反馈**: [GitHub Issues]
- **文档**: 查看 `docs/` 和 `site2/` 目录

---

**更新时间**: 2025年10月  
**版本**: v2.0  
**状态**: 生产就绪 ✅

**主项目位于 `site2/` 目录** 🚀

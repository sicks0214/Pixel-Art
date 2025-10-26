# 🎨 像素画转换器 - 程序架构与功能说明

> **版本**: v2.0  
> **更新时间**: 2025年10月  
> **在线访问**: https://pixelartland.cc  
> **状态**: ✅ 生产就绪

---

## 📋 目录

- [项目概述](#-项目概述)
- [核心功能](#-核心功能)
- [技术架构](#-技术架构)
- [目录结构](#-目录结构)
- [功能模块](#-功能模块)
- [API接口](#-api接口)
- [部署方案](#-部署方案)
- [性能指标](#-性能指标)
- [快速开始](#-快速开始)

---

## 🎯 项目概述

**像素画转换器（Pixel Art Converter）** 是一个专业的Web应用，能够将普通照片转换为复古像素画风格的图像。项目采用现代化的前后端分离架构，提供直观的用户界面和强大的图像处理能力。

### 核心价值

| 特性 | 说明 |
|------|------|
| 🎨 **专业算法** | Sharp引擎 + K-means聚类 + Floyd-Steinberg抖动 |
| 🌍 **国际化** | 7种语言支持（中/英/日/韩/德/法/俄） |
| ⚡ **实时预览** | 前端Canvas渲染，参数调整即时响应 |
| 🎛️ **灵活控制** | 4种像素化模式 + 多维参数调节 |
| 📱 **响应式** | 完美适配桌面、平板、移动设备 |

### 应用场景

- 🎮 游戏素材制作
- 🎨 艺术创作与设计
- 📸 社交媒体内容创作
- 🖼️ 复古风格图像处理

---

## ✨ 核心功能

### 1. 图像转换功能

#### 像素化模式

| 模式 | 描述 | 技术实现 | 适用场景 |
|------|------|----------|----------|
| **Normal** | 基础像素化 + 调色板匹配 | 降采样 + 颜色量化 | 通用像素画 |
| **Enhanced** | 卡通化 + 重描边 | K-means聚类 + Canny边缘 | 艺术风格 |
| **Isolated** | 像素化 + 细描边 | 网格线显示 | 游戏素材 |
| **Original** | 纯像素化 | 最近邻采样 + 马赛克 | 复古风格 |

#### 参数控制

```typescript
interface PixelArtParams {
  pixelSize: number         // 像素块大小: 1-50
  colorCount: number        // 颜色数量: 4-256
  palette: string          // 调色板: auto/nes/gameboy/c64
  filter: string           // 滤镜: none/retro/neon/blackwhite
  pixelMode: string        // 处理模式: normal/enhanced/isolated/original
  edgeDensity: string      // 边缘密度: minimal/low/medium/high/maximum
  exportFormat: string     // 导出格式: png/jpg
}
```

### 2. 用户交互功能

#### 文件操作
- ✅ 拖拽上传（支持PNG/JPG/WEBP，最大10MB）
- ✅ 点击选择文件
- ✅ 实时文件验证
- ✅ 进度显示

#### 预览功能
- ✅ 原图与效果对比显示
- ✅ 实时参数调整预览
- ✅ Canvas像素完美渲染
- ✅ 全屏模式

#### 导出功能
- ✅ PNG/JPG格式导出
- ✅ 自定义文件名
- ✅ 高质量输出
- ✅ 一键下载

### 3. 国际化系统

支持7种语言，可动态切换：

```javascript
const SUPPORTED_LANGUAGES = [
  { code: 'zh', name: '中文', flag: '🇨🇳', coverage: '100%' },
  { code: 'en', name: 'English', flag: '🇺🇸', coverage: '100%' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', coverage: '100%' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', coverage: '100%' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', coverage: '100%' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', coverage: '100%' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', coverage: '100%' }
]
```

### 4. 内置调色板

| 调色板 | 颜色数 | 描述 |
|--------|--------|------|
| **Auto** | 自动提取 | 智能分析图像颜色 |
| **NES** | 8色 | 任天堂经典调色板 |
| **Game Boy** | 4色 | 经典绿色系 |
| **C64** | 8色 | Commodore 64复古色 |

---

## 🏗️ 技术架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                            │
│  ┌─────────────────────────────────────────────────┐    │
│  │         React 18 + TypeScript 前端              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │  UI组件  │  │ 状态管理 │  │ Canvas   │     │    │
│  │  │(TailwindCSS)│(Zustand) │  │ 渲染引擎 │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/HTTPS
                      │ REST API
┌─────────────────────▼───────────────────────────────────┐
│              Node.js + Express 后端                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │ 路由层   │  │ 控制器层 │  │ 服务层   │     │    │
│  │  │(Express) │  │(业务逻辑)│  │(图像处理)│     │    │
│  │  └──────────┘  └──────────┘  └──────────┘     │    │
│  │         │            │            │            │    │
│  │         └────────────┴────────────┘            │    │
│  │                      │                         │    │
│  │         ┌────────────▼────────────┐            │    │
│  │         │   Sharp 图像处理引擎    │            │    │
│  │         │  - 颜色量化             │            │    │
│  │         │  - 插值算法             │            │    │
│  │         │  - 抖动处理             │            │    │
│  │         └─────────────────────────┘            │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 技术栈详情

#### 前端技术栈

```typescript
{
  "framework": "React 18.2.0",
  "language": "TypeScript 5.0",
  "buildTool": "Vite 4.4",
  "styling": "TailwindCSS 3.3",
  "stateManagement": "Zustand 4.4",
  "i18n": "react-i18next 13.0",
  "routing": "react-router-dom 6.15",
  "http": "Axios 1.5",
  "icons": "Lucide React 0.263"
}
```

#### 后端技术栈

```typescript
{
  "runtime": "Node.js 18+",
  "framework": "Express 4.18",
  "language": "TypeScript 5.0",
  "imageProcessing": "Sharp 0.34",
  "fileUpload": "Multer 1.4",
  "cache": "Redis 4.6 (optional)",
  "validation": "Joi 17.9",
  "logging": "Winston 3.10"
}
```

#### 部署技术栈

```yaml
containerization:
  - Docker 20.10+
  - docker-compose 3.8

reverseProxy:
  - Nginx Proxy Manager

platforms:
  - VPS: 自托管部署
  - Vercel: Serverless部署
  - Railway: 容器化部署
```

---

## 📁 目录结构

### 项目根目录

```
Pixel-Art/
├── site2/                      # 🚀 主项目目录
│   ├── frontend/               # 前端应用
│   ├── backend/                # 后端API
│   ├── api/                    # Serverless函数
│   ├── scripts/                # 工具脚本
│   ├── *.sh                    # 部署脚本
│   ├── docker-compose*.yml     # Docker配置
│   └── *.md                    # 项目文档
├── docs/                       # 📚 文档中心
│   ├── architecture/           # 架构文档
│   ├── guides/                 # 使用指南
│   └── *.md                    # 其他文档
├── README.md                   # 主说明
├── START_HERE.md               # 快速导航
└── ARCHITECTURE_AND_FEATURES.md # 本文档
```

### 前端目录结构

```
site2/frontend/
├── src/
│   ├── components/             # React组件
│   │   ├── Layout/            # 布局组件
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── PixelArt/          # 核心功能组件 ⭐
│   │   │   ├── PixelArtConverterUltimate.tsx  # 主组件
│   │   │   ├── ControlPanel/  # 控制面板
│   │   │   ├── PreviewArea/   # 预览区域
│   │   │   ├── InfoPanel/     # 信息面板
│   │   │   └── UI/            # UI组件
│   │   └── UI/                # 通用UI组件
│   ├── pages/                  # 页面路由
│   │   ├── PixelArtHomePage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── PrivacyPolicyPage.tsx
│   │   ├── TermsOfServicePage.tsx
│   │   ├── DisclaimerPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── store/                  # Zustand状态管理
│   │   ├── pixelArtStore.ts
│   │   ├── pixelArtUltimateStore.ts
│   │   ├── appStore.ts
│   │   ├── canvasStore.ts
│   │   └── imageStore.ts
│   ├── services/               # API服务
│   │   ├── pixelArtApi.ts
│   │   ├── imageService.ts
│   │   └── exportService.ts
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useDebounce.ts
│   │   ├── useToast.ts
│   │   ├── useCanvas.ts
│   │   └── useImageUpload.ts
│   ├── i18n/                   # 国际化
│   │   ├── index.ts
│   │   ├── locales/           # 翻译文件
│   │   │   ├── en.json
│   │   │   ├── zh.json
│   │   │   ├── ja.json
│   │   │   └── ...
│   │   └── core/
│   ├── utils/                  # 工具函数
│   │   ├── canvasHelper.ts
│   │   ├── pixelArtProcessor.ts
│   │   ├── imageOptimizer.ts
│   │   └── memoryManager.ts
│   ├── types/                  # TypeScript类型
│   │   ├── pixelArt.ts
│   │   ├── api.ts
│   │   └── image.ts
│   ├── App.tsx                 # 应用入口
│   └── main.tsx                # 渲染入口
├── public/                     # 静态资源
├── dist/                       # 构建产物
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### 后端目录结构

```
site2/backend/
├── src/
│   ├── controller/             # 控制器层
│   │   └── pixelArt/
│   │       ├── pixelArtController.ts  # 主控制器 ⭐
│   │       └── pixelArtProcessor.ts   # 处理器
│   ├── routes/                 # 路由定义
│   │   └── pixelArt.ts        # 像素画路由 ⭐
│   ├── services/               # 服务层
│   │   ├── pixelArt/          # 像素画服务
│   │   │   ├── imageResizer.ts       # 图像缩放
│   │   │   ├── colorQuantizer.ts     # 颜色量化
│   │   │   ├── ditheringProcessor.ts # 抖动处理
│   │   │   ├── validator.ts          # 验证器
│   │   │   ├── taskManager.ts        # 任务管理
│   │   │   └── errorHandler.ts       # 错误处理
│   │   ├── cache/             # 缓存服务
│   │   │   ├── pixelArtCache.ts
│   │   │   └── redisClient.ts
│   │   └── image/             # 图像服务
│   │       └── imageProcessor.ts
│   ├── middleware/             # 中间件
│   │   ├── validation.ts      # 参数验证
│   │   ├── imageUpload.ts     # 文件上传
│   │   └── cacheMiddleware.ts # 缓存中间件
│   ├── tests/                  # 测试文件
│   └── index.ts                # Express入口 ⭐
├── Dockerfile.simple           # Docker构建
├── package.json
└── tsconfig.json
```

---

## 🔧 功能模块

### 1. 图像上传模块

**位置**: `frontend/src/components/PixelArt/ControlPanel/FileUploader.tsx`

**功能**:
- ✅ 拖拽上传
- ✅ 点击选择
- ✅ 文件格式验证（PNG/JPG/WEBP）
- ✅ 文件大小限制（10MB）
- ✅ 实时预览

**实现**:
```typescript
// 文件验证逻辑
const validateFile = (file: File): boolean => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  return validTypes.includes(file.type) && file.size <= maxSize
}
```

### 2. 参数控制模块

**位置**: `frontend/src/components/PixelArt/ControlPanel/`

**核心组件**:

| 组件 | 功能 | 特性 |
|------|------|------|
| **RangeSlider** | 滑块控制 | 300ms防抖、键盘导航 |
| **DropdownSelect** | 下拉选择 | 调色板、滤镜选择 |
| **ActionButtons** | 操作按钮 | 转换、下载、重置 |

**参数说明**:

```typescript
// 像素大小：控制像素块的大小
pixelSize: 1-50 (默认: 8)

// 颜色数量：限制使用的颜色数
colorCount: 4-256 (默认: 32)

// 调色板：预设颜色方案
palette: 'auto' | 'nes' | 'gameboy' | 'c64'

// 滤镜效果
filter: 'none' | 'retro' | 'neon' | 'blackwhite'

// 处理模式
pixelMode: 'normal' | 'enhanced' | 'isolated' | 'original'

// 边缘密度
edgeDensity: 'minimal' | 'low' | 'medium' | 'high' | 'maximum'
```

### 3. 实时预览模块

**位置**: `frontend/src/components/PixelArt/PreviewArea/`

**功能**:
- ✅ Canvas高性能渲染
- ✅ 原图与效果对比
- ✅ 像素完美显示
- ✅ 自适应缩放

**渲染优化**:
```typescript
// Canvas配置优化
const canvasConfig = {
  imageSmoothingEnabled: false,  // 禁用平滑，保持像素锐利
  willReadFrequently: true,       // 优化频繁读取
  desynchronized: true            // 降低延迟
}
```

### 4. 信息统计模块

**位置**: `frontend/src/components/PixelArt/InfoPanel/`

**显示内容**:
- 📊 图像尺寸（宽×高）
- 📊 像素总数
- 📊 使用的颜色数量
- 📊 提取的调色板
- 📊 文件大小

### 5. 图像处理模块（后端）

**位置**: `backend/src/services/pixelArt/`

**核心算法**:

#### 颜色量化（K-means聚类）
```typescript
// backend/src/services/pixelArt/colorQuantizer.ts
async quantizeColors(imageData: Buffer, colorCount: number) {
  // 1. 提取所有像素颜色
  // 2. K-means聚类分组
  // 3. 计算簇中心作为代表色
  // 4. 映射原始颜色到最近的代表色
}
```

#### 抖动处理（Floyd-Steinberg）
```typescript
// backend/src/services/pixelArt/ditheringProcessor.ts
applyDithering(imageData: ImageData, palette: Color[]) {
  // Floyd-Steinberg误差扩散算法
  // 将颜色误差分散到相邻像素
}
```

#### 图像缩放
```typescript
// backend/src/services/pixelArt/imageResizer.ts
async resize(buffer: Buffer, params: ResizeParams) {
  return sharp(buffer)
    .resize(targetWidth, targetHeight, {
      kernel: params.interpolation === 'nearest' 
        ? sharp.kernel.nearest 
        : sharp.kernel.cubic
    })
    .toBuffer()
}
```

### 6. 任务管理模块

**位置**: `backend/src/services/pixelArt/taskManager.ts`

**功能**:
- ✅ 异步任务队列
- ✅ 进度跟踪
- ✅ 超时管理
- ✅ 结果缓存

**工作流程**:
```
上传图片 → 创建任务 → 队列处理 → 进度查询 → 获取结果
   ↓          ↓           ↓          ↓          ↓
imageId    taskId    processing   progress%   result
```

---

## 🌐 API接口

### 基础URL

```
生产环境: https://pixelartland.cc/api
开发环境: http://localhost:3001/api
```

### 接口列表

#### 1. 上传图片

```http
POST /api/color03/pixel-art/upload
Content-Type: multipart/form-data

Body:
{
  "imageFile": File
}

Response:
{
  "success": true,
  "data": {
    "imageId": "img_1234567890",
    "fileDimensions": {
      "width": 1920,
      "height": 1080
    },
    "fileSize": 524288,
    "fileName": "photo.jpg"
  }
}
```

#### 2. 开始转换任务

```http
POST /api/color03/pixel-art/start
Content-Type: application/json

Body:
{
  "imageId": "img_1234567890",
  "parameters": {
    "resizeFactor": 50,
    "interpolation": "nearest_neighbor",
    "colorMode": "no_dithering",
    "ditheringRatio": 1.0
  }
}

Response:
{
  "success": true,
  "data": {
    "taskId": "task_0987654321",
    "estimatedTime": 10000,
    "status": "queued"
  }
}
```

#### 3. 查询转换进度

```http
GET /api/color03/pixel-art/progress/:taskId

Response:
{
  "success": true,
  "data": {
    "taskId": "task_0987654321",
    "progress": 75,
    "status": "processing",
    "currentStep": "颜色量化中...",
    "estimatedTimeRemaining": 2500
  }
}
```

#### 4. 获取转换结果

```http
GET /api/color03/pixel-art/result/:taskId

Response:
{
  "success": true,
  "data": {
    "pixelArtImage": "data:image/png;base64,iVBORw0KGg...",
    "canvasInfo": {
      "width": 960,
      "height": 540,
      "coloredPixels": 518400
    },
    "extractedColors": ["#FF0000", "#00FF00", "#0000FF", ...],
    "processingTime": 2347,
    "metadata": {
      "algorithm": "k-means",
      "colorCount": 32
    }
  }
}
```

#### 5. 健康检查

```http
GET /api/health

Response:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00.000Z",
  "services": {
    "sharp": { "status": "ok" },
    "memory": {
      "used": "128.45MB",
      "total": "512.00MB"
    },
    "uptime": {
      "seconds": 86400,
      "formatted": "1d 0h 0m 0s"
    }
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述信息",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-26T12:00:00.000Z"
}
```

常见错误码:
- `400`: 请求参数错误
- `404`: 资源不存在
- `413`: 文件过大
- `415`: 文件格式不支持
- `429`: 请求过于频繁
- `500`: 服务器内部错误

---

## 🚀 部署方案

### 方案一：VPS自托管部署（推荐生产环境）

**适用场景**: 完全控制、自定义域名、高性能需求

**部署架构**:
```
Internet → Nginx Proxy Manager → Docker Container (site2)
                                   ├─ Frontend (React)
                                   └─ Backend (Node.js + Express)
```

**部署步骤**:

1. **准备VPS环境**
```bash
# 安装Docker
curl -fsSL https://get.docker.com | bash

# 创建网络
docker network create webproxy
docker network create shared_net
```

2. **上传代码到VPS**
```bash
# 方式1：Git克隆
git clone <repository-url> /docker/site2

# 方式2：SCP上传
scp -r site2/ root@your-vps-ip:/docker/
```

3. **配置环境变量**
```bash
cd /docker/site2/backend
cp env.example .env
nano .env  # 编辑配置
```

4. **执行部署**
```bash
cd /docker/site2
chmod +x deploy-site2.sh
./deploy-site2.sh
```

5. **配置Nginx Proxy Manager**
- Domain Names: `pixelartland.cc`, `www.pixelartland.cc`
- Scheme: `http`
- Forward Hostname/IP: `site2`
- Forward Port: `3001`
- ✅ Block Common Exploits
- ✅ Websockets Support
- ✅ SSL (Let's Encrypt)
- ✅ Force SSL

**部署信息**:
```yaml
域名: pixelartland.cc, www.pixelartland.cc
VPS路径: /docker/site2
容器名: site2
端口: 3001
时区: America/New_York
```

### 方案二：Vercel无服务器部署

**适用场景**: 快速部署、零配置、全球CDN

**配置文件**: `site2/vercel.json`

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "functions": {
    "api/index.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.ts" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**部署步骤**:
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd site2
vercel --prod
```

### 方案三：Railway容器部署

**适用场景**: 后端服务、数据库集成、自动扩容

**配置文件**: `site2/railway.json`

**部署步骤**:
1. 连接GitHub仓库
2. 选择`site2`目录
3. 配置环境变量
4. 自动部署

---

## 📊 性能指标

### 核心性能

| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| **首屏加载时间** | < 2s | ~1.5s | ✅ |
| **图像处理时间** | < 3s | ~2s | ✅ |
| **内存使用** | < 512MB | ~300MB | ✅ |
| **Bundle大小** | < 2MB | ~1.8MB | ✅ |
| **TypeScript覆盖** | 100% | 100% | ✅ |

### 算法性能

| 算法 | 1024×768 | 2048×1536 | 4096×3072 |
|------|----------|-----------|-----------|
| **最近邻插值** | ~200ms | ~500ms | ~1.2s |
| **双线性插值** | ~350ms | ~800ms | ~2.0s |
| **K-means聚类** | ~800ms | ~1.5s | ~4.0s |
| **Floyd-Steinberg** | ~400ms | ~900ms | ~2.5s |

### 并发性能

```
并发用户: 100人
平均响应时间: 1.8s
峰值响应时间: 3.2s
错误率: < 0.5%
```

### 优化措施

1. **前端优化**
   - ✅ 代码分割（Vite Chunking）
   - ✅ 懒加载（React.lazy）
   - ✅ 防抖处理（300ms debounce）
   - ✅ Canvas离屏渲染
   - ✅ 内存自动清理

2. **后端优化**
   - ✅ Sharp高性能图像处理
   - ✅ Worker Pool多线程
   - ✅ Redis缓存（可选）
   - ✅ 请求速率限制
   - ✅ 响应压缩（gzip）

3. **部署优化**
   - ✅ Docker镜像优化
   - ✅ Nginx静态资源缓存
   - ✅ CDN加速（Vercel）
   - ✅ 健康检查机制

---

## 🚀 快速开始

### 本地开发

#### 1. 克隆项目
```bash
git clone <repository-url>
cd Pixel-Art/site2
```

#### 2. 前端开发
```bash
cd frontend
npm install
npm run dev

# 访问: http://localhost:5173
```

#### 3. 后端开发（可选）
```bash
cd backend
npm install
npm run dev

# 访问: http://localhost:3001
```

### VPS部署

```bash
# 1. 上传到VPS
scp -r site2/ root@your-vps-ip:/docker/

# 2. 登录VPS
ssh root@your-vps-ip

# 3. 进入目录
cd /docker/site2

# 4. 配置环境变量
nano backend/.env

# 5. 执行部署
./deploy-site2.sh
```

### 快速验证

```bash
# 检查服务状态
docker ps | grep site2

# 查看日志
docker logs site2 -f

# 健康检查
curl http://localhost:3001/api/health

# 重启服务
docker restart site2
```

---

## 📚 相关文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目总览 |
| [START_HERE.md](START_HERE.md) | 快速导航 |
| [site2/README.md](site2/README.md) | Site2说明 |
| [site2/DEPLOY_TO_SITE2.md](site2/DEPLOY_TO_SITE2.md) | 完整部署指南 |
| [docs/guides/ENV_CONFIGURATION.md](docs/guides/ENV_CONFIGURATION.md) | 环境变量配置 |
| [docs/architecture/](docs/architecture/) | 详细架构文档 |

---

## 🔐 安全措施

### 文件上传安全
- ✅ 文件类型白名单（PNG/JPG/WEBP）
- ✅ 文件大小限制（10MB）
- ✅ 文件内容验证
- ✅ 临时文件自动清理

### API安全
- ✅ CORS跨域配置
- ✅ 请求速率限制（15分钟100次）
- ✅ 输入参数验证
- ✅ XSS防护
- ✅ SQL注入防护（如使用数据库）

### 部署安全
- ✅ HTTPS强制重定向
- ✅ 安全头部配置
- ✅ 环境变量隔离
- ✅ 最小权限原则

---

## 📞 获取帮助

### 快速诊断
```bash
cd site2
./diagnose-site2.sh
```

### 查看日志
```bash
# VPS部署
docker logs site2 -f

# 本地开发
npm run dev
```

### 常见问题

#### 问题：CORS错误
**解决**: 检查`backend/.env`中的`ALLOWED_ORIGINS`配置

#### 问题：图像处理失败
**解决**: 
1. 检查文件格式和大小
2. 查看后端日志: `docker logs site2`
3. 验证Sharp库是否正常工作

#### 问题：内存占用过高
**解决**:
1. 减小处理图像的分辨率
2. 启用Redis缓存
3. 增加服务器内存

---

## 📄 许可证

MIT License - 详见 [LICENSE](site2/LICENSE) 文件

---

## 🙏 致谢

- **React团队** - 强大的UI框架
- **Sharp** - 高性能图像处理库
- **Zustand** - 轻量级状态管理
- **TailwindCSS** - 现代化CSS框架
- **Vite** - 快速构建工具

---

**更新时间**: 2025年10月26日  
**版本**: v2.0  
**状态**: ✅ 生产就绪  
**在线访问**: https://pixelartland.cc

---

<div align="center">

**🎨 让每张图片都成为像素艺术 🎨**

[开始使用](https://pixelartland.cc) · [查看文档](docs/) · [报告问题](https://github.com/issues)

</div>


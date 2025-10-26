# 🎨 像素画转换器

专业的图像转像素画Web应用，支持多种算法、实时预览和国际化。

## ✨ 功能特点

- 🎯 **专业转换**: 4种像素化模式（normal, enhanced, isolated, original）
- 🌍 **多语言**: 支持7种语言国际化（中/英/日/韩/德/法/俄）
- ⚡ **实时预览**: 参数调整时即时显示转换效果
- 🎛️ **直观控制**: 专业的参数调节界面
- 📱 **响应式**: 完美适配桌面端和移动端

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发
```bash
npm run dev
```

### 构建
```bash
npm run build
```

### 预览
```bash
npm run preview
```

## 🏗️ 技术栈

- **前端**: React 18 + TypeScript + Vite
- **状态管理**: Zustand
- **样式**: TailwindCSS
- **国际化**: react-i18next
- **图像处理**: Canvas API

## 📁 项目结构

```
src/
├── components/          # UI组件库
├── services/            # API服务层
├── store/               # Zustand状态管理
├── hooks/               # 自定义Hooks
├── i18n/                # 国际化
├── types/               # TypeScript类型定义
├── utils/               # 工具函数
├── config/              # 配置文件
├── pages/               # 页面组件
├── App.tsx              # 主应用组件
└── main.tsx             # 入口文件
```

## 🎨 像素化模式

1. **Normal**: 基础像素化 + 调色板匹配
2. **Enhanced**: 卡通化 + 重描边（K-means聚类 + Canny边缘检测）
3. **Isolated**: 像素化 + 细描边（网格线显示）
4. **Original**: 纯像素化（保持原始分辨率的马赛克效果）

## 🌍 国际化支持

- 中文（简体）
- English
- 日本語
- 한국어
- Deutsch
- Français
- Русский

## 📦 部署

### Vercel部署
```bash
npm run build
```

项目已针对Vercel部署进行优化，支持自动部署和静态文件托管。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
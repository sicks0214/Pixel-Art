/**
 * API配置 - Vercel + Railway部署方案
 */

// 获取API基础URL
export const getApiBaseUrl = (): string => {
  // 优先使用环境变量
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 开发环境默认值
  if (import.meta.env?.DEV) {
    return 'http://localhost:3001';
  }
  
  // 生产环境警告
  console.warn('⚠️ VITE_API_URL 环境变量未设置，请在Vercel控制台配置');
  return 'https://surprising-renewal-production.up.railway.app'; // 使用实际Railway URL
};

// API配置
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// API端点 - 确保与后端路由匹配
export const API_ENDPOINTS = {
  colorAnalysis: '/api/color-analysis',           // COLOR02
  image: '/api/images',                           // 通用图像处理
  palette: '/api/palettes',                       // 调色板服务
  export: '/api/export',                          // 导出功能
  
  // COLOR03 像素画转换端点（COLOR02风格分步式）
  pixelArt: '/api/color03/pixel-art',            // 基础路径
  pixelArtUpload: '/api/color03/pixel-art/upload',        // 上传图片
  pixelArtConvert: '/api/color03/pixel-art/start',        // 开始转换（避免与兼容API冲突）
  pixelArtProgress: '/api/color03/pixel-art/progress',    // 查询进度
  pixelArtResult: '/api/color03/pixel-art/result',        // 获取结果
  pixelArtHealth: '/api/color03/health',                  // 健康检查
};

// COLOR03特定配置（COLOR02风格）
export const PIXEL_ART_CONFIG = {
  timeout: 30000,                    // API调用超时
  uploadTimeout: 15000,              // 上传超时
  progressPollInterval: 1000,        // 进度轮询间隔（毫秒）
  maxProgressPolls: 60,              // 最大轮询次数（1分钟）
  maxFileSize: 20 * 1024 * 1024,     // 最大文件大小20MB
  supportedFormats: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  retryAttempts: 2,                  // 重试次数
  retryDelay: 1000,                  // 重试延迟
};

// 是否启用Mock模式
export const isMockMode = (): boolean => {
  return import.meta.env?.VITE_ENABLE_MOCK_MODE === 'true';
};

// 是否为调试模式
export const isDebugMode = (): boolean => {
  return import.meta.env?.VITE_ENABLE_DEBUG === 'true' || import.meta.env?.DEV === true;
}; 
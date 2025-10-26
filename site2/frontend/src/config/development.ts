/**
 * 开发环境配置
 * 用于控制在开发环境和生产环境中的不同行为
 */

export interface DevelopmentConfig {
  /** 是否显示开发提示 */
  showDeveloperHints: boolean
  /** API端点配置 */
  apiEndpoints: {
    production: string
    development: string
  }
}

/**
 * 检查当前是否为开发环境
 */
export const isDevelopmentEnvironment = (): boolean => {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('dev') ||
    window.location.port === '5173' || // Vite默认端口
    window.location.port === '3000'    // 常用开发端口
  )
}

/**
 * 开发配置
 */
export const developmentConfig: DevelopmentConfig = {
  // 显示开发者提示
  showDeveloperHints: true,
  
  // API端点配置
  apiEndpoints: {
    production: 'https://your-production-api.com/api',
    development: 'http://localhost:3001/api'
  }
}

/**
 * 根据环境获取API端点
 */
export const getApiEndpoint = (): string => {
  return isDevelopmentEnvironment() 
    ? developmentConfig.apiEndpoints.development
    : developmentConfig.apiEndpoints.production
}

/**
 * 检查是否应该显示开发者提示
 */
export const shouldShowDeveloperHints = (): boolean => {
  return isDevelopmentEnvironment() && developmentConfig.showDeveloperHints
}

/**
 * Mock配置 - 从packages/core合并
 */
export const MOCK_CONFIG = {
  generateRandomPixelArt: true,
  mockApiDelay: 1000,
}

/**
 * 通用开发配置 - 从packages/core合并
 */
export const DEV_CONFIG = {
  enableMockMode: false,
  enableDebugLogs: true,
  apiDelay: 0,
} 
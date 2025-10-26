/**
 * 环境配置验证工具
 */

import { API_CONFIG } from '../config/api'

export interface ConfigValidationResult {
  isValid: boolean
  warnings: string[]
  errors: string[]
  info: Record<string, any>
}

/**
 * 验证前端配置
 */
export function validateFrontendConfig(): ConfigValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const info: Record<string, any> = {}

  // 检查基本环境变量
  const env = import.meta.env
  
  info.environment = env.NODE_ENV || env.DEV ? 'development' : 'production'
  info.apiBaseUrl = API_CONFIG.baseURL

  // 必需的环境变量检查
  if (!env.VITE_API_URL) {
    if (env.DEV) {
      warnings.push('开发环境：VITE_API_URL 未设置，使用默认值 http://localhost:3001')
    } else {
      errors.push('生产环境：VITE_API_URL 未设置，请在部署平台配置此环境变量')
    }
  } else {
    info.viteApiUrl = env.VITE_API_URL
    
    // URL格式验证
    try {
      new URL(env.VITE_API_URL)
    } catch {
      errors.push('VITE_API_URL 格式不正确，请检查URL格式')
    }
  }

  // 可选配置检查
  if (!env.VITE_APP_TITLE) {
    warnings.push('VITE_APP_TITLE 未设置，使用默认应用标题')
  }

  if (!env.VITE_APP_VERSION) {
    warnings.push('VITE_APP_VERSION 未设置，建议设置版本号')
  }

  // API连接检查
  if (API_CONFIG.baseURL.includes('your-app.railway.app')) {
    errors.push('API_CONFIG.baseURL 仍使用占位符，请配置正确的后端URL')
  }

  // 开发环境特定检查
  if (env.DEV) {
    info.devMode = true
    if (env.VITE_ENABLE_DEBUG === 'true') {
      info.debugMode = true
    }
  }

  // 生产环境特定检查
  if (!env.DEV && env.NODE_ENV === 'production') {
    if (env.VITE_ENABLE_DEBUG === 'true') {
      warnings.push('生产环境：调试模式已启用，建议关闭以提高性能')
    }
    
    if (!env.VITE_BUILD_SOURCEMAP || env.VITE_BUILD_SOURCEMAP !== 'false') {
      warnings.push('生产环境：建议关闭sourcemap以减小构建大小')
    }
  }

  const isValid = errors.length === 0

  return {
    isValid,
    warnings,
    errors,
    info
  }
}

/**
 * 在控制台打印配置验证结果
 */
export function printConfigValidation(): void {
  const result = validateFrontendConfig()
  
  console.group('🔧 前端配置验证结果')
  
  // 基本信息
  console.log('📊 配置信息:')
  Object.entries(result.info).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  // 错误
  if (result.errors.length > 0) {
    console.error('❌ 配置错误:')
    result.errors.forEach(error => console.error(`  • ${error}`))
  }
  
  // 警告
  if (result.warnings.length > 0) {
    console.warn('⚠️ 配置警告:')
    result.warnings.forEach(warning => console.warn(`  • ${warning}`))
  }
  
  // 结果
  if (result.isValid) {
    console.log('✅ 配置验证通过')
  } else {
    console.error('❌ 配置验证失败，请修复上述错误')
  }
  
  console.groupEnd()
}

/**
 * 检查API连接状态
 */
export async function checkApiConnection(): Promise<{
  success: boolean
  message: string
  responseTime?: number
}> {
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/health`, {
      method: 'GET',
      timeout: 5000
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      return {
        success: true,
        message: '✅ API连接正常',
        responseTime
      }
    } else {
      return {
        success: false,
        message: `❌ API返回错误状态: ${response.status}`,
        responseTime
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      success: false,
      message: `❌ API连接失败: ${error instanceof Error ? error.message : '未知错误'}`,
      responseTime
    }
  }
}

// 开发环境自动运行配置验证
if (import.meta.env.DEV) {
  // 延迟执行，让其他模块先加载
  setTimeout(() => {
    printConfigValidation()
  }, 1000)
}

export default {
  validateFrontendConfig,
  printConfigValidation,
  checkApiConnection
}

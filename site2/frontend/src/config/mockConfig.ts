/**
 * Mock配置文件 - 前端独立运行模式（简化版本）
 */

// Mock模式配置
export interface MockConfig {
  enabled: boolean
  autoFallback: boolean
  simulateDelay: boolean
  showMockIndicator: boolean
  logMockCalls: boolean
}

// 默认Mock配置
export const defaultMockConfig: MockConfig = {
  enabled: false,             // 禁用Mock模式，连接真实后端
  autoFallback: true,         // API失败时自动回退到Mock
  simulateDelay: false,       // 不模拟网络延迟
  showMockIndicator: false,   // 不显示Mock模式指示器
  logMockCalls: true          // 记录模式切换日志
}

// 当前配置
let currentConfig: MockConfig = { ...defaultMockConfig }

/**
 * Mock配置管理类
 */
class MockConfigManager {
  /**
   * 初始化Mock配置
   */
  init(config?: Partial<MockConfig>) {
    currentConfig = { ...defaultMockConfig, ...config }
    this.logModeStatus()
  }

  /**
   * 获取当前配置
   */
  getConfig(): MockConfig {
    return { ...currentConfig }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MockConfig>) {
    currentConfig = { ...currentConfig, ...newConfig }
    this.logModeStatus()
  }

  /**
   * 启用Mock模式
   */
  enableMockMode() {
    this.updateConfig({ enabled: true })
  }

  /**
   * 禁用Mock模式（尝试连接真实后端）
   */
  disableMockMode() {
    this.updateConfig({ enabled: false })
  }

  /**
   * 切换Mock模式
   */
  toggleMockMode() {
    this.updateConfig({ enabled: !currentConfig.enabled })
  }

  /**
   * 检查是否为Mock模式
   */
  get isInMockMode() {
    return currentConfig.enabled
  }

  /**
   * 检查服务状态
   */
  getServiceStatus() {
    return {
      config: currentConfig,
      mode: currentConfig.enabled ? 'Mock模式（前端独立运行）' : '真实API模式',
      status: '✅ 前端运行正常'
    }
  }

  /**
   * 记录模式状态
   */
  private logModeStatus() {
    if (currentConfig.logMockCalls) {
      const mode = currentConfig.enabled ? 'Mock模式（前端独立运行）' : '真实API模式'
      console.log(`🔧 ${mode} 已启用`)
      
      if (currentConfig.enabled) {
        console.log('🎭 前端现在可以独立运行，无需后端服务器')
        console.log('📱 Mock模式已准备就绪')
        console.log('🔄 可在控制台使用 mockConfig 命令')
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🎭 AI表情包制作器 - 前端独立运行模式

📖 使用说明：
1. Mock模式：前端可独立运行，无需后端服务器
2. 真实API模式：连接真实后端服务器

🎛️ 控制命令：
- mockConfig.enableMockMode()    // 启用Mock模式
- mockConfig.disableMockMode()   // 禁用Mock模式  
- mockConfig.toggleMockMode()    // 切换模式
- mockConfig.getServiceStatus()  // 查看服务状态

🔧 当前配置：
${JSON.stringify(currentConfig, null, 2)}

🚀 快速开始：
npm run dev  // 启动前端开发服务器（端口3000）
    `)
  }
}

// 创建全局配置管理器实例
export const mockConfig = new MockConfigManager()

// 自动初始化（连接真实后端模式）
mockConfig.init({
  enabled: false,             // 禁用Mock模式，连接真实后端
  autoFallback: true,         // API失败时自动回退到Mock
  simulateDelay: false,       // 不模拟延迟
  showMockIndicator: false,   // 不显示指示器
  logMockCalls: true          // 记录日志
})

// 全局暴露（开发调试用）
if (typeof window !== 'undefined') {
  (window as any).mockConfig = mockConfig
}

export default mockConfig 
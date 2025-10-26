/**
 * Jest测试设置文件
 * 配置全局测试环境和工具函数
 */

import { logger } from '../services/pixelArt/errorHandler'

// 全局测试超时
jest.setTimeout(60000)

// 配置测试环境变量
process.env.NODE_ENV = 'test'
process.env.PORT = '0' // 使用随机端口
process.env.LOG_LEVEL = 'warn'

// 在测试开始前设置
beforeAll(async () => {
  console.log('🧪 开始测试套件初始化...')
  
  // 设置测试日志级别
  logger.setLogLevel(2) // WARN级别，减少测试输出噪音
  
  // 启用垃圾回收（如果可用）
  if (global.gc) {
    global.gc()
  }
  
  console.log('✅ 测试环境初始化完成')
})

// 在所有测试完成后清理
afterAll(async () => {
  console.log('🧹 开始测试环境清理...')
  
  // 最终垃圾回收
  if (global.gc) {
    global.gc()
  }
  
  // 恢复日志级别
  logger.setLogLevel(1) // INFO级别
  
  console.log('✅ 测试环境清理完成')
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的Promise拒绝:', reason)
  console.error('Promise:', promise)
})

process.on('uncaughtException', (error) => {
  console.error('🚨 未捕获的异常:', error)
})

// 扩展Jest匹配器
expect.extend({
  toBeValidBase64Image(received: string) {
    const pass = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(received)
    if (pass) {
      return {
        message: () => `期望 ${received} 不是有效的Base64图像`,
        pass: true,
      }
    } else {
      return {
        message: () => `期望 ${received} 是有效的Base64图像`,
        pass: false,
      }
    }
  },

  toBeValidHexColor(received: string) {
    const pass = /^#[0-9A-Fa-f]{6}$/.test(received)
    if (pass) {
      return {
        message: () => `期望 ${received} 不是有效的十六进制颜色`,
        pass: true,
      }
    } else {
      return {
        message: () => `期望 ${received} 是有效的十六进制颜色`,
        pass: false,
      }
    }
  },

  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max
    if (pass) {
      return {
        message: () => `期望 ${received} 不在范围 [${min}, ${max}] 内`,
        pass: true,
      }
    } else {
      return {
        message: () => `期望 ${received} 在范围 [${min}, ${max}] 内`,
        pass: false,
      }
    }
  },

  toHaveValidProcessingTime(received: number) {
    const pass = received > 0 && received < 60000 // 0ms到60s之间
    if (pass) {
      return {
        message: () => `期望 ${received}ms 不是有效的处理时间`,
        pass: true,
      }
    } else {
      return {
        message: () => `期望 ${received}ms 是有效的处理时间（0-60000ms）`,
        pass: false,
      }
    }
  }
})

// 声明自定义匹配器的类型
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBase64Image(): R
      toBeValidHexColor(): R
      toBeWithinRange(min: number, max: number): R
      toHaveValidProcessingTime(): R
    }
  }
}

// 测试工具函数
export class TestHelpers {
  /**
   * 等待指定时间
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 创建测试用的Base64图像
   */
  static createTestBase64Image(): string {
    const testData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    return `data:image/png;base64,${testData}`
  }

  /**
   * 验证API响应结构
   */
  static validatePixelArtResponse(response: any): void {
    expect(response.body).toHaveProperty('success')
    expect(response.body).toHaveProperty('data')
    
    if (response.body.success) {
      const data = response.body.data
      expect(data).toHaveProperty('pixelArtImage')
      expect(data).toHaveProperty('canvasInfo')
      expect(data).toHaveProperty('extractedColors')
      expect(data).toHaveProperty('processingTime')
      expect(data).toHaveProperty('requestId')
      
      // 验证画布信息
      expect(data.canvasInfo).toHaveProperty('width')
      expect(data.canvasInfo).toHaveProperty('height')
      expect(data.canvasInfo).toHaveProperty('coloredPixels')
      
      // 验证数据类型
      expect(typeof data.pixelArtImage).toBe('string')
      expect(Array.isArray(data.extractedColors)).toBe(true)
      expect(typeof data.processingTime).toBe('number')
      expect(typeof data.requestId).toBe('string')
    }
  }

  /**
   * 验证错误响应结构
   */
  static validateErrorResponse(response: any): void {
    expect(response.body).toHaveProperty('success', false)
    expect(response.body).toHaveProperty('error')
    expect(response.body).toHaveProperty('code')
    
    expect(typeof response.body.error).toBe('string')
    expect(typeof response.body.code).toBe('string')
    
    if (response.body.suggestions) {
      expect(Array.isArray(response.body.suggestions)).toBe(true)
    }
    
    if (response.body.requestId) {
      expect(typeof response.body.requestId).toBe('string')
    }
  }

  /**
   * 生成随机测试数据
   */
  static generateRandomTestData(size: number): Buffer {
    return Buffer.from(Array.from({ length: size }, () => Math.floor(Math.random() * 256)))
  }

  /**
   * 测量函数执行时间
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = process.hrtime.bigint()
    const result = await fn()
    const end = process.hrtime.bigint()
    const time = Number(end - start) / 1_000_000 // 转换为毫秒
    
    return { result, time }
  }

  /**
   * 获取当前内存使用情况
   */
  static getMemoryUsage(): { heapUsed: number; heapTotal: number; external: number } {
    const mem = process.memoryUsage()
    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024)
    }
  }

  /**
   * 检查是否存在内存泄漏
   */
  static async checkForMemoryLeaks(
    testFunction: () => Promise<void>,
    iterations: number = 5,
    thresholdMB: number = 50
  ): Promise<boolean> {
    const initialMemory = this.getMemoryUsage()
    
    for (let i = 0; i < iterations; i++) {
      await testFunction()
      
      if (global.gc) {
        global.gc()
      }
    }
    
    await this.sleep(1000) // 等待垃圾回收
    
    const finalMemory = this.getMemoryUsage()
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
    
    console.log(`内存检查结果: 初始${initialMemory.heapUsed}MB -> 最终${finalMemory.heapUsed}MB (增长${memoryIncrease}MB)`)
    
    return memoryIncrease < thresholdMB
  }
}

// 导出测试工具
export default TestHelpers


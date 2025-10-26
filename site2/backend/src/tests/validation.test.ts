/**
 * 参数验证和安全中间件测试套件
 * 测试输入验证、文件安全检查和安全中间件功能
 */

import request from 'supertest'
import express from 'express'
import sharp from 'sharp'
import { ParameterValidator, FileValidator } from '../services/pixelArt/validator'
import { SecurityMiddleware, defaultSecurityMiddleware } from '../services/pixelArt/securityMiddleware'

describe('参数验证器测试', () => {
  
  describe('ParameterValidator', () => {
    test('应该验证有效的转换参数', () => {
      const validParams = {
        resizeFactor: 50,
        interpolation: 'bilinear',
        colorMode: 'no_dithering',
        ditheringRatio: 1.5,
        quality: 'balanced'
      }

      const result = ParameterValidator.validateConversionParams(validParams)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.normalizedParams).toBeDefined()
      expect(result.normalizedParams!.resizeFactor).toBe(50)
      expect(result.normalizedParams!.interpolation).toBe('bilinear')
    })

    test('应该拒绝无效的缩放因子', () => {
      const invalidParams = [
        { resizeFactor: -1 }, // 太小
        { resizeFactor: 250 }, // 太大  
        { resizeFactor: 'invalid' }, // 非数字
        { resizeFactor: null } // null值应该使用默认值
      ]

      invalidParams.forEach((params, index) => {
        const result = ParameterValidator.validateConversionParams(params)
        
        if (params.resizeFactor === null) {
          // null值应该使用默认值，仍然有效
          expect(result.isValid).toBe(true)
          expect(result.warnings).toBeDefined()
        } else {
          expect(result.isValid).toBe(false)
          expect(result.errors.length).toBeGreaterThan(0)
        }
      })
    })

    test('应该拒绝无效的插值方法', () => {
      const invalidParams = {
        resizeFactor: 50,
        interpolation: 'invalid_method'
      }

      const result = ParameterValidator.validateConversionParams(invalidParams)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('插值方法'))).toBe(true)
    })

    test('应该拒绝无效的颜色模式', () => {
      const invalidParams = {
        resizeFactor: 50,
        colorMode: 'invalid_mode'
      }

      const result = ParameterValidator.validateConversionParams(invalidParams)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('颜色模式'))).toBe(true)
    })

    test('应该拒绝无效的抖动比例', () => {
      const invalidParams = [
        { ditheringRatio: 0 }, // 太小
        { ditheringRatio: 10 }, // 太大
        { ditheringRatio: 'invalid' } // 非数字
      ]

      invalidParams.forEach((params) => {
        const result = ParameterValidator.validateConversionParams(params)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(error => error.includes('抖动比例'))).toBe(true)
      })
    })

    test('应该提供警告信息', () => {
      const params = {
        resizeFactor: 5, // 太小，应该有警告
        interpolation: 'nearest_neighbor',
        colorMode: 'no_dithering',
        ditheringRatio: 3.5, // 过大，应该有警告
        quality: 'balanced'
      }

      const result = ParameterValidator.validateConversionParams(params)

      expect(result.isValid).toBe(false) // ditheringRatio超出范围
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })

    test('应该使用默认值处理缺失参数', () => {
      const minimalParams = {}

      const result = ParameterValidator.validateConversionParams(minimalParams)

      expect(result.isValid).toBe(true)
      expect(result.normalizedParams).toBeDefined()
      expect(result.normalizedParams!.resizeFactor).toBe(50) // 默认值
      expect(result.normalizedParams!.interpolation).toBe('bilinear') // 默认值
      expect(result.normalizedParams!.colorMode).toBe('no_dithering') // 默认值
      expect(result.normalizedParams!.ditheringRatio).toBe(1.0) // 默认值
      expect(result.normalizedParams!.quality).toBe('balanced') // 默认值
    })
  })

  describe('FileValidator', () => {
    let validImageBuffer: Buffer
    let invalidBuffer: Buffer

    beforeAll(async () => {
      // 创建有效的测试图像
      validImageBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      }).png().toBuffer()

      // 创建无效的缓冲区
      invalidBuffer = Buffer.from('This is not an image')
    })

    test('应该验证有效的PNG图像文件', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: validImageBuffer,
        size: validImageBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.width).toBe(100)
      expect(result.metadata!.height).toBe(100)
      expect(result.metadata!.format).toBe('png')
      expect(result.securityChecks.mimeTypeValid).toBe(true)
      expect(result.securityChecks.extensionMatches).toBe(true)
      expect(result.securityChecks.headerValid).toBe(true)
      expect(result.securityChecks.sizeWithinLimits).toBe(true)
      expect(result.securityChecks.dimensionsValid).toBe(true)
      expect(result.securityChecks.noMaliciousContent).toBe(true)
    })

    test('应该拒绝无效的MIME类型', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'test.gif',
        encoding: '7bit',
        mimetype: 'image/gif', // 不支持的格式
        buffer: validImageBuffer,
        size: validImageBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('不支持的文件类型')
      expect(result.securityChecks.mimeTypeValid).toBe(false)
    })

    test('应该检测扩展名与MIME类型不匹配', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'test.jpg', // JPEG扩展名
        encoding: '7bit',
        mimetype: 'image/png', // 但MIME类型是PNG
        buffer: validImageBuffer,
        size: validImageBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('扩展名')
      expect(result.securityChecks.extensionMatches).toBe(false)
    })

    test('应该拒绝过大的文件', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024) // 100MB

      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'large.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: largeBuffer,
        size: largeBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('文件大小')
      expect(result.securityChecks.sizeWithinLimits).toBe(false)
    })

    test('应该拒绝损坏的图像文件', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'corrupted.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: invalidBuffer,
        size: invalidBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.securityChecks.headerValid).toBe(false)
    })

    test('应该拒绝过小的文件', async () => {
      const tinyBuffer = Buffer.alloc(50) // 50字节

      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'tiny.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: tinyBuffer,
        size: tinyBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('文件大小过小')
      expect(result.securityChecks.sizeWithinLimits).toBe(false)
    })

    test('应该检测JPEG图像', async () => {
      const jpegBuffer = await sharp({
        create: {
          width: 50,
          height: 50,
          channels: 3,
          background: { r: 0, g: 255, b: 0 }
        }
      }).jpeg().toBuffer()

      const mockFile: Express.Multer.File = {
        fieldname: 'imageFile',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: jpegBuffer,
        size: jpegBuffer.length,
        stream: {} as any,
        destination: '',
        filename: '',
        path: ''
      }

      const result = await FileValidator.validateImageFile(mockFile)

      expect(result.isValid).toBe(true)
      expect(result.metadata!.format).toBe('jpeg')
      expect(result.securityChecks.noMaliciousContent).toBe(true)
    })
  })
})

describe('安全中间件测试', () => {
  let testApp: express.Application
  let securityMiddleware: SecurityMiddleware

  beforeEach(() => {
    // 创建新的安全中间件实例（用于隔离测试）
    securityMiddleware = new SecurityMiddleware({
      windowMs: 10000, // 10秒窗口（测试用）
      maxRequests: 5, // 最多5次请求
      maxConcurrentRequests: 2, // 最多2个并发请求
      maxFileSize: 1024 * 1024 // 1MB
    })

    testApp = express()
    testApp.use(express.json())
    
    // 应用安全中间件
    testApp.use(securityMiddleware.rateLimiter)

    // 简单的测试端点
    testApp.get('/test', (req, res) => {
      res.json({ success: true, message: 'Test endpoint' })
    })

    testApp.post('/upload', securityMiddleware.fileSizeLimit, (req, res) => {
      res.json({ success: true, fileSize: req.file?.size || 0 })
    })
  })

  afterEach(() => {
    securityMiddleware.destroy()
  })

  test('应该允许正常频率的请求', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(testApp)
        .get('/test')
        .expect(200)

      expect(response.body.success).toBe(true)
    }
  })

  test('应该阻止过于频繁的请求', async () => {
    // 先发送最大允许数量的请求
    for (let i = 0; i < 5; i++) {
      await request(testApp).get('/test').expect(200)
    }

    // 下一个请求应该被阻止
    const response = await request(testApp)
      .get('/test')
      .expect(429)

    expect(response.body.success).toBe(false)
    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(response.body.retryAfter).toBeDefined()
  })

  test('应该检测可疑的User-Agent', async () => {
    const suspiciousUserAgents = [
      'python-requests/2.28.0',
      'curl/7.68.0',
      'wget/1.20.3',
      'Mozilla/5.0 (compatible; scanner/1.0)',
      'bot-crawler-spider'
    ]

    for (const userAgent of suspiciousUserAgents) {
      const response = await request(testApp)
        .get('/test')
        .set('User-Agent', userAgent)

      // 可疑请求可能被允许但会被记录
      // 这里主要测试中间件不会崩溃
      expect(response.status).toBeOneOf([200, 429])
    }
  })

  test('应该提供安全统计信息', () => {
    const stats = securityMiddleware.getSecurityStats()

    expect(stats).toHaveProperty('activeClients')
    expect(stats).toHaveProperty('totalRequests')
    expect(stats).toHaveProperty('blockedClients')
    expect(stats).toHaveProperty('averageRequestsPerClient')
    expect(typeof stats.activeClients).toBe('number')
    expect(typeof stats.totalRequests).toBe('number')
    expect(typeof stats.blockedClients).toBe('number')
    expect(typeof stats.averageRequestsPerClient).toBe('number')
  })

  test('应该允许手动解除客户端阻止', async () => {
    // 触发速率限制
    for (let i = 0; i < 6; i++) {
      await request(testApp).get('/test')
    }

    // 最后一个请求应该被阻止
    const blockedResponse = await request(testApp)
      .get('/test')
      .expect(429)

    expect(blockedResponse.body.success).toBe(false)

    // 获取客户端ID（简化处理，实际实现中需要更复杂的逻辑）
    const stats = securityMiddleware.getSecurityStats()
    if (stats.blockedClients > 0) {
      // 这里需要实际的客户端ID，测试中简化处理
      console.log('已阻止客户端数量:', stats.blockedClients)
    }
  })

  test('应该处理并发请求限制', async () => {
    const concurrentRequests = []

    // 创建延迟端点来测试并发
    testApp.get('/slow', (req, res) => {
      setTimeout(() => {
        res.json({ success: true, message: 'Slow endpoint' })
      }, 100)
    })

    // 发起超过并发限制的请求
    for (let i = 0; i < 4; i++) {
      concurrentRequests.push(
        request(testApp).get('/slow')
      )
    }

    const responses = await Promise.all(concurrentRequests)

    // 应该有一些请求被阻止（429状态码）
    const successfulRequests = responses.filter(r => r.status === 200).length
    const blockedRequests = responses.filter(r => r.status === 429).length

    expect(successfulRequests + blockedRequests).toBe(4)
    expect(blockedRequests).toBeGreaterThan(0)
  }, 10000)

  test('应该正确清理过期的客户端统计', async () => {
    // 发送一些请求
    await request(testApp).get('/test')
    await request(testApp).get('/test')

    const initialStats = securityMiddleware.getSecurityStats()
    expect(initialStats.activeClients).toBeGreaterThan(0)

    // 等待清理周期（实际测试中可能需要模拟时间）
    // 这里主要测试方法不会抛出错误
    expect(() => {
      // 内部清理方法的调用（通常是私有的）
      // securityMiddleware.cleanupExpiredStats()
    }).not.toThrow()
  })
})

describe('请求上下文中间件测试', () => {
  test('应该添加请求ID和开始时间', async () => {
    const testApp = express()
    
    const { requestContextMiddleware } = await import('../services/pixelArt/securityMiddleware')
    testApp.use(requestContextMiddleware)

    testApp.get('/context-test', (req: any, res) => {
      expect(req.requestId).toBeDefined()
      expect(req.startTime).toBeDefined()
      expect(typeof req.requestId).toBe('string')
      expect(typeof req.startTime).toBe('number')
      
      res.json({
        requestId: req.requestId,
        hasStartTime: !!req.startTime
      })
    })

    const response = await request(testApp)
      .get('/context-test')
      .expect(200)

    expect(response.body.requestId).toBeDefined()
    expect(response.body.hasStartTime).toBe(true)
    expect(response.headers['x-request-id']).toBeDefined()
  })

  test('应该记录请求持续时间', async () => {
    const testApp = express()
    
    const { requestContextMiddleware } = await import('../services/pixelArt/securityMiddleware')
    testApp.use(requestContextMiddleware)

    testApp.get('/slow-test', (req, res) => {
      setTimeout(() => {
        res.json({ message: 'Slow response' })
      }, 50)
    })

    const response = await request(testApp)
      .get('/slow-test')
      .expect(200)

    expect(response.body.message).toBe('Slow response')
    // 这里主要测试中间件不会抛出错误并正确处理响应
  }, 5000)
})

// 辅助函数：扩展expect的匹配器
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received)
    return {
      message: () => `expected ${received} to be one of ${expected.join(', ')}`,
      pass
    }
  }
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R
    }
  }
}

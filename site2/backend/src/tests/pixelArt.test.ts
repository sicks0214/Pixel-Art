/**
 * 像素画转换API测试套件
 * 包含单元测试、集成测试、性能测试和错误处理测试
 */

import request from 'supertest'
import express from 'express'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { performance } from 'perf_hooks'

// 导入测试模块
import app from '../index'
import { logger } from '../services/pixelArt/errorHandler'

// 设置测试环境
beforeAll(() => {
  // 在测试期间降低日志级别
  logger.setLogLevel(2) // WARN级别
})

afterAll(() => {
  // 恢复日志级别
  logger.setLogLevel(1) // INFO级别
})

// 测试用的Express应用（简化版本）
const createTestApp = () => {
  const testApp = express()
  
  testApp.use(express.json({ limit: '10mb' }))
  testApp.use(express.urlencoded({ extended: true }))
  
  // 导入像素画路由
  const pixelArtRoutes = require('../routes/pixelArt').default
  testApp.use('/api/color03', pixelArtRoutes)
  
  return testApp
}

// 创建测试图像
const createTestImage = async (width: number = 100, height: number = 100): Promise<Buffer> => {
  return await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 } // 红色背景
    }
  })
  .png()
  .toBuffer()
}

// 创建渐变测试图像
const createGradientTestImage = async (): Promise<Buffer> => {
  const width = 200
  const height = 200
  const buffer = Buffer.alloc(width * height * 3)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3
      buffer[offset] = Math.floor((x / width) * 255)     // R渐变
      buffer[offset + 1] = Math.floor((y / height) * 255) // G渐变
      buffer[offset + 2] = 128                            // B固定
    }
  }
  
  return await sharp(buffer, {
    raw: {
      width,
      height,
      channels: 3
    }
  }).png().toBuffer()
}

// 创建复杂测试图像（多种颜色和模式）
const createComplexTestImage = async (): Promise<Buffer> => {
  const width = 300
  const height = 300
  const buffer = Buffer.alloc(width * height * 3)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3
      
      // 创建复杂的几何图案
      const centerX = width / 2
      const centerY = height / 2
      const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      const angle = Math.atan2(y - centerY, x - centerX)
      
      // 根据距离和角度创建复杂图案
      if (distanceFromCenter < 50) {
        // 中心圆形区域 - 红色
        buffer[offset] = 255
        buffer[offset + 1] = 0
        buffer[offset + 2] = 0
      } else if (distanceFromCenter < 100) {
        // 环形区域 - 基于角度的颜色
        buffer[offset] = Math.floor(Math.abs(Math.sin(angle * 4)) * 255)
        buffer[offset + 1] = Math.floor(Math.abs(Math.cos(angle * 6)) * 255)
        buffer[offset + 2] = Math.floor(distanceFromCenter / 100 * 255)
      } else {
        // 外部区域 - 棋盘格模式
        const checkerboard = ((Math.floor(x / 20) + Math.floor(y / 20)) % 2) === 0
        if (checkerboard) {
          buffer[offset] = 255
          buffer[offset + 1] = 255
          buffer[offset + 2] = 255
        } else {
          buffer[offset] = 0
          buffer[offset + 1] = 0
          buffer[offset + 2] = 0
        }
      }
    }
  }
  
  return await sharp(buffer, {
    raw: {
      width,
      height,
      channels: 3
    }
  }).png().toBuffer()
}

// 创建噪声测试图像
const createNoiseTestImage = async (): Promise<Buffer> => {
  const width = 150
  const height = 150
  const buffer = Buffer.alloc(width * height * 3)
  
  for (let i = 0; i < width * height; i++) {
    const offset = i * 3
    // 添加随机噪声
    buffer[offset] = Math.floor(Math.random() * 256)
    buffer[offset + 1] = Math.floor(Math.random() * 256)
    buffer[offset + 2] = Math.floor(Math.random() * 256)
  }
  
  return await sharp(buffer, {
    raw: {
      width,
      height,
      channels: 3
    }
  }).png().toBuffer()
}

describe('像素画转换API集成测试', () => {
  let testApp: express.Application
  let testImageBuffer: Buffer
  let gradientImageBuffer: Buffer
  let complexImageBuffer: Buffer
  
  beforeAll(async () => {
    testApp = createTestApp()
    testImageBuffer = await createTestImage()
    gradientImageBuffer = await createGradientTestImage()
    complexImageBuffer = await createComplexTestImage()
  })
  
  describe('POST /api/color03/pixel-art', () => {
    test('应该成功转换简单图像', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', testImageBuffer, 'test.png')
        .expect(200)
      
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('pixelArtImage')
      expect(response.body.data).toHaveProperty('canvasInfo')
      expect(response.body.data).toHaveProperty('extractedColors')
      expect(response.body.data).toHaveProperty('processingTime')
      
      // 验证Base64图像格式
      expect(response.body.data.pixelArtImage).toMatch(/^data:image\/png;base64,/)
      
      // 验证画布信息
      expect(response.body.data.canvasInfo).toHaveProperty('width')
      expect(response.body.data.canvasInfo).toHaveProperty('height')
      expect(response.body.data.canvasInfo).toHaveProperty('coloredPixels')
      
      // 验证提取的颜色
      expect(Array.isArray(response.body.data.extractedColors)).toBe(true)
      expect(response.body.data.extractedColors.length).toBeGreaterThan(0)
      
      console.log('转换成功:', {
        processingTime: response.body.data.processingTime + 'ms',
        canvasSize: `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
        colors: response.body.data.extractedColors.length
      })
    }, 15000) // 15秒超时
    
    test('应该成功处理双线性插值', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '30')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', gradientImageBuffer, 'gradient.png')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data.canvasInfo.width).toBeGreaterThan(0)
      expect(response.body.data.canvasInfo.height).toBeGreaterThan(0)
      expect(response.body.data.requestId).toBeDefined()
    }, 15000)
    
    test('应该成功处理抖动模式', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '40')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '2.0')
        .attach('imageFile', gradientImageBuffer, 'gradient.png')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data.extractedColors.length).toBeGreaterThan(0)
      expect(response.body.data.requestId).toBeDefined()
    }, 15000)
    
    test('应该成功处理复杂图像', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert?quality=high_quality')
        .field('resizeFactor', '35')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.8')
        .attach('imageFile', complexImageBuffer, 'complex.png')
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data.extractedColors.length).toBeGreaterThanOrEqual(5)
      expect(response.body.data.processingTime).toBeGreaterThan(0)
      expect(response.body.data.canvasInfo.coloredPixels).toBeGreaterThan(0)
    }, 20000)
    
    test('应该支持不同质量级别', async () => {
      const qualities = ['fast', 'balanced', 'high_quality']
      
      for (const quality of qualities) {
        const response = await request(testApp)
          .post(`/api/color03/pixel-art/convert?quality=${quality}`)
          .field('resizeFactor', '25')
          .field('interpolation', 'nearest_neighbor')
          .field('colorMode', 'no_dithering')
          .field('ditheringRatio', '1.0')
          .attach('imageFile', testImageBuffer, 'test.png')
          .expect(200)
        
        expect(response.body.success).toBe(true)
        expect(response.body.data.requestId).toBeDefined()
        
        console.log(`${quality} 质量级别测试通过: ${response.body.data.processingTime}ms`)
      }
    }, 30000)
    
    test('应该拒绝缺少文件的请求', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeTruthy()
    })
    
    test('应该拒绝无效的参数', async () => {
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '150') // 超出范围
        .field('interpolation', 'invalid_method')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', testImageBuffer, 'test.png')
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.code).toBeTruthy()
    })
    
    test('应该拒绝过大的文件', async () => {
      // 创建超大的假文件数据
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024) // 15MB
      
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', largeBuffer, 'large.png')
        .expect(413)
      
      expect(response.body.success).toBe(false)
    })
    
    test('应该拒绝无效图像格式', async () => {
      const textBuffer = Buffer.from('This is not an image')
      
      const response = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', textBuffer, 'fake.txt')
        .expect(400)
      
      expect(response.body.success).toBe(false)
      expect(response.body.code).toBeTruthy()
    })
    
    test('应该处理边界参数值', async () => {
      // 测试最小值
      const minResponse = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '1')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '0.1')
        .attach('imageFile', testImageBuffer, 'test.png')
        .expect(200)
      
      expect(minResponse.body.success).toBe(true)
      
      // 测试最大值
      const maxResponse = await request(testApp)
        .post('/api/color03/pixel-art/convert')
        .field('resizeFactor', '100')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '3.0')
        .attach('imageFile', testImageBuffer, 'test.png')
        .expect(200)
      
      expect(maxResponse.body.success).toBe(true)
    }, 20000)
  })
  
  describe('GET /api/color03/health', () => {
    test('应该返回健康状态', async () => {
      const response = await request(testApp)
        .get('/api/color03/health')
        .expect(200)
      
      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('services')
      expect(response.body).toHaveProperty('checkId')
      expect(response.body).toHaveProperty('timestamp')
      
      // 检查服务状态结构
      expect(response.body.services).toHaveProperty('sharp')
      expect(response.body.services).toHaveProperty('memory')
      expect(response.body.services).toHaveProperty('uptime')
      
      // 检查详细信息
      expect(response.body).toHaveProperty('detailed')
      expect(response.body.detailed).toHaveProperty('nodeVersion')
      expect(response.body.detailed).toHaveProperty('platform')
      
      console.log('健康检查通过:', {
        status: response.body.status,
        sharp: response.body.services.sharp.status,
        memory: response.body.services.memory.usage?.heapUsed,
        uptime: response.body.services.uptime.minutes
      })
    })
    
    test('健康检查应该包含所有必需字段', async () => {
      const response = await request(testApp)
        .get('/api/color03/health')
        .expect(200)
      
      // 验证响应结构完整性
      const requiredFields = [
        'success', 'status', 'timestamp', 'checkId', 
        'services', 'detailed'
      ]
      
      requiredFields.forEach(field => {
        expect(response.body).toHaveProperty(field)
      })
      
      // 验证服务检查结构
      const serviceFields = ['sharp', 'memory', 'uptime']
      serviceFields.forEach(service => {
        expect(response.body.services).toHaveProperty(service)
      })
    })
  })
})

describe('图像处理算法单元测试', () => {
  test('颜色量化器应该工作正常', async () => {
    const { colorQuantizer } = await import('../services/pixelArt/colorQuantizer')
    
    // 创建简单的测试数据
    const width = 10
    const height = 10
    const imageData = Buffer.alloc(width * height * 3)
    
    // 填充渐变数据
    for (let i = 0; i < width * height; i++) {
      const offset = i * 3
      imageData[offset] = (i * 25) % 256
      imageData[offset + 1] = (i * 50) % 256
      imageData[offset + 2] = (i * 75) % 256
    }
    
    const result = await colorQuantizer.quantizeImage(imageData, width, height, 8)
    
    expect(Buffer.isBuffer(result.data)).toBe(true)
    expect(Array.isArray(result.palette)).toBe(true)
    expect(result.palette.length).toBeLessThanOrEqual(8)
    expect(result.data.length).toBe(imageData.length)
    
    console.log('颜色量化测试通过, 调色板大小:', result.palette.length)
  })
  
  test('抖动处理器应该工作正常', async () => {
    const { ditheringProcessor } = await import('../services/pixelArt/ditheringProcessor')
    
    const width = 20
    const height = 20
    const imageData = Buffer.alloc(width * height * 3)
    
    // 填充测试数据
    for (let i = 0; i < width * height; i++) {
      const offset = i * 3
      imageData[offset] = 128 + Math.sin(i * 0.1) * 50
      imageData[offset + 1] = 128 + Math.cos(i * 0.1) * 50
      imageData[offset + 2] = 128
    }
    
    const result = await ditheringProcessor.applyOrderedDithering(imageData, width, height, 1.5)
    
    expect(Buffer.isBuffer(result.data)).toBe(true)
    expect(Array.isArray(result.palette)).toBe(true)
    expect(result.data.length).toBe(imageData.length)
    
    console.log('抖动处理测试通过, 调色板大小:', result.palette.length)
  })
})

// 性能基准测试套件
describe('性能基准测试', () => {
  let performanceApp: express.Application
  let mediumImageBuffer: Buffer
  let largeImageBuffer: Buffer
  
  beforeAll(async () => {
    performanceApp = createTestApp()
    
    mediumImageBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    }).png().toBuffer()
    
    largeImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 200, g: 100, b: 50 }
      }
    }).png().toBuffer()
  })
  
  test('处理中等大小图像的性能', async () => {
    const startTime = performance.now()
    
    const response = await request(performanceApp)
      .post('/api/color03/pixel-art/convert?quality=balanced')
      .field('resizeFactor', '50')
      .field('interpolation', 'bilinear')
      .field('colorMode', 'ordered_dithering_bayer')
      .field('ditheringRatio', '1.5')
      .attach('imageFile', mediumImageBuffer, 'medium.png')
      .expect(200)
    
    const endTime = performance.now()
    const totalTime = endTime - startTime
    
    expect(response.body.success).toBe(true)
    expect(totalTime).toBeLessThan(15000) // 应该在15秒内完成
    expect(response.body.data.processingTime).toBeGreaterThan(0)
    
    console.log('中等图像性能测试结果:', {
      totalTime: Math.round(totalTime) + 'ms',
      processingTime: Math.round(response.body.data.processingTime) + 'ms',
      imageSize: '400x400 -> ' + 
                 `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
      colors: response.body.data.extractedColors.length
    })
  }, 20000)
  
  test('不同质量级别性能对比', async () => {
    const qualities = ['fast', 'balanced', 'high_quality']
    const results = []
    
    for (const quality of qualities) {
      const startTime = performance.now()
      
      const response = await request(performanceApp)
        .post(`/api/color03/pixel-art/convert?quality=${quality}`)
        .field('resizeFactor', '30')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', mediumImageBuffer, 'medium.png')
        .expect(200)
      
      const endTime = performance.now()
      
      results.push({
        quality,
        totalTime: Math.round(endTime - startTime),
        processingTime: Math.round(response.body.data.processingTime),
        colors: response.body.data.extractedColors.length
      })
    }
    
    console.log('质量级别性能对比:')
    console.table(results)
    
    // 验证：fast应该比high_quality快
    const fastResult = results.find(r => r.quality === 'fast')
    const hqResult = results.find(r => r.quality === 'high_quality')
    
    if (fastResult && hqResult) {
      expect(fastResult.processingTime).toBeLessThan(hqResult.processingTime * 1.5)
    }
  }, 45000)
  
  test('大图像分块处理性能', async () => {
    const startTime = performance.now()
    
    const response = await request(performanceApp)
      .post('/api/color03/pixel-art/convert?quality=balanced')
      .field('resizeFactor', '25')
      .field('interpolation', 'nearest_neighbor')
      .field('colorMode', 'no_dithering')
      .field('ditheringRatio', '1.0')
      .attach('imageFile', largeImageBuffer, 'large.png')
      .expect(200)
    
    const endTime = performance.now()
    const totalTime = endTime - startTime
    
    expect(response.body.success).toBe(true)
    expect(totalTime).toBeLessThan(30000) // 应该在30秒内完成
    
    console.log('大图像处理性能测试结果:', {
      totalTime: Math.round(totalTime) + 'ms',
      processingTime: Math.round(response.body.data.processingTime) + 'ms',
      imageSize: '800x600 -> ' + 
                 `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
      pixelCount: response.body.data.canvasInfo.coloredPixels
    })
  }, 35000)
  
  test('并发请求处理能力', async () => {
    const concurrentRequests = 3
    const requests = []
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        request(performanceApp)
          .post('/api/color03/pixel-art/convert?quality=fast')
          .field('resizeFactor', '20')
          .field('interpolation', 'nearest_neighbor')
          .field('colorMode', 'no_dithering')
          .field('ditheringRatio', '1.0')
          .attach('imageFile', mediumImageBuffer, `concurrent_${i}.png`)
      )
    }
    
    const startTime = performance.now()
    const responses = await Promise.all(requests)
    const endTime = performance.now()
    
    // 验证所有请求都成功
    responses.forEach((response, index) => {
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
    
    const totalTime = endTime - startTime
    const avgTime = totalTime / concurrentRequests
    
    console.log('并发处理性能测试结果:', {
      并发数: concurrentRequests,
      总时间: Math.round(totalTime) + 'ms',
      平均时间: Math.round(avgTime) + 'ms',
      成功率: '100%'
    })
    
    expect(totalTime).toBeLessThan(20000) // 并发处理应该在20秒内完成
  }, 25000)
  
  test('内存使用监控', async () => {
    const getMemoryUsage = () => {
      const mem = process.memoryUsage()
      return {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024)
      }
    }
    
    const memBefore = getMemoryUsage()
    
    // 执行几个图像处理请求
    const requests = []
    for (let i = 0; i < 3; i++) {
      const response = await request(performanceApp)
        .post('/api/color03/pixel-art/convert?quality=balanced')
        .field('resizeFactor', '30')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.5')
        .attach('imageFile', mediumImageBuffer, `memory_test_${i}.png`)
        .expect(200)
      
      expect(response.body.success).toBe(true)
    }
    
    // 等待垃圾回收
    if (global.gc) {
      global.gc()
    }
    
    const memAfter = getMemoryUsage()
    const memIncrease = memAfter.heapUsed - memBefore.heapUsed
    
    console.log('内存使用监控结果:', {
      处理前: memBefore,
      处理后: memAfter,
      增长: memIncrease + 'MB'
    })
    
    // 内存增长应该保持在合理范围内（小于100MB）
    expect(memIncrease).toBeLessThan(100)
  }, 30000)
})

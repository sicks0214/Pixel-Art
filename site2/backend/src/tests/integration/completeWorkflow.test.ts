/**
 * 完整工作流集成测试
 * 测试所有组件协同工作的端到端场景
 */

import request from 'supertest'
import express from 'express'
import sharp from 'sharp'
import { performance } from 'perf_hooks'
import { globalMetricsCollector } from '../services/pixelArt/metricsCollector'
import { globalSystemMonitor } from '../services/pixelArt/systemMonitor'
import { getGlobalWorkerPool, shutdownGlobalWorkerPool } from '../services/pixelArt/workerPool'
import { logger } from '../services/pixelArt/errorHandler'

describe('完整工作流集成测试', () => {
  let testApp: express.Application
  let testImages: {
    small: Buffer
    medium: Buffer
    large: Buffer
    complex: Buffer
  }

  beforeAll(async () => {
    // 初始化测试应用
    testApp = await createIntegratedTestApp()
    
    // 创建不同尺寸和复杂度的测试图像
    testImages = {
      small: await createTestImage(100, 100, 'simple'),
      medium: await createTestImage(300, 300, 'gradient'),
      large: await createTestImage(800, 600, 'complex'),
      complex: await createTestImage(400, 400, 'pattern')
    }

    // 启动系统监控
    if (!globalSystemMonitor['isMonitoring']) {
      globalSystemMonitor.start()
    }

    logger.info('CompleteWorkflowTest', '集成测试环境初始化完成')
  }, 30000)

  afterAll(async () => {
    // 清理资源
    globalSystemMonitor.stop()
    await shutdownGlobalWorkerPool()
    globalMetricsCollector.destroy()
    
    logger.info('CompleteWorkflowTest', '集成测试环境清理完成')
  }, 10000)

  test('端到端工作流测试 - 完整流程', async () => {
    const startTime = performance.now()
    
    // 1. 发送转换请求
    const response = await request(testApp)
      .post('/api/pixel-art/convert')
      .field('resizeFactor', '40')
      .field('interpolation', 'bilinear')
      .field('colorMode', 'ordered_dithering_bayer')
      .field('ditheringRatio', '1.5')
      .query({ quality: 'balanced' })
      .attach('imageFile', testImages.medium, 'test-medium.png')
      .expect(200)

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // 验证响应结构
    expect(response.body.success).toBe(true)
    expect(response.body.data).toBeDefined()
    expect(response.body.data.pixelArtImage).toMatch(/^data:image\/png;base64,/)
    expect(response.body.data.canvasInfo).toBeDefined()
    expect(response.body.data.extractedColors).toBeDefined()
    expect(response.body.data.processingTime).toBeGreaterThan(0)
    expect(response.body.data.requestId).toBeDefined()

    // 2. 检查指标收集器状态
    const metricsStats = globalMetricsCollector.getAggregatedStats()
    expect(metricsStats.totalRequests).toBeGreaterThan(0)

    // 3. 检查系统健康状态
    const healthStatus = await globalSystemMonitor.performHealthCheck()
    expect(['healthy', 'warning', 'critical'].includes(healthStatus.overall)).toBe(true)

    // 4. 检查Worker线程池状态（如果启用）
    try {
      const workerPool = getGlobalWorkerPool()
      const workerStatus = workerPool.getStatus()
      expect(typeof workerStatus.totalWorkers).toBe('number')
    } catch (error) {
      // Worker线程池可能未启用，这是正常的
    }

    console.log('端到端工作流测试完成:', {
      总处理时间: Math.round(totalTime) + 'ms',
      服务器处理时间: response.body.data.processingTime + 'ms',
      输出尺寸: `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
      提取颜色数: response.body.data.extractedColors.length,
      系统状态: healthStatus.overall,
      指标统计: {
        总请求: metricsStats.totalRequests,
        成功率: metricsStats.successRate?.toFixed(1) + '%'
      }
    })

    // 性能验证
    expect(totalTime).toBeLessThan(15000) // 15秒内完成
    expect(response.body.data.processingTime).toBeLessThan(10000) // 服务器处理10秒内
  }, 20000)

  test('多质量级别工作流测试', async () => {
    const qualities = ['fast', 'balanced', 'high_quality']
    const results = []

    for (const quality of qualities) {
      const startTime = performance.now()
      
      const response = await request(testApp)
        .post('/api/pixel-art/convert')
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .query({ quality })
        .attach('imageFile', testImages.small, `test-${quality}.png`)
        .expect(200)

      const endTime = performance.now()
      
      results.push({
        quality,
        totalTime: Math.round(endTime - startTime),
        processingTime: response.body.data.processingTime,
        outputColors: response.body.data.extractedColors.length,
        canvasSize: `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
        success: response.body.success
      })

      expect(response.body.success).toBe(true)
    }

    console.log('多质量级别测试结果:')
    console.table(results)

    // 验证性能趋势
    const fastResult = results.find(r => r.quality === 'fast')!
    const balancedResult = results.find(r => r.quality === 'balanced')!
    const hqResult = results.find(r => r.quality === 'high_quality')!

    expect(fastResult.processingTime).toBeLessThanOrEqual(balancedResult.processingTime * 1.2)
    expect(balancedResult.processingTime).toBeLessThanOrEqual(hqResult.processingTime * 1.3)
  }, 30000)

  test('并发请求处理工作流', async () => {
    const concurrentCount = 5
    const requests = []

    // 创建并发请求
    for (let i = 0; i < concurrentCount; i++) {
      requests.push(
        request(testApp)
          .post('/api/pixel-art/convert')
          .field('resizeFactor', '30')
          .field('interpolation', 'bilinear')
          .field('colorMode', 'ordered_dithering_bayer')
          .field('ditheringRatio', '1.2')
          .query({ quality: 'fast' })
          .attach('imageFile', testImages.small, `concurrent-${i}.png`)
      )
    }

    const startTime = performance.now()
    const responses = await Promise.all(requests)
    const endTime = performance.now()

    // 验证所有请求成功
    responses.forEach((response, index) => {
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.requestId).toBeDefined()
    })

    const totalTime = endTime - startTime
    const avgTime = totalTime / concurrentCount

    console.log('并发处理测试结果:', {
      并发请求数: concurrentCount,
      总处理时间: Math.round(totalTime) + 'ms',
      平均时间: Math.round(avgTime) + 'ms',
      成功请求数: responses.filter(r => r.status === 200).length
    })

    // 检查系统负载影响
    const healthStatus = await globalSystemMonitor.performHealthCheck()
    console.log('并发处理后系统状态:', {
      整体状态: healthStatus.overall,
      内存使用: Math.round(healthStatus.metrics.memory?.usagePercent || 0) + '%',
      活跃告警: healthStatus.alerts.filter(a => !a.resolved).length
    })

    expect(totalTime).toBeLessThan(20000) // 20秒内完成
  }, 25000)

  test('错误处理工作流测试', async () => {
    const errorScenarios = [
      {
        name: '无效文件格式',
        fileBuffer: Buffer.from('This is not an image'),
        fileName: 'invalid.txt',
        expectedStatus: 400,
        expectedCode: /INVALID|FORMAT|FILE/
      },
      {
        name: '无效参数',
        fileBuffer: testImages.small,
        fileName: 'test.png',
        fields: { resizeFactor: '250' }, // 超出范围
        expectedStatus: 400,
        expectedCode: /VALIDATION/
      },
      {
        name: '过大文件',
        fileBuffer: Buffer.alloc(20 * 1024 * 1024), // 20MB
        fileName: 'large.png',
        expectedStatus: 413,
        expectedCode: /FILE_TOO_LARGE|LARGE/
      }
    ]

    for (const scenario of errorScenarios) {
      const requestBuilder = request(testApp)
        .post('/api/pixel-art/convert')

      // 设置字段
      if (scenario.fields) {
        Object.entries(scenario.fields).forEach(([key, value]) => {
          requestBuilder.field(key, value)
        })
      } else {
        // 默认有效参数
        requestBuilder
          .field('resizeFactor', '50')
          .field('interpolation', 'bilinear')
          .field('colorMode', 'no_dithering')
          .field('ditheringRatio', '1.0')
      }

      const response = await requestBuilder
        .attach('imageFile', scenario.fileBuffer, scenario.fileName)
        .expect(scenario.expectedStatus)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBeDefined()
      
      if (scenario.expectedCode) {
        expect(response.body.code).toMatch(scenario.expectedCode)
      }

      console.log(`错误场景 "${scenario.name}" 测试通过:`, {
        状态码: response.status,
        错误代码: response.body.code,
        错误消息: response.body.error
      })
    }

    // 检查错误是否被正确记录到指标中
    const metricsStats = globalMetricsCollector.getAggregatedStats()
    const errorCount = Object.values(metricsStats.errorDistribution || {})
      .reduce((sum: number, count: number) => sum + count, 0)

    console.log('错误处理工作流测试完成:', {
      测试场景数: errorScenarios.length,
      记录的错误数: errorCount,
      错误分布: metricsStats.errorDistribution
    })
  }, 15000)

  test('性能监控工作流测试', async () => {
    // 执行一系列操作来生成监控数据
    const operations = [
      { image: testImages.small, quality: 'fast' },
      { image: testImages.medium, quality: 'balanced' },
      { image: testImages.large, quality: 'high_quality' }
    ]

    for (const [index, operation] of operations.entries()) {
      await request(testApp)
        .post('/api/pixel-art/convert')
        .field('resizeFactor', '40')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.0')
        .query({ quality: operation.quality })
        .attach('imageFile', operation.image, `monitor-test-${index}.png`)
        .expect(200)
    }

    // 检查指标收集
    const aggregatedStats = globalMetricsCollector.getAggregatedStats()
    const realtimeStats = globalMetricsCollector.getRealtimeStats()

    expect(aggregatedStats.totalRequests).toBeGreaterThan(0)
    expect(aggregatedStats.successRate).toBeGreaterThan(0)
    expect(realtimeStats.activeRequests).toBeGreaterThanOrEqual(0)

    // 检查系统健康监控
    const healthStatus = await globalSystemMonitor.performHealthCheck()
    expect(healthStatus.components).toBeDefined()
    expect(healthStatus.metrics).toBeDefined()

    // 检查告警历史
    const alertHistory = globalSystemMonitor.getAlertHistory(5)
    expect(Array.isArray(alertHistory)).toBe(true)

    // 获取状态摘要
    const statusSummary = await globalSystemMonitor.getStatusSummary()
    expect(statusSummary.status).toBeDefined()
    expect(statusSummary.uptime).toBeDefined()
    expect(statusSummary.memoryUsage).toBeDefined()

    console.log('性能监控工作流测试结果:', {
      指标统计: {
        总请求: aggregatedStats.totalRequests,
        成功率: aggregatedStats.successRate?.toFixed(1) + '%',
        平均处理时间: Math.round(aggregatedStats.averageProcessingTime) + 'ms',
        性能趋势: realtimeStats.performanceTrend
      },
      系统健康: {
        整体状态: healthStatus.overall,
        组件状态: Object.fromEntries(
          Object.entries(healthStatus.components)
            .map(([name, comp]) => [name, comp.status])
        ),
        活跃告警: healthStatus.alerts.filter(a => !a.resolved).length
      },
      状态摘要: statusSummary
    })
  }, 20000)

  test('资源清理和恢复测试', async () => {
    // 记录初始状态
    const initialStats = globalMetricsCollector.getRealtimeStats()
    const initialHealth = await globalSystemMonitor.performHealthCheck()

    // 执行一些资源密集型操作
    const heavyOperations = []
    for (let i = 0; i < 3; i++) {
      heavyOperations.push(
        request(testApp)
          .post('/api/pixel-art/convert')
          .field('resizeFactor', '60')
          .field('interpolation', 'bilinear')
          .field('colorMode', 'ordered_dithering_bayer')
          .field('ditheringRatio', '2.0')
          .query({ quality: 'high_quality' })
          .attach('imageFile', testImages.large, `heavy-${i}.png`)
          .expect(200)
      )
    }

    await Promise.all(heavyOperations)

    // 等待系统稳定
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 检查恢复状态
    const finalStats = globalMetricsCollector.getRealtimeStats()
    const finalHealth = await globalSystemMonitor.performHealthCheck()

    // 验证系统恢复
    expect(finalStats.activeRequests).toBe(0) // 所有请求应该完成
    expect(['healthy', 'warning'].includes(finalHealth.overall)).toBe(true) // 系统应该健康或警告状态

    console.log('资源清理和恢复测试结果:', {
      初始状态: {
        活跃请求: initialStats.activeRequests,
        系统状态: initialHealth.overall,
        内存使用: Math.round(initialHealth.metrics.memory?.usagePercent || 0) + '%'
      },
      最终状态: {
        活跃请求: finalStats.activeRequests,
        系统状态: finalHealth.overall,
        内存使用: Math.round(finalHealth.metrics.memory?.usagePercent || 0) + '%'
      }
    })
  }, 25000)

  test('健康检查端点集成测试', async () => {
    const response = await request(testApp)
      .get('/api/pixel-art/health')
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.status).toBeDefined()
    expect(response.body.services).toBeDefined()
    expect(response.body.checkId).toBeDefined()
    expect(response.body.timestamp).toBeDefined()

    // 验证服务状态结构
    expect(response.body.services.sharp).toBeDefined()
    expect(response.body.services.memory).toBeDefined()
    expect(response.body.services.uptime).toBeDefined()

    // 验证详细信息
    expect(response.body.detailed).toBeDefined()
    expect(response.body.detailed.nodeVersion).toBeDefined()
    expect(response.body.detailed.platform).toBeDefined()

    console.log('健康检查端点测试通过:', {
      状态: response.body.status,
      Sharp状态: response.body.services.sharp.status,
      内存状态: response.body.services.memory.status,
      系统信息: {
        Node版本: response.body.detailed.nodeVersion,
        平台: response.body.detailed.platform,
        架构: response.body.detailed.arch
      }
    })
  })
})

// 辅助函数：创建集成测试应用
async function createIntegratedTestApp(): Promise<express.Application> {
  const app = express()

  // 基本中间件
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // 导入安全中间件
  const { requestContextMiddleware, pixelArtSecurityMiddleware } = 
    await import('../services/pixelArt/securityMiddleware')
  
  app.use(requestContextMiddleware)
  app.use(pixelArtSecurityMiddleware)

  // 导入像素画路由
  const pixelArtRoutes = await import('../routes/pixelArt')
  app.use('/api/pixel-art', pixelArtRoutes.default)

  return app
}

// 辅助函数：创建测试图像
async function createTestImage(
  width: number, 
  height: number, 
  type: 'simple' | 'gradient' | 'complex' | 'pattern'
): Promise<Buffer> {
  const buffer = Buffer.alloc(width * height * 3)

  switch (type) {
    case 'simple':
      // 纯红色图像
      for (let i = 0; i < width * height; i++) {
        const offset = i * 3
        buffer[offset] = 255
        buffer[offset + 1] = 0
        buffer[offset + 2] = 0
      }
      break

    case 'gradient':
      // 渐变图像
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 3
          buffer[offset] = Math.floor((x / width) * 255)
          buffer[offset + 1] = Math.floor((y / height) * 255)
          buffer[offset + 2] = 128
        }
      }
      break

    case 'complex':
      // 复杂图案
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 3
          const centerX = width / 2
          const centerY = height / 2
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
          const angle = Math.atan2(y - centerY, x - centerX)
          
          buffer[offset] = Math.floor(Math.abs(Math.sin(angle * 4)) * 255)
          buffer[offset + 1] = Math.floor(Math.abs(Math.cos(angle * 6)) * 255)
          buffer[offset + 2] = Math.floor((distance / Math.max(width, height)) * 255)
        }
      }
      break

    case 'pattern':
      // 棋盘格图案
      const blockSize = Math.max(10, Math.floor(width / 20))
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 3
          const isWhite = ((Math.floor(x / blockSize) + Math.floor(y / blockSize)) % 2) === 0
          const value = isWhite ? 255 : 0
          
          buffer[offset] = value
          buffer[offset + 1] = value  
          buffer[offset + 2] = value
        }
      }
      break
  }

  return await sharp(buffer, {
    raw: {
      width,
      height,
      channels: 3
    }
  }).png().toBuffer()
}

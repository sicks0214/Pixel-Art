/**
 * 性能和监控组件测试套件
 * 测试Worker线程池、指标收集器、系统监控器和性能优化器
 */

import { performance } from 'perf_hooks'
import sharp from 'sharp'
import { WorkerPool } from '../services/pixelArt/workerPool'
import { MetricsCollector } from '../services/pixelArt/metricsCollector'
import { SystemMonitor } from '../services/pixelArt/systemMonitor'
import { PerformanceOptimizer } from '../services/pixelArt/performanceOptimizer'

describe('Worker线程池测试', () => {
  let workerPool: WorkerPool

  beforeEach(() => {
    workerPool = new WorkerPool({
      maxWorkers: 2,
      minWorkers: 1,
      idleTimeout: 5000,
      taskTimeout: 10000
    })
  })

  afterEach(async () => {
    await workerPool.shutdown()
  })

  test('应该正确初始化Worker线程池', async () => {
    const status = workerPool.getStatus()
    
    expect(status.totalWorkers).toBeGreaterThanOrEqual(1)
    expect(status.busyWorkers).toBe(0)
    expect(status.queuedTasks).toBe(0)
    expect(Array.isArray(status.workerStats)).toBe(true)
  })

  test('应该成功执行图像缩放任务', async () => {
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).raw().toBuffer()

    const task = {
      id: 'resize_test_' + Date.now(),
      type: 'resize' as const,
      data: {
        imageBuffer: testImageBuffer,
        width: 50,
        height: 50,
        interpolation: 'nearest_neighbor'
      },
      priority: 'normal' as const
    }

    const startTime = performance.now()
    const result = await workerPool.executeTask(task)
    const endTime = performance.now()

    expect(result).toBeDefined()
    expect(result.width).toBe(50)
    expect(result.height).toBe(50)
    expect(Buffer.isBuffer(result.data)).toBe(true)
    expect(endTime - startTime).toBeLessThan(5000) // 应该在5秒内完成

    console.log('Worker图像缩放测试通过:', {
      原始尺寸: '100x100',
      目标尺寸: '50x50',
      实际尺寸: `${result.width}x${result.height}`,
      处理时间: Math.round(endTime - startTime) + 'ms'
    })
  }, 15000)

  test('应该成功执行颜色量化任务', async () => {
    const width = 20
    const height = 20
    const imageData = Buffer.alloc(width * height * 3)
    
    // 创建渐变测试数据
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 3
        imageData[offset] = Math.floor((x / width) * 255)
        imageData[offset + 1] = Math.floor((y / height) * 255)
        imageData[offset + 2] = 128
      }
    }

    const task = {
      id: 'quantize_test_' + Date.now(),
      type: 'quantize' as const,
      data: {
        imageData,
        width,
        height,
        maxColors: 8
      },
      priority: 'normal' as const
    }

    const result = await workerPool.executeTask(task)

    expect(result).toBeDefined()
    expect(Buffer.isBuffer(result.data)).toBe(true)
    expect(Array.isArray(result.palette)).toBe(true)
    expect(result.palette.length).toBeLessThanOrEqual(8)
    expect(result.data.length).toBe(imageData.length)

    console.log('Worker颜色量化测试通过:', {
      图像尺寸: `${width}x${height}`,
      原始数据大小: imageData.length + '字节',
      量化后调色板: result.palette.length + '种颜色'
    })
  }, 10000)

  test('应该成功执行抖动任务', async () => {
    const width = 30
    const height = 30
    const imageData = Buffer.alloc(width * height * 3)
    
    // 创建测试模式
    for (let i = 0; i < width * height; i++) {
      const offset = i * 3
      imageData[offset] = 128 + Math.sin(i * 0.1) * 100
      imageData[offset + 1] = 128 + Math.cos(i * 0.1) * 100
      imageData[offset + 2] = 128
    }

    const task = {
      id: 'dither_test_' + Date.now(),
      type: 'dither' as const,
      data: {
        imageData,
        width,
        height,
        ditheringRatio: 1.5
      },
      priority: 'normal' as const
    }

    const result = await workerPool.executeTask(task)

    expect(result).toBeDefined()
    expect(Buffer.isBuffer(result.data)).toBe(true)
    expect(Array.isArray(result.palette)).toBe(true)
    expect(result.data.length).toBe(imageData.length)

    console.log('Worker抖动处理测试通过:', {
      图像尺寸: `${width}x${height}`,
      抖动比例: 1.5,
      生成调色板: result.palette.length + '种颜色'
    })
  }, 10000)

  test('应该正确处理任务队列和优先级', async () => {
    const tasks = [
      {
        id: 'low_priority_' + Date.now(),
        type: 'quantize' as const,
        data: { 
          imageData: Buffer.alloc(100), 
          width: 10, 
          height: 10, 
          maxColors: 4 
        },
        priority: 'low' as const
      },
      {
        id: 'high_priority_' + Date.now(),
        type: 'quantize' as const,
        data: { 
          imageData: Buffer.alloc(100), 
          width: 10, 
          height: 10, 
          maxColors: 4 
        },
        priority: 'high' as const
      },
      {
        id: 'normal_priority_' + Date.now(),
        type: 'quantize' as const,
        data: { 
          imageData: Buffer.alloc(100), 
          width: 10, 
          height: 10, 
          maxColors: 4 
        },
        priority: 'normal' as const
      }
    ]

    const promises = tasks.map(task => workerPool.executeTask(task))
    const results = await Promise.all(promises)

    expect(results).toHaveLength(3)
    results.forEach(result => {
      expect(result).toBeDefined()
    })

    console.log('Worker任务队列和优先级测试通过')
  }, 15000)

  test('应该正确处理并发任务', async () => {
    const concurrentTasks = 4
    const tasks = []

    for (let i = 0; i < concurrentTasks; i++) {
      tasks.push({
        id: `concurrent_${i}_${Date.now()}`,
        type: 'quantize' as const,
        data: {
          imageData: Buffer.alloc(300), // 10x10x3
          width: 10,
          height: 10,
          maxColors: 4
        },
        priority: 'normal' as const
      })
    }

    const startTime = performance.now()
    const promises = tasks.map(task => workerPool.executeTask(task))
    const results = await Promise.all(promises)
    const endTime = performance.now()

    expect(results).toHaveLength(concurrentTasks)
    results.forEach(result => {
      expect(result).toBeDefined()
      expect(Buffer.isBuffer(result.data)).toBe(true)
    })

    console.log('Worker并发处理测试通过:', {
      并发任务数: concurrentTasks,
      总处理时间: Math.round(endTime - startTime) + 'ms',
      平均时间: Math.round((endTime - startTime) / concurrentTasks) + 'ms'
    })
  }, 20000)

  test('应该正确处理任务超时', async () => {
    // 创建一个会超时的任务（通过提供一个不存在的任务类型来模拟）
    const task = {
      id: 'timeout_test_' + Date.now(),
      type: 'nonexistent_task' as any,
      data: {},
      priority: 'normal' as const,
      timeout: 1000 // 1秒超时
    }

    await expect(workerPool.executeTask(task)).rejects.toThrow()
    
    console.log('Worker任务超时测试通过')
  }, 5000)

  test('应该提供详细的状态信息', () => {
    const status = workerPool.getStatus()

    expect(status).toHaveProperty('totalWorkers')
    expect(status).toHaveProperty('busyWorkers')
    expect(status).toHaveProperty('queuedTasks')
    expect(status).toHaveProperty('workerStats')
    
    expect(typeof status.totalWorkers).toBe('number')
    expect(typeof status.busyWorkers).toBe('number')
    expect(typeof status.queuedTasks).toBe('number')
    expect(Array.isArray(status.workerStats)).toBe(true)

    status.workerStats.forEach(stat => {
      expect(stat).toHaveProperty('id')
      expect(stat).toHaveProperty('busy')
      expect(stat).toHaveProperty('tasksCompleted')
      expect(stat).toHaveProperty('errors')
      expect(stat).toHaveProperty('lastUsed')
    })

    console.log('Worker状态信息测试通过:', status)
  })
})

describe('指标收集器测试', () => {
  let metricsCollector: MetricsCollector

  beforeEach(() => {
    metricsCollector = new MetricsCollector()
  })

  afterEach(() => {
    metricsCollector.destroy()
  })

  test('应该正确记录处理指标', () => {
    const requestId = 'metrics_test_' + Date.now()
    const imageInfo = {
      width: 100,
      height: 100,
      fileSize: 1024 * 50 // 50KB
    }
    const parameters = {
      resizeFactor: 50,
      interpolation: 'bilinear',
      colorMode: 'no_dithering',
      ditheringRatio: 1.0,
      quality: 'balanced'
    }

    // 开始处理
    metricsCollector.startProcessing(requestId, imageInfo, parameters)

    // 模拟处理时间
    setTimeout(() => {
      // 完成处理
      metricsCollector.finishProcessing(requestId, {
        success: true,
        outputSize: 1024 * 25, // 25KB
        extractedColors: 16
      }, ['智能缩放', '颜色量化'])

      const stats = metricsCollector.getAggregatedStats()
      
      expect(stats.totalRequests).toBe(1)
      expect(stats.successfulRequests).toBe(1)
      expect(stats.failedRequests).toBe(0)
      expect(stats.successRate).toBe(100)
      expect(stats.averageProcessingTime).toBeGreaterThan(0)
      expect(stats.averageFileSize).toBe(1024 * 50)

      console.log('指标收集测试通过:', {
        总请求数: stats.totalRequests,
        成功率: stats.successRate + '%',
        平均处理时间: Math.round(stats.averageProcessingTime) + 'ms',
        平均文件大小: Math.round(stats.averageFileSize / 1024) + 'KB'
      })
    }, 100)
  })

  test('应该正确记录失败指标', () => {
    const requestId = 'failure_test_' + Date.now()
    const imageInfo = {
      width: 200,
      height: 200,
      fileSize: 1024 * 100
    }

    metricsCollector.startProcessing(requestId, imageInfo, {
      resizeFactor: 75,
      interpolation: 'nearest_neighbor',
      colorMode: 'ordered_dithering_bayer',
      ditheringRatio: 2.0,
      quality: 'high_quality'
    })

    metricsCollector.finishProcessing(requestId, {
      success: false,
      error: '内存不足',
      errorType: 'MEMORY_ERROR'
    })

    const stats = metricsCollector.getAggregatedStats()
    
    expect(stats.totalRequests).toBe(1)
    expect(stats.successfulRequests).toBe(0)
    expect(stats.failedRequests).toBe(1)
    expect(stats.successRate).toBe(0)
    expect(stats.errorDistribution['MEMORY_ERROR']).toBe(1)

    console.log('失败指标收集测试通过:', {
      错误分布: stats.errorDistribution,
      成功率: stats.successRate + '%'
    })
  })

  test('应该提供实时统计信息', () => {
    const realtimeStats = metricsCollector.getRealtimeStats()

    expect(realtimeStats).toHaveProperty('activeRequests')
    expect(realtimeStats).toHaveProperty('requestsPerMinute')
    expect(realtimeStats).toHaveProperty('requestsPerHour')
    expect(realtimeStats).toHaveProperty('currentMemoryUsage')
    expect(realtimeStats).toHaveProperty('currentCpuUsage')
    expect(realtimeStats).toHaveProperty('recentErrors')
    expect(realtimeStats).toHaveProperty('performanceTrend')

    expect(typeof realtimeStats.activeRequests).toBe('number')
    expect(typeof realtimeStats.requestsPerMinute).toBe('number')
    expect(typeof realtimeStats.requestsPerHour).toBe('number')
    expect(typeof realtimeStats.currentMemoryUsage).toBe('number')
    expect(Array.isArray(realtimeStats.recentErrors)).toBe(true)
    expect(['improving', 'stable', 'degrading'].includes(realtimeStats.performanceTrend)).toBe(true)

    console.log('实时统计信息测试通过:', realtimeStats)
  })

  test('应该支持指标导出', () => {
    // 添加一些测试数据
    const requestId = 'export_test_' + Date.now()
    metricsCollector.startProcessing(requestId, {
      width: 50,
      height: 50,
      fileSize: 1024 * 10
    }, {
      resizeFactor: 25,
      interpolation: 'bilinear',
      colorMode: 'no_dithering',
      ditheringRatio: 1.0,
      quality: 'fast'
    })

    metricsCollector.finishProcessing(requestId, {
      success: true,
      outputSize: 1024 * 5,
      extractedColors: 8
    })

    // 测试JSON导出
    const jsonExport = metricsCollector.exportMetrics('json')
    expect(() => JSON.parse(jsonExport)).not.toThrow()
    
    const exportData = JSON.parse(jsonExport)
    expect(exportData).toHaveProperty('exportTime')
    expect(exportData).toHaveProperty('totalMetrics')
    expect(exportData).toHaveProperty('aggregatedStats')
    expect(exportData).toHaveProperty('rawMetrics')

    // 测试CSV导出
    const csvExport = metricsCollector.exportMetrics('csv')
    expect(typeof csvExport).toBe('string')
    expect(csvExport.includes('requestId,timestamp')).toBe(true)

    console.log('指标导出测试通过:', {
      JSON导出长度: jsonExport.length + '字符',
      CSV导出行数: csvExport.split('\n').length + '行'
    })
  })

  test('应该正确处理时间范围过滤', () => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // 添加一些历史数据
    for (let i = 0; i < 5; i++) {
      const requestId = `range_test_${i}_${Date.now()}`
      metricsCollector.startProcessing(requestId, {
        width: 100,
        height: 100,
        fileSize: 1024 * 20
      }, {
        resizeFactor: 50,
        interpolation: 'bilinear',
        colorMode: 'no_dithering',
        ditheringRatio: 1.0,
        quality: 'balanced'
      })

      metricsCollector.finishProcessing(requestId, {
        success: true,
        outputSize: 1024 * 10,
        extractedColors: 12
      })
    }

    // 获取最近一小时的统计
    const recentStats = metricsCollector.getAggregatedStats({
      start: oneHourAgo,
      end: now
    })

    expect(recentStats.totalRequests).toBeGreaterThan(0)
    expect(recentStats.successRate).toBe(100)

    console.log('时间范围过滤测试通过:', {
      时间范围: '最近1小时',
      请求数: recentStats.totalRequests,
      成功率: recentStats.successRate + '%'
    })
  })
})

describe('系统监控器测试', () => {
  let systemMonitor: SystemMonitor

  beforeEach(() => {
    systemMonitor = new SystemMonitor({
      checkInterval: 1000, // 1秒检查间隔（测试用）
    })
  })

  afterEach(() => {
    systemMonitor.destroy()
  })

  test('应该正确执行健康检查', async () => {
    const healthStatus = await systemMonitor.performHealthCheck()

    expect(healthStatus).toHaveProperty('overall')
    expect(healthStatus).toHaveProperty('timestamp')
    expect(healthStatus).toHaveProperty('uptime')
    expect(healthStatus).toHaveProperty('components')
    expect(healthStatus).toHaveProperty('metrics')
    expect(healthStatus).toHaveProperty('alerts')

    expect(['healthy', 'warning', 'critical'].includes(healthStatus.overall)).toBe(true)
    expect(typeof healthStatus.timestamp).toBe('number')
    expect(typeof healthStatus.uptime).toBe('number')
    expect(Array.isArray(healthStatus.alerts)).toBe(true)

    // 检查组件状态
    const components = healthStatus.components
    expect(components).toHaveProperty('memory')
    expect(components).toHaveProperty('cpu')
    expect(components).toHaveProperty('disk')
    expect(components).toHaveProperty('sharp')
    expect(components).toHaveProperty('workerPool')
    expect(components).toHaveProperty('database')

    Object.entries(components).forEach(([componentName, component]) => {
      expect(['healthy', 'warning', 'critical', 'unknown'].includes(component.status)).toBe(true)
      expect(typeof component.message).toBe('string')
      expect(typeof component.lastCheck).toBe('number')
      expect(Array.isArray(component.history)).toBe(true)
    })

    console.log('系统健康检查测试通过:', {
      总体状态: healthStatus.overall,
      内存状态: components.memory.status,
      CPU状态: components.cpu.status,
      Sharp状态: components.sharp.status,
      告警数量: healthStatus.alerts.length
    })
  }, 10000)

  test('应该监控系统指标', async () => {
    const healthStatus = await systemMonitor.performHealthCheck()
    const metrics = healthStatus.metrics

    expect(metrics).toHaveProperty('memory')
    expect(metrics).toHaveProperty('cpu')
    expect(metrics).toHaveProperty('disk')
    expect(metrics).toHaveProperty('process')
    expect(metrics).toHaveProperty('network')

    // 检查内存指标
    expect(metrics.memory).toHaveProperty('used')
    expect(metrics.memory).toHaveProperty('free')
    expect(metrics.memory).toHaveProperty('total')
    expect(metrics.memory).toHaveProperty('usagePercent')
    expect(typeof metrics.memory.usagePercent).toBe('number')
    expect(metrics.memory.usagePercent).toBeGreaterThanOrEqual(0)
    expect(metrics.memory.usagePercent).toBeLessThanOrEqual(100)

    // 检查CPU指标
    expect(metrics.cpu).toHaveProperty('loadAverage')
    expect(metrics.cpu).toHaveProperty('cores')
    expect(Array.isArray(metrics.cpu.loadAverage)).toBe(true)
    expect(typeof metrics.cpu.cores).toBe('number')

    // 检查进程指标
    expect(metrics.process).toHaveProperty('pid')
    expect(metrics.process).toHaveProperty('uptime')
    expect(metrics.process).toHaveProperty('version')
    expect(metrics.process).toHaveProperty('platform')

    console.log('系统指标监控测试通过:', {
      内存使用率: metrics.memory.usagePercent.toFixed(1) + '%',
      CPU核心数: metrics.cpu.cores,
      进程运行时间: Math.round(metrics.process.uptime) + '秒',
      Node版本: metrics.process.version
    })
  }, 5000)

  test('应该提供状态摘要', async () => {
    const summary = await systemMonitor.getStatusSummary()

    expect(summary).toHaveProperty('status')
    expect(summary).toHaveProperty('uptime')
    expect(summary).toHaveProperty('activeAlerts')
    expect(summary).toHaveProperty('memoryUsage')
    expect(summary).toHaveProperty('cpuLoad')
    expect(summary).toHaveProperty('lastCheck')

    expect(typeof summary.status).toBe('string')
    expect(typeof summary.uptime).toBe('string')
    expect(typeof summary.activeAlerts).toBe('number')
    expect(typeof summary.memoryUsage).toBe('string')
    expect(typeof summary.cpuLoad).toBe('string')
    expect(typeof summary.lastCheck).toBe('string')

    console.log('状态摘要测试通过:', summary)
  }, 5000)

  test('应该启动和停止监控', () => {
    expect(systemMonitor).toBeDefined()
    
    // 启动监控
    systemMonitor.start()
    
    // 停止监控
    systemMonitor.stop()
    
    console.log('监控启动/停止测试通过')
  })

  test('应该管理告警历史', async () => {
    // 执行健康检查以生成可能的告警
    await systemMonitor.performHealthCheck()
    
    const alertHistory = systemMonitor.getAlertHistory(10)
    
    expect(Array.isArray(alertHistory)).toBe(true)
    
    alertHistory.forEach(alert => {
      expect(alert).toHaveProperty('id')
      expect(alert).toHaveProperty('level')
      expect(alert).toHaveProperty('component')
      expect(alert).toHaveProperty('message')
      expect(alert).toHaveProperty('timestamp')
      expect(alert).toHaveProperty('resolved')
      
      expect(['info', 'warning', 'critical'].includes(alert.level)).toBe(true)
      expect(typeof alert.resolved).toBe('boolean')
    })

    console.log('告警历史管理测试通过:', {
      历史告警数量: alertHistory.length
    })
  }, 5000)
})

describe('性能优化器测试', () => {
  let optimizer: PerformanceOptimizer

  beforeEach(() => {
    optimizer = new PerformanceOptimizer({ useWorkerPool: false }) // 禁用Worker池以简化测试
  })

  test('应该正确开始和结束优化处理', () => {
    const width = 100
    const height = 100
    
    const { settings, monitor } = optimizer.startOptimizedProcessing(width, height, 'balanced')
    
    expect(settings).toBeDefined()
    expect(settings).toHaveProperty('enableChunking')
    expect(settings).toHaveProperty('chunkSize')
    expect(settings).toHaveProperty('enableParallel')
    expect(settings).toHaveProperty('maxMemoryUsage')
    expect(settings).toHaveProperty('quality')
    
    expect(monitor).toBeDefined()
    
    // 模拟处理完成
    const metrics = optimizer.finishOptimizedProcessing(
      width, 
      height, 
      1024 * 10, // 10KB
      ['测试优化1', '测试优化2']
    )
    
    expect(metrics).toBeDefined()
    expect(metrics).toHaveProperty('processingTime')
    expect(metrics).toHaveProperty('memoryUsage')
    expect(metrics).toHaveProperty('imageSize')
    expect(metrics).toHaveProperty('optimizations')
    
    expect(typeof metrics.processingTime).toBe('number')
    expect(metrics.processingTime).toBeGreaterThan(0)
    expect(Array.isArray(metrics.optimizations)).toBe(true)
    expect(metrics.optimizations).toContain('测试优化1')
    
    console.log('性能优化器测试通过:', {
      处理时间: Math.round(metrics.processingTime) + 'ms',
      内存使用: Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      应用优化: metrics.optimizations.join(', ')
    })
  })

  test('应该根据图像大小选择合适的设置', () => {
    const testCases = [
      { width: 100, height: 100, quality: 'fast' as const },
      { width: 500, height: 500, quality: 'balanced' as const },
      { width: 1000, height: 1000, quality: 'high_quality' as const }
    ]
    
    testCases.forEach(({ width, height, quality }) => {
      const { settings } = optimizer.startOptimizedProcessing(width, height, quality)
      
      expect(settings.quality).toBe(quality)
      
      const totalPixels = width * height
      if (totalPixels > 1024 * 1024) { // 1MP
        expect(settings.enableChunking || settings.enableParallel).toBe(true)
      }
      
      console.log(`${width}x${height} (${quality}) 设置:`, {
        启用分块: settings.enableChunking,
        块大小: settings.chunkSize,
        启用并行: settings.enableParallel,
        最大内存: settings.maxMemoryUsage + 'MB'
      })
      
      // 完成处理以清理
      optimizer.finishOptimizedProcessing(width, height, 1024, [])
    })
  })

  test('应该正确记录性能检查点', () => {
    const { settings, monitor } = optimizer.startOptimizedProcessing(200, 200, 'balanced')
    
    expect(() => {
      optimizer.logCheckpoint('测试检查点1')
      optimizer.logCheckpoint('测试检查点2')
      optimizer.logCheckpoint('测试检查点3')
    }).not.toThrow()
    
    // 完成处理
    optimizer.finishOptimizedProcessing(200, 200, 1024 * 5, ['检查点记录'])
    
    console.log('性能检查点记录测试通过')
  })

  test('应该检测是否应该使用分块处理', () => {
    const smallBuffer = Buffer.alloc(1024 * 100) // 100KB
    const largeBuffer = Buffer.alloc(1024 * 1024 * 30) // 30MB
    
    const shouldUseSmall = optimizer.shouldUseChunking(smallBuffer)
    const shouldUseLarge = optimizer.shouldUseChunking(largeBuffer)
    
    expect(typeof shouldUseSmall).toBe('boolean')
    expect(typeof shouldUseLarge).toBe('boolean')
    expect(shouldUseLarge).toBe(true) // 大文件应该使用分块
    
    console.log('分块处理检测测试通过:', {
      小文件使用分块: shouldUseSmall,
      大文件使用分块: shouldUseLarge
    })
  })

  test('应该获取推荐的块大小', () => {
    const testCases = [
      { width: 100, height: 100 },
      { width: 500, height: 500 },
      { width: 1000, height: 1000 },
      { width: 2000, height: 2000 }
    ]
    
    testCases.forEach(({ width, height }) => {
      const chunkSize = optimizer.getRecommendedChunkSize(width, height)
      
      expect(typeof chunkSize).toBe('number')
      expect(chunkSize).toBeGreaterThan(0)
      expect(chunkSize).toBeLessThanOrEqual(height)
      
      console.log(`${width}x${height} 推荐块大小: ${chunkSize}行`)
    })
  })

  test('应该正确处理内存清理', () => {
    expect(() => {
      optimizer.handleMemoryCleanup()
    }).not.toThrow()
    
    console.log('内存清理处理测试通过')
  })
})

describe('集成性能测试', () => {
  test('应该在大负载下保持稳定性能', async () => {
    const workerPool = new WorkerPool({ maxWorkers: 2 })
    const metricsCollector = new MetricsCollector()
    const optimizer = new PerformanceOptimizer()
    
    try {
      const tasks = []
      const taskCount = 10
      
      // 创建多个并发任务
      for (let i = 0; i < taskCount; i++) {
        const imageData = Buffer.alloc(50 * 50 * 3)
        // 填充随机数据
        for (let j = 0; j < imageData.length; j++) {
          imageData[j] = Math.floor(Math.random() * 256)
        }
        
        tasks.push({
          id: `load_test_${i}_${Date.now()}`,
          type: 'quantize' as const,
          data: {
            imageData,
            width: 50,
            height: 50,
            maxColors: 8
          },
          priority: 'normal' as const
        })
      }
      
      const startTime = performance.now()
      const promises = tasks.map(async (task, index) => {
        // 记录处理开始
        metricsCollector.startProcessing(task.id, {
          width: 50,
          height: 50,
          fileSize: task.data.imageData.length
        }, {
          resizeFactor: 50,
          interpolation: 'nearest_neighbor',
          colorMode: 'no_dithering',
          ditheringRatio: 1.0,
          quality: 'balanced'
        })
        
        try {
          const result = await workerPool.executeTask(task)
          
          // 记录处理完成
          metricsCollector.finishProcessing(task.id, {
            success: true,
            outputSize: result.data.length,
            extractedColors: result.palette.length
          }, ['Worker处理'])
          
          return result
        } catch (error) {
          // 记录处理失败
          metricsCollector.finishProcessing(task.id, {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorType: 'PROCESSING_ERROR'
          })
          throw error
        }
      })
      
      const results = await Promise.all(promises)
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // 验证结果
      expect(results).toHaveLength(taskCount)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(Buffer.isBuffer(result.data)).toBe(true)
      })
      
      // 获取性能统计
      const stats = metricsCollector.getAggregatedStats()
      const workerStatus = workerPool.getStatus()
      
      expect(stats.totalRequests).toBe(taskCount)
      expect(stats.successRate).toBe(100)
      expect(totalTime).toBeLessThan(30000) // 应该在30秒内完成
      
      console.log('大负载稳定性测试通过:', {
        任务数量: taskCount,
        总时间: Math.round(totalTime) + 'ms',
        平均时间: Math.round(totalTime / taskCount) + 'ms',
        成功率: stats.successRate + '%',
        Worker状态: workerStatus,
        性能趋势: metricsCollector.getRealtimeStats().performanceTrend
      })
      
    } finally {
      await workerPool.shutdown()
      metricsCollector.destroy()
    }
  }, 40000)
})

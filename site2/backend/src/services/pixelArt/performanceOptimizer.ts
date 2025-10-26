/**
 * 像素画处理性能优化器
 * 实现内存管理、性能监控和处理优化
 */

interface PerformanceMetrics {
  processingTime: number
  memoryUsage: NodeJS.MemoryUsage
  imageSize: {
    width: number
    height: number
    bufferSize: number
  }
  optimizations: string[]
}

interface ProcessingOptions {
  enableChunking: boolean
  chunkSize: number
  enableParallel: boolean
  maxMemoryUsage: number // MB
  quality: 'fast' | 'balanced' | 'high_quality'
}

/**
 * 内存管理器
 */
class MemoryManager {
  private readonly MAX_BUFFER_SIZE = 50 * 1024 * 1024 // 50MB
  private readonly GC_THRESHOLD = 100 * 1024 * 1024 // 100MB

  /**
   * 检查内存使用情况
   */
  checkMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage()
  }

  /**
   * 判断是否需要垃圾回收
   */
  shouldTriggerGC(): boolean {
    const memUsage = this.checkMemoryUsage()
    return memUsage.heapUsed > this.GC_THRESHOLD
  }

  /**
   * 强制垃圾回收（仅在开发环境）
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      console.log('[MemoryManager] 执行垃圾回收')
      global.gc()
    } else {
      console.warn('[MemoryManager] 垃圾回收不可用，请使用 --expose-gc 标志启动 Node.js')
    }
  }

  /**
   * 检查缓冲区大小是否安全
   */
  isBufferSizeSafe(bufferSize: number): boolean {
    return bufferSize <= this.MAX_BUFFER_SIZE
  }

  /**
   * 获取推荐的处理块大小
   */
  getRecommendedChunkSize(imageWidth: number, imageHeight: number): number {
    const totalPixels = imageWidth * imageHeight
    const bytesPerPixel = 3 // RGB
    const totalSize = totalPixels * bytesPerPixel

    if (totalSize <= this.MAX_BUFFER_SIZE / 4) {
      return Math.min(1024, imageHeight) // 小图像使用大块
    } else if (totalSize <= this.MAX_BUFFER_SIZE / 2) {
      return Math.min(512, imageHeight) // 中等图像使用中等块
    } else {
      return Math.min(256, imageHeight) // 大图像使用小块
    }
  }

  /**
   * 清理未使用的内存
   */
  cleanup(): void {
    if (this.shouldTriggerGC()) {
      this.forceGarbageCollection()
    }
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private startTime: bigint = BigInt(0)
  private endTime: bigint = BigInt(0)
  private memoryBefore: NodeJS.MemoryUsage | null = null
  private memoryAfter: NodeJS.MemoryUsage | null = null

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    this.startTime = process.hrtime.bigint()
    this.memoryBefore = process.memoryUsage()
    console.log('[PerformanceMonitor] 开始性能监控')
  }

  /**
   * 结束性能监控
   */
  endMonitoring(): PerformanceMetrics {
    this.endTime = process.hrtime.bigint()
    this.memoryAfter = process.memoryUsage()

    const processingTime = Number(this.endTime - this.startTime) / 1_000_000 // 转换为毫秒

    console.log('[PerformanceMonitor] 性能监控完成:', {
      处理时间: `${processingTime.toFixed(2)}ms`,
      内存使用: `${(this.memoryAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`
    })

    return {
      processingTime,
      memoryUsage: this.memoryAfter,
      imageSize: { width: 0, height: 0, bufferSize: 0 }, // 会在调用处设置
      optimizations: []
    }
  }

  /**
   * 记录中间性能指标
   */
  logCheckpoint(label: string): void {
    const currentTime = process.hrtime.bigint()
    const elapsedTime = Number(currentTime - this.startTime) / 1_000_000
    const memUsage = process.memoryUsage()
    
    console.log(`[PerformanceMonitor] ${label}: ${elapsedTime.toFixed(2)}ms, 内存: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`)
  }
}

/**
 * 图像处理分块器
 */
class ImageChunker {
  /**
   * 将图像分割成块进行处理
   */
  static processInChunks<T>(
    imageData: Buffer,
    width: number,
    height: number,
    chunkHeight: number,
    processor: (chunkData: Buffer, chunkWidth: number, chunkHeight: number, startY: number) => T
  ): T[] {
    const results: T[] = []
    const bytesPerPixel = 3

    console.log(`[ImageChunker] 分块处理: ${width}x${height}, 块高度: ${chunkHeight}`)

    for (let startY = 0; startY < height; startY += chunkHeight) {
      const currentChunkHeight = Math.min(chunkHeight, height - startY)
      const chunkSize = width * currentChunkHeight * bytesPerPixel
      const chunkData = Buffer.alloc(chunkSize)

      // 复制块数据
      for (let y = 0; y < currentChunkHeight; y++) {
        const sourceY = startY + y
        const sourceOffset = sourceY * width * bytesPerPixel
        const targetOffset = y * width * bytesPerPixel
        
        imageData.copy(chunkData, targetOffset, sourceOffset, sourceOffset + width * bytesPerPixel)
      }

      // 处理块
      const result = processor(chunkData, width, currentChunkHeight, startY)
      results.push(result)
    }

    return results
  }

  /**
   * 合并处理后的块
   */
  static mergeChunks(chunks: Buffer[], width: number, totalHeight: number): Buffer {
    const totalSize = width * totalHeight * 3
    const mergedData = Buffer.alloc(totalSize)
    
    let currentOffset = 0
    
    for (const chunk of chunks) {
      chunk.copy(mergedData, currentOffset)
      currentOffset += chunk.length
    }

    console.log(`[ImageChunker] 合并完成: ${chunks.length} 个块，总大小: ${totalSize} 字节`)
    
    return mergedData
  }
}

/**
 * 自适应质量控制器
 */
class QualityController {
  /**
   * 根据图像尺寸和性能要求调整处理参数
   */
  static getOptimalSettings(
    width: number,
    height: number,
    quality: 'fast' | 'balanced' | 'high_quality'
  ): ProcessingOptions {
    const totalPixels = width * height
    const isLargeImage = totalPixels > 1024 * 1024 // 1MP
    const isHugeImage = totalPixels > 4 * 1024 * 1024 // 4MP

    let settings: ProcessingOptions = {
      enableChunking: false,
      chunkSize: 512,
      enableParallel: false,
      maxMemoryUsage: 100,
      quality: quality
    }

    switch (quality) {
      case 'fast':
        settings.enableChunking = isHugeImage
        settings.chunkSize = 256
        settings.enableParallel = false
        settings.maxMemoryUsage = 50
        break

      case 'balanced':
        settings.enableChunking = isLargeImage
        settings.chunkSize = 512
        settings.enableParallel = isHugeImage
        settings.maxMemoryUsage = 100
        break

      case 'high_quality':
        settings.enableChunking = isLargeImage
        settings.chunkSize = 1024
        settings.enableParallel = isHugeImage
        settings.maxMemoryUsage = 200
        break
    }

    console.log(`[QualityController] 图像 ${width}x${height} (${totalPixels} 像素) 使用 ${quality} 质量设置:`, settings)

    return settings
  }

  /**
   * 动态调整处理参数
   */
  static adjustSettingsForPerformance(
    settings: ProcessingOptions,
    memoryUsage: NodeJS.MemoryUsage
  ): ProcessingOptions {
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    const adjustedSettings = { ...settings }

    if (heapUsedMB > settings.maxMemoryUsage * 0.8) {
      console.log(`[QualityController] 内存使用过高 (${heapUsedMB.toFixed(2)}MB), 调整设置`)
      
      // 降低块大小
      adjustedSettings.chunkSize = Math.max(128, adjustedSettings.chunkSize / 2)
      // 启用分块处理
      adjustedSettings.enableChunking = true
      // 禁用并行处理以节省内存
      adjustedSettings.enableParallel = false
    }

    return adjustedSettings
  }
}

/**
 * 性能优化器主类
 */
export class PerformanceOptimizer {
  private memoryManager: MemoryManager
  private performanceMonitor: PerformanceMonitor
  private useWorkerPool: boolean

  constructor(options: {
    useWorkerPool?: boolean
  } = {}) {
    this.memoryManager = new MemoryManager()
    this.performanceMonitor = new PerformanceMonitor()
    this.useWorkerPool = options.useWorkerPool !== false // 默认启用
  }

  /**
   * 开始优化处理
   */
  startOptimizedProcessing(
    width: number,
    height: number,
    quality: 'fast' | 'balanced' | 'high_quality' = 'balanced'
  ): {
    settings: ProcessingOptions
    monitor: PerformanceMonitor
  } {
    console.log(`[PerformanceOptimizer] 开始优化处理: ${width}x${height}, 质量: ${quality}`)

    // 检查内存状态
    const initialMemory = this.memoryManager.checkMemoryUsage()
    console.log(`[PerformanceOptimizer] 初始内存使用: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)

    // 获取最佳设置
    const settings = QualityController.getOptimalSettings(width, height, quality)

    // 动态调整设置
    const adjustedSettings = QualityController.adjustSettingsForPerformance(settings, initialMemory)

    // 开始性能监控
    this.performanceMonitor.startMonitoring()

    return {
      settings: adjustedSettings,
      monitor: this.performanceMonitor
    }
  }

  /**
   * 处理内存清理
   */
  handleMemoryCleanup(): void {
    this.memoryManager.cleanup()
  }

  /**
   * 检查是否应该使用分块处理
   */
  shouldUseChunking(imageData: Buffer): boolean {
    return !this.memoryManager.isBufferSizeSafe(imageData.length)
  }

  /**
   * 获取推荐的块大小
   */
  getRecommendedChunkSize(width: number, height: number): number {
    return this.memoryManager.getRecommendedChunkSize(width, height)
  }

  /**
   * 完成优化处理
   */
  finishOptimizedProcessing(
    width: number,
    height: number,
    bufferSize: number,
    appliedOptimizations: string[]
  ): PerformanceMetrics {
    const metrics = this.performanceMonitor.endMonitoring()
    
    // 设置图像信息
    metrics.imageSize = { width, height, bufferSize }
    metrics.optimizations = appliedOptimizations

    // 清理内存
    this.handleMemoryCleanup()

    // 记录最终指标
    console.log(`[PerformanceOptimizer] 处理完成:`, {
      图像尺寸: `${width}x${height}`,
      处理时间: `${metrics.processingTime.toFixed(2)}ms`,
      内存峰值: `${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      应用的优化: appliedOptimizations.join(', ')
    })

    return metrics
  }

  /**
   * 记录性能检查点
   */
  logCheckpoint(label: string): void {
    this.performanceMonitor.logCheckpoint(label)
  }

  /**
   * 检查是否应该使用Worker线程池
   */
  shouldUseWorkerPool(imageData: Buffer, width: number, height: number): boolean {
    if (!this.useWorkerPool) {
      return false
    }

    // 大于2MP的图像或大于20MB的buffer使用Worker线程池
    const totalPixels = width * height
    const isLargeImage = totalPixels > 2 * 1024 * 1024
    const isLargeBuffer = imageData.length > 20 * 1024 * 1024

    return isLargeImage || isLargeBuffer
  }

  /**
   * 使用Worker线程池处理图像任务
   */
  async processWithWorkerPool<T = any>(
    taskType: 'resize' | 'quantize' | 'dither' | 'pixelArt',
    taskData: any,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<T> {
    if (!this.useWorkerPool) {
      throw new Error('Worker线程池未启用')
    }

    const { getGlobalWorkerPool } = await import('./workerPool')
    const workerPool = getGlobalWorkerPool()

    const taskId = `${taskType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`[PerformanceOptimizer] 提交Worker任务: ${taskId}`)

    try {
      const result = await workerPool.executeTask<T>({
        id: taskId,
        type: taskType,
        data: taskData,
        priority
      })

      console.log(`[PerformanceOptimizer] Worker任务完成: ${taskId}`)
      return result
    } catch (error) {
      console.error(`[PerformanceOptimizer] Worker任务失败: ${taskId}`, error)
      throw error
    }
  }

  /**
   * 获取Worker线程池状态
   */
  async getWorkerPoolStatus() {
    if (!this.useWorkerPool) {
      return null
    }

    try {
      const { getGlobalWorkerPool } = await import('./workerPool')
      const workerPool = getGlobalWorkerPool()
      return workerPool.getStatus()
    } catch (error) {
      console.error('[PerformanceOptimizer] 获取Worker线程池状态失败', error)
      return null
    }
  }
}

// 导出工具类
export { ImageChunker, QualityController, MemoryManager }

/**
 * 像素画处理指标收集器
 * 收集和分析处理性能、成功率、错误分布等关键指标
 */

import { EventEmitter } from 'events'
import * as os from 'os'
import { logger } from './errorHandler'

// 指标数据接口
export interface ProcessingMetrics {
  requestId: string
  timestamp: number
  processingTime: number
  imageSize: {
    width: number
    height: number
    fileSize: number
  }
  parameters: {
    resizeFactor: number
    interpolation: string
    colorMode: string
    ditheringRatio: number
    quality: string
  }
  result: {
    success: boolean
    outputSize?: number
    extractedColors?: number
    error?: string
    errorType?: string
  }
  systemMetrics: {
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: number[]
    loadAverage: number[]
  }
  optimizations?: string[]
}

// 聚合统计
export interface AggregatedStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageProcessingTime: number
  medianProcessingTime: number
  p95ProcessingTime: number
  p99ProcessingTime: number
  averageFileSize: number
  totalDataProcessed: number
  errorDistribution: Record<string, number>
  qualityDistribution: Record<string, number>
  interpolationDistribution: Record<string, number>
  colorModeDistribution: Record<string, number>
  systemHealth: {
    averageMemoryUsage: number
    peakMemoryUsage: number
    averageCpuUsage: number
    averageLoadAverage: number
  }
}

// 实时统计
export interface RealtimeStats {
  activeRequests: number
  requestsPerMinute: number
  requestsPerHour: number
  currentMemoryUsage: number
  currentCpuUsage: number
  recentErrors: Array<{
    timestamp: number
    error: string
    count: number
  }>
  performanceTrend: 'improving' | 'stable' | 'degrading'
}

/**
 * 指标收集器类
 */
export class MetricsCollector extends EventEmitter {
  private metrics: ProcessingMetrics[] = []
  private realtimeData: Map<string, any> = new Map()
  private maxMetricsHistory: number = 10000 // 保留最近10000条记录
  private cleanupInterval: NodeJS.Timeout
  private activeRequests: Set<string> = new Set()
  private errorCounts: Map<string, number> = new Map()

  constructor() {
    super()
    
    // 定期清理旧数据
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics()
    }, 5 * 60 * 1000) // 每5分钟清理一次

    logger.info('MetricsCollector', '指标收集器初始化完成')
  }

  /**
   * 记录处理开始
   */
  startProcessing(requestId: string, imageInfo: {
    width: number
    height: number
    fileSize: number
  }, parameters: any): void {
    this.activeRequests.add(requestId)
    
    this.realtimeData.set(`start_${requestId}`, {
      timestamp: Date.now(),
      imageInfo,
      parameters,
      systemMetrics: this.collectSystemMetrics()
    })

    logger.debug('MetricsCollector', '开始记录处理指标', {
      requestId,
      imageSize: `${imageInfo.width}x${imageInfo.height}`,
      fileSize: `${(imageInfo.fileSize / 1024 / 1024).toFixed(2)}MB`
    })

    this.emit('processingStarted', { requestId, imageInfo, parameters })
  }

  /**
   * 记录处理完成
   */
  finishProcessing(requestId: string, result: {
    success: boolean
    outputSize?: number
    extractedColors?: number
    error?: string
    errorType?: string
  }, optimizations?: string[]): void {
    const startData = this.realtimeData.get(`start_${requestId}`)
    if (!startData) {
      logger.warn('MetricsCollector', '找不到处理开始数据', { requestId })
      return
    }

    this.activeRequests.delete(requestId)
    this.realtimeData.delete(`start_${requestId}`)

    const endTime = Date.now()
    const processingTime = endTime - startData.timestamp

    // 创建完整的指标记录
    const metrics: ProcessingMetrics = {
      requestId,
      timestamp: startData.timestamp,
      processingTime,
      imageSize: startData.imageInfo,
      parameters: startData.parameters,
      result,
      systemMetrics: this.collectSystemMetrics(),
      optimizations
    }

    // 添加到指标历史
    this.metrics.push(metrics)

    // 更新错误统计
    if (!result.success && result.errorType) {
      const currentCount = this.errorCounts.get(result.errorType) || 0
      this.errorCounts.set(result.errorType, currentCount + 1)
    }

    logger.debug('MetricsCollector', '处理指标记录完成', {
      requestId,
      success: result.success,
      processingTime: `${processingTime}ms`,
      optimizations: optimizations?.length || 0
    })

    this.emit('processingFinished', metrics)

    // 检查是否需要清理
    if (this.metrics.length > this.maxMetricsHistory) {
      this.cleanupOldMetrics()
    }
  }

  /**
   * 收集系统指标
   */
  private collectSystemMetrics(): ProcessingMetrics['systemMetrics'] {
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage ? Object.values(process.cpuUsage()) : [],
      loadAverage: os.loadavg()
    }
  }

  /**
   * 获取聚合统计
   */
  getAggregatedStats(timeRange?: {
    start: number
    end: number
  }): AggregatedStats {
    let filteredMetrics = this.metrics

    if (timeRange) {
      filteredMetrics = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }

    const totalRequests = filteredMetrics.length
    const successfulRequests = filteredMetrics.filter(m => m.result.success).length
    const failedRequests = totalRequests - successfulRequests

    // 处理时间统计
    const processingTimes = filteredMetrics.map(m => m.processingTime).sort((a, b) => a - b)
    const averageProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0) / totalRequests || 0
    const medianProcessingTime = this.getPercentile(processingTimes, 50)
    const p95ProcessingTime = this.getPercentile(processingTimes, 95)
    const p99ProcessingTime = this.getPercentile(processingTimes, 99)

    // 文件大小统计
    const fileSizes = filteredMetrics.map(m => m.imageSize.fileSize)
    const averageFileSize = fileSizes.reduce((sum, size) => sum + size, 0) / totalRequests || 0
    const totalDataProcessed = fileSizes.reduce((sum, size) => sum + size, 0)

    // 错误分布
    const errorDistribution: Record<string, number> = {}
    filteredMetrics.forEach(m => {
      if (!m.result.success && m.result.errorType) {
        errorDistribution[m.result.errorType] = (errorDistribution[m.result.errorType] || 0) + 1
      }
    })

    // 质量分布
    const qualityDistribution: Record<string, number> = {}
    filteredMetrics.forEach(m => {
      const quality = m.parameters.quality
      qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1
    })

    // 插值方法分布
    const interpolationDistribution: Record<string, number> = {}
    filteredMetrics.forEach(m => {
      const interpolation = m.parameters.interpolation
      interpolationDistribution[interpolation] = (interpolationDistribution[interpolation] || 0) + 1
    })

    // 颜色模式分布
    const colorModeDistribution: Record<string, number> = {}
    filteredMetrics.forEach(m => {
      const colorMode = m.parameters.colorMode
      colorModeDistribution[colorMode] = (colorModeDistribution[colorMode] || 0) + 1
    })

    // 系统健康统计
    const memoryUsages = filteredMetrics.map(m => m.systemMetrics.memoryUsage.heapUsed)
    const cpuUsages = filteredMetrics.flatMap(m => m.systemMetrics.cpuUsage)
    const loadAverages = filteredMetrics.flatMap(m => m.systemMetrics.loadAverage)

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      averageProcessingTime,
      medianProcessingTime,
      p95ProcessingTime,
      p99ProcessingTime,
      averageFileSize,
      totalDataProcessed,
      errorDistribution,
      qualityDistribution,
      interpolationDistribution,
      colorModeDistribution,
      systemHealth: {
        averageMemoryUsage: memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length || 0,
        peakMemoryUsage: Math.max(...memoryUsages, 0),
        averageCpuUsage: cpuUsages.reduce((sum, cpu) => sum + cpu, 0) / cpuUsages.length || 0,
        averageLoadAverage: loadAverages.reduce((sum, load) => sum + load, 0) / loadAverages.length || 0
      }
    }
  }

  /**
   * 获取实时统计
   */
  getRealtimeStats(): RealtimeStats {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000

    // 最近一分钟的请求数
    const requestsLastMinute = this.metrics.filter(m => m.timestamp > oneMinuteAgo).length
    const requestsLastHour = this.metrics.filter(m => m.timestamp > oneHourAgo).length

    // 当前系统指标
    const currentSystem = this.collectSystemMetrics()

    // 最近的错误
    const recentErrors = this.getRecentErrors(10)

    // 性能趋势分析
    const performanceTrend = this.analyzePerformanceTrend()

    return {
      activeRequests: this.activeRequests.size,
      requestsPerMinute: requestsLastMinute,
      requestsPerHour: requestsLastHour,
      currentMemoryUsage: currentSystem.memoryUsage.heapUsed,
      currentCpuUsage: currentSystem.cpuUsage.reduce((sum, cpu) => sum + cpu, 0) / currentSystem.cpuUsage.length || 0,
      recentErrors,
      performanceTrend
    }
  }

  /**
   * 获取百分位数
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }

  /**
   * 获取最近错误
   */
  private getRecentErrors(limit: number): Array<{
    timestamp: number
    error: string
    count: number
  }> {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentFailures = this.metrics
      .filter(m => m.timestamp > oneHourAgo && !m.result.success)
      .slice(-limit)

    const errorGroups = new Map<string, { timestamp: number; count: number }>()

    recentFailures.forEach(m => {
      const errorKey = m.result.error || 'Unknown error'
      const existing = errorGroups.get(errorKey)
      if (existing) {
        existing.count++
        existing.timestamp = Math.max(existing.timestamp, m.timestamp)
      } else {
        errorGroups.set(errorKey, { timestamp: m.timestamp, count: 1 })
      }
    })

    return Array.from(errorGroups.entries())
      .map(([error, data]) => ({
        timestamp: data.timestamp,
        error,
        count: data.count
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * 分析性能趋势
   */
  private analyzePerformanceTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.metrics.length < 20) return 'stable' // 数据不足

    const recentMetrics = this.metrics.slice(-20)
    const firstHalf = recentMetrics.slice(0, 10)
    const secondHalf = recentMetrics.slice(10)

    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.processingTime, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.processingTime, 0) / secondHalf.length

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

    if (changePercent < -10) return 'improving'
    if (changePercent > 15) return 'degrading'
    return 'stable'
  }

  /**
   * 清理旧指标
   */
  private cleanupOldMetrics(): void {
    const initialCount = this.metrics.length
    
    if (initialCount <= this.maxMetricsHistory) {
      return
    }

    // 保留最新的指标
    this.metrics = this.metrics.slice(-this.maxMetricsHistory)
    
    const removedCount = initialCount - this.metrics.length
    
    logger.debug('MetricsCollector', '清理旧指标完成', {
      removed: removedCount,
      remaining: this.metrics.length
    })
  }

  /**
   * 导出指标数据
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv()
    }
    
    return JSON.stringify({
      exportTime: Date.now(),
      totalMetrics: this.metrics.length,
      aggregatedStats: this.getAggregatedStats(),
      realtimeStats: this.getRealtimeStats(),
      rawMetrics: this.metrics
    }, null, 2)
  }

  /**
   * 导出为CSV格式
   */
  private exportToCsv(): string {
    const headers = [
      'requestId', 'timestamp', 'processingTime', 'imageWidth', 'imageHeight', 
      'fileSize', 'resizeFactor', 'interpolation', 'colorMode', 'ditheringRatio',
      'quality', 'success', 'outputSize', 'extractedColors', 'error',
      'memoryUsed', 'optimizations'
    ].join(',')

    const rows = this.metrics.map(m => [
      m.requestId,
      new Date(m.timestamp).toISOString(),
      m.processingTime,
      m.imageSize.width,
      m.imageSize.height,
      m.imageSize.fileSize,
      m.parameters.resizeFactor,
      m.parameters.interpolation,
      m.parameters.colorMode,
      m.parameters.ditheringRatio,
      m.parameters.quality,
      m.result.success,
      m.result.outputSize || '',
      m.result.extractedColors || '',
      m.result.error || '',
      m.systemMetrics.memoryUsage.heapUsed,
      m.optimizations?.join(';') || ''
    ].join(','))

    return [headers, ...rows].join('\n')
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = []
    this.realtimeData.clear()
    this.activeRequests.clear()
    this.errorCounts.clear()
    
    logger.info('MetricsCollector', '所有指标已重置')
    this.emit('metricsReset')
  }

  /**
   * 销毁收集器
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    
    this.reset()
    this.removeAllListeners()
    
    logger.info('MetricsCollector', '指标收集器已销毁')
  }
}

// 全局指标收集器实例
export const globalMetricsCollector = new MetricsCollector()

/**
 * 中间件：自动收集处理指标
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const requestId = req.requestId || `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 在文件上传后开始记录
  if (req.file) {
    const imageInfo = {
      width: 0, // 将在处理时更新
      height: 0,
      fileSize: req.file.size
    }
    
    globalMetricsCollector.startProcessing(requestId, imageInfo, req.body)
  }

  next()
}

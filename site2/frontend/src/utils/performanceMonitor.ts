/**
 * 性能监控工具
 * 提供组件渲染时间、API调用时间、内存使用等监控功能
 */

// 性能测量结果
interface PerformanceMeasurement {
  name: string
  duration: number
  startTime: number
  endTime: number
  metadata?: Record<string, any>
}

// 性能统计信息
interface PerformanceStats {
  measurements: PerformanceMeasurement[]
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  count: number
}

// 全局性能数据存储
const performanceData = new Map<string, PerformanceMeasurement[]>()

/**
 * 开始性能测量
 */
export function startMeasurement(name: string, metadata?: Record<string, any>): () => PerformanceMeasurement {
  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const measurement: PerformanceMeasurement = {
      name,
      duration: endTime - startTime,
      startTime,
      endTime,
      metadata
    }
    
    // 存储测量结果
    if (!performanceData.has(name)) {
      performanceData.set(name, [])
    }
    performanceData.get(name)!.push(measurement)
    
    // 在开发环境下输出详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${measurement.duration.toFixed(2)}ms`, metadata)
    }
    
    return measurement
  }
}

/**
 * 异步函数性能装饰器
 */
export function measureAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const endMeasurement = startMeasurement(name, { args: args.length })
    
    try {
      const result = await fn(...args)
      endMeasurement()
      return result
    } catch (error) {
      const measurement = endMeasurement()
      measurement.metadata = { ...measurement.metadata, error: true }
      throw error
    }
  }) as T
}

/**
 * 同步函数性能装饰器
 */
export function measureSync<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const endMeasurement = startMeasurement(name, { args: args.length })
    
    try {
      const result = fn(...args)
      endMeasurement()
      return result
    } catch (error) {
      const measurement = endMeasurement()
      measurement.metadata = { ...measurement.metadata, error: true }
      throw error
    }
  }) as T
}

/**
 * 获取指定名称的性能统计
 */
export function getPerformanceStats(name: string): PerformanceStats | null {
  const measurements = performanceData.get(name)
  if (!measurements || measurements.length === 0) {
    return null
  }
  
  const durations = measurements.map(m => m.duration)
  const totalTime = durations.reduce((sum, duration) => sum + duration, 0)
  
  return {
    measurements,
    totalTime,
    averageTime: totalTime / measurements.length,
    minTime: Math.min(...durations),
    maxTime: Math.max(...durations),
    count: measurements.length
  }
}

/**
 * 获取所有性能统计
 */
export function getAllPerformanceStats(): Record<string, PerformanceStats> {
  const stats: Record<string, PerformanceStats> = {}
  
  for (const name of performanceData.keys()) {
    const stat = getPerformanceStats(name)
    if (stat) {
      stats[name] = stat
    }
  }
  
  return stats
}

/**
 * 清理性能数据
 */
export function clearPerformanceData(name?: string): void {
  if (name) {
    performanceData.delete(name)
  } else {
    performanceData.clear()
  }
}

/**
 * 输出性能报告
 */
export function logPerformanceReport(name?: string): void {
  if (name) {
    const stats = getPerformanceStats(name)
    if (stats) {
      console.group(`[Performance Report] ${name}`)
      console.log(`调用次数: ${stats.count}`)
      console.log(`总耗时: ${stats.totalTime.toFixed(2)}ms`)
      console.log(`平均耗时: ${stats.averageTime.toFixed(2)}ms`)
      console.log(`最短耗时: ${stats.minTime.toFixed(2)}ms`)
      console.log(`最长耗时: ${stats.maxTime.toFixed(2)}ms`)
      console.groupEnd()
    }
  } else {
    const allStats = getAllPerformanceStats()
    console.group('[Performance Report] 全部统计')
    
    Object.entries(allStats).forEach(([name, stats]) => {
      console.group(name)
      console.log(`调用次数: ${stats.count}`)
      console.log(`平均耗时: ${stats.averageTime.toFixed(2)}ms`)
      console.log(`最长耗时: ${stats.maxTime.toFixed(2)}ms`)
      console.groupEnd()
    })
    
    console.groupEnd()
  }
}

// React组件性能监控
export function usePerformanceMonitor(componentName: string) {
  let renderStart: number
  
  const startRender = () => {
    renderStart = performance.now()
  }
  
  const endRender = () => {
    if (renderStart) {
      const duration = performance.now() - renderStart
      
      // 记录渲染时间
      const measurement: PerformanceMeasurement = {
        name: `${componentName}-render`,
        duration,
        startTime: renderStart,
        endTime: renderStart + duration
      }
      
      if (!performanceData.has(measurement.name)) {
        performanceData.set(measurement.name, [])
      }
      performanceData.get(measurement.name)!.push(measurement)
      
      // 在开发环境下，如果渲染时间过长则警告
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`[Performance] ${componentName} 渲染时间过长: ${duration.toFixed(2)}ms`)
      }
    }
  }
  
  return { startRender, endRender }
}

// FPS监控
let fpsMonitorId: number | null = null
let fpsData: number[] = []
let lastFpsTime = performance.now()

/**
 * 开始FPS监控
 */
export function startFPSMonitor(): void {
  if (fpsMonitorId) return
  
  const measureFPS = () => {
    const now = performance.now()
    const delta = now - lastFpsTime
    const fps = 1000 / delta
    
    fpsData.push(fps)
    
    // 保留最近60次的数据
    if (fpsData.length > 60) {
      fpsData = fpsData.slice(-60)
    }
    
    lastFpsTime = now
    fpsMonitorId = requestAnimationFrame(measureFPS)
  }
  
  fpsMonitorId = requestAnimationFrame(measureFPS)
}

/**
 * 停止FPS监控
 */
export function stopFPSMonitor(): void {
  if (fpsMonitorId) {
    cancelAnimationFrame(fpsMonitorId)
    fpsMonitorId = null
  }
}

/**
 * 获取FPS统计
 */
export function getFPSStats() {
  if (fpsData.length === 0) return null
  
  const avgFPS = fpsData.reduce((sum, fps) => sum + fps, 0) / fpsData.length
  const minFPS = Math.min(...fpsData)
  const maxFPS = Math.max(...fpsData)
  
  return {
    average: avgFPS,
    min: minFPS,
    max: maxFPS,
    current: fpsData[fpsData.length - 1] || 0,
    samples: fpsData.length
  }
}

// 内存使用监控
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalMB: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      limitMB: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
    }
  }
  return null
}

// 网络性能监控
export function monitorNetworkRequest(url: string, startTime: number, endTime: number) {
  const duration = endTime - startTime
  
  const measurement: PerformanceMeasurement = {
    name: 'network-request',
    duration,
    startTime,
    endTime,
    metadata: { url }
  }
  
  if (!performanceData.has('network-request')) {
    performanceData.set('network-request', [])
  }
  performanceData.get('network-request')!.push(measurement)
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] Network request to ${url}: ${duration.toFixed(2)}ms`)
  }
}

// 长任务检测
let longTaskObserver: PerformanceObserver | null = null

/**
 * 开始长任务监控
 */
export function startLongTaskMonitor(): void {
  if (!('PerformanceObserver' in window)) return
  
  try {
    longTaskObserver = new PerformanceObserver((list) => {
      const longTasks = list.getEntries()
      longTasks.forEach((task) => {
        console.warn(`[Performance] 检测到长任务: ${task.duration.toFixed(2)}ms`, task)
        
        const measurement: PerformanceMeasurement = {
          name: 'long-task',
          duration: task.duration,
          startTime: task.startTime,
          endTime: task.startTime + task.duration,
          metadata: { 
            type: task.entryType,
            name: task.name
          }
        }
        
        if (!performanceData.has('long-task')) {
          performanceData.set('long-task', [])
        }
        performanceData.get('long-task')!.push(measurement)
      })
    })
    
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch (error) {
    console.warn('[Performance] 长任务监控不支持:', error)
  }
}

/**
 * 停止长任务监控
 */
export function stopLongTaskMonitor(): void {
  if (longTaskObserver) {
    longTaskObserver.disconnect()
    longTaskObserver = null
  }
}

// 导出性能监控工具对象
export const performanceMonitor = {
  // 基础测量
  startMeasurement,
  measureAsync,
  measureSync,
  
  // 统计和报告
  getPerformanceStats,
  getAllPerformanceStats,
  clearPerformanceData,
  logPerformanceReport,
  
  // React监控
  usePerformanceMonitor,
  
  // FPS监控
  startFPSMonitor,
  stopFPSMonitor,
  getFPSStats,
  
  // 内存监控
  getMemoryUsage,
  
  // 网络监控
  monitorNetworkRequest,
  
  // 长任务监控
  startLongTaskMonitor,
  stopLongTaskMonitor
}

export default performanceMonitor

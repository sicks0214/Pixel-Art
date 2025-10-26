/**
 * 内存管理工具
 * 处理URL对象清理、事件监听器清理、缓存管理等
 */

// URL引用跟踪
const urlRefs = new Map<string, number>()

/**
 * 创建并跟踪Object URL
 */
export function createTrackedObjectURL(blob: Blob | File): string {
  const url = URL.createObjectURL(blob)
  urlRefs.set(url, (urlRefs.get(url) || 0) + 1)
  
  console.log(`[Memory] 创建URL引用: ${url}, 引用计数: ${urlRefs.get(url)}`)
  return url
}

/**
 * 安全地释放Object URL
 */
export function revokeTrackedObjectURL(url: string): void {
  const refCount = urlRefs.get(url) || 0
  
  if (refCount > 1) {
    urlRefs.set(url, refCount - 1)
    console.log(`[Memory] URL引用减少: ${url}, 剩余引用: ${refCount - 1}`)
  } else {
    URL.revokeObjectURL(url)
    urlRefs.delete(url)
    console.log(`[Memory] 释放URL引用: ${url}`)
  }
}

/**
 * 清理所有跟踪的URL
 */
export function clearAllTrackedURLs(): void {
  console.log(`[Memory] 清理所有URL引用, 总数: ${urlRefs.size}`)
  
  for (const url of urlRefs.keys()) {
    URL.revokeObjectURL(url)
  }
  urlRefs.clear()
}

/**
 * 获取当前URL引用统计
 */
export function getURLStats(): { total: number; urls: string[] } {
  return {
    total: urlRefs.size,
    urls: Array.from(urlRefs.keys())
  }
}

// 事件监听器管理
type EventCleanupFunction = () => void
const eventCleanups = new Set<EventCleanupFunction>()

/**
 * 注册可清理的事件监听器
 */
export function addManagedEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): EventCleanupFunction {
  target.addEventListener(type, listener, options)
  
  const cleanup = () => {
    target.removeEventListener(type, listener, options)
    eventCleanups.delete(cleanup)
  }
  
  eventCleanups.add(cleanup)
  return cleanup
}

/**
 * 注册可清理的DOM事件监听器
 */
export function addManagedDOMEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): EventCleanupFunction {
  target.addEventListener(type, listener, options)
  
  const cleanup = () => {
    target.removeEventListener(type, listener, options)
    eventCleanups.delete(cleanup)
  }
  
  eventCleanups.add(cleanup)
  return cleanup
}

/**
 * 清理所有已注册的事件监听器
 */
export function clearAllEventListeners(): void {
  console.log(`[Memory] 清理所有事件监听器, 总数: ${eventCleanups.size}`)
  
  eventCleanups.forEach(cleanup => cleanup())
  eventCleanups.clear()
}

// 定时器管理
const activeTimers = new Set<number>()
const activeIntervals = new Set<number>()

/**
 * 创建被管理的setTimeout
 */
export function createManagedTimeout(
  callback: () => void, 
  delay: number
): number {
  const id = window.setTimeout(() => {
    callback()
    activeTimers.delete(id)
  }, delay)
  
  activeTimers.add(id)
  return id
}

/**
 * 创建被管理的setInterval
 */
export function createManagedInterval(
  callback: () => void, 
  delay: number
): number {
  const id = window.setInterval(callback, delay)
  activeIntervals.add(id)
  return id
}

/**
 * 清理被管理的定时器
 */
export function clearManagedTimeout(id: number): void {
  if (activeTimers.has(id)) {
    clearTimeout(id)
    activeTimers.delete(id)
  }
}

/**
 * 清理被管理的间隔定时器
 */
export function clearManagedInterval(id: number): void {
  if (activeIntervals.has(id)) {
    clearInterval(id)
    activeIntervals.delete(id)
  }
}

/**
 * 清理所有定时器
 */
export function clearAllTimers(): void {
  console.log(`[Memory] 清理定时器: ${activeTimers.size}个setTimeout, ${activeIntervals.size}个setInterval`)
  
  activeTimers.forEach(id => clearTimeout(id))
  activeIntervals.forEach(id => clearInterval(id))
  
  activeTimers.clear()
  activeIntervals.clear()
}

// Canvas资源管理
const canvasContexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()

/**
 * 获取或创建Canvas上下文
 */
export function getManagedCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  let ctx = canvasContexts.get(canvas)
  
  if (!ctx) {
    ctx = canvas.getContext('2d')
    if (ctx) {
      canvasContexts.set(canvas, ctx)
    }
  }
  
  return ctx
}

/**
 * 清理Canvas资源
 */
export function clearCanvasContext(canvas: HTMLCanvasElement): void {
  const ctx = canvasContexts.get(canvas)
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canvasContexts.delete(canvas)
  }
}

// 内存监控
interface MemoryStats {
  usedJSHeapSize?: number
  totalJSHeapSize?: number
  jsHeapSizeLimit?: number
  urlRefsCount: number
  eventListenersCount: number
  timersCount: number
  intervalsCount: number
}

/**
 * 获取内存使用统计
 */
export function getMemoryStats(): MemoryStats {
  const stats: MemoryStats = {
    urlRefsCount: urlRefs.size,
    eventListenersCount: eventCleanups.size,
    timersCount: activeTimers.size,
    intervalsCount: activeIntervals.size
  }
  
  // 如果支持Performance API
  if ('memory' in performance) {
    const memory = (performance as any).memory
    stats.usedJSHeapSize = memory.usedJSHeapSize
    stats.totalJSHeapSize = memory.totalJSHeapSize
    stats.jsHeapSizeLimit = memory.jsHeapSizeLimit
  }
  
  return stats
}

/**
 * 输出内存使用报告
 */
export function logMemoryStats(): void {
  const stats = getMemoryStats()
  
  console.group('[Memory Manager] 内存使用统计')
  console.log('URL引用:', stats.urlRefsCount)
  console.log('事件监听器:', stats.eventListenersCount)
  console.log('定时器:', stats.timersCount)
  console.log('间隔定时器:', stats.intervalsCount)
  
  if (stats.usedJSHeapSize !== undefined) {
    console.log('已用堆内存:', (stats.usedJSHeapSize / 1024 / 1024).toFixed(2) + 'MB')
    console.log('总堆内存:', (stats.totalJSHeapSize! / 1024 / 1024).toFixed(2) + 'MB')
    console.log('堆内存限制:', (stats.jsHeapSizeLimit! / 1024 / 1024).toFixed(2) + 'MB')
  }
  
  console.groupEnd()
}

/**
 * 执行完整的内存清理
 */
export function performFullCleanup(): void {
  console.log('[Memory Manager] 执行完整内存清理')
  
  clearAllTrackedURLs()
  clearAllEventListeners()
  clearAllTimers()
  
  // 建议垃圾回收（仅在开发环境）
  if (process.env.NODE_ENV === 'development' && 'gc' in window) {
    console.log('[Memory Manager] 触发垃圾回收')
    ;(window as any).gc()
  }
  
  logMemoryStats()
}

// React Hook for cleanup
export function useMemoryCleanup() {
  const cleanupFunctions = new Set<() => void>()
  
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.add(cleanup)
    return () => cleanupFunctions.delete(cleanup)
  }
  
  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('[Memory] 清理函数执行失败:', error)
      }
    })
    cleanupFunctions.clear()
  }
  
  return { addCleanup, cleanup }
}

// 内存管理工具对象
export const memoryManager = {
  // URL管理
  createTrackedObjectURL,
  revokeTrackedObjectURL,
  clearAllTrackedURLs,
  getURLStats,
  
  // 事件管理
  addManagedEventListener,
  addManagedDOMEventListener,
  clearAllEventListeners,
  
  // 定时器管理
  createManagedTimeout,
  createManagedInterval,
  clearManagedTimeout,
  clearManagedInterval,
  clearAllTimers,
  
  // Canvas管理
  getManagedCanvasContext,
  clearCanvasContext,
  
  // 监控和清理
  getMemoryStats,
  logMemoryStats,
  performFullCleanup,
  useMemoryCleanup
}

export default memoryManager

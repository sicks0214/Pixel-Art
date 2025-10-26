/**
 * 性能监控工具
 */

// 性能指标接口
export interface PerformanceMetrics {
  // 核心 Web 指标
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  
  // 加载性能
  DOMContentLoaded?: number
  loadComplete?: number
  
  // 自定义指标
  timeToFirstByte?: number
  firstPaint?: number
  firstContentfulPaint?: number
}

// 性能监控类
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.init()
  }

  /**
   * 初始化性能监控
   */
  private init() {
    // 监控核心Web指标
    this.observeWebVitals()
    
    // 监控导航时机
    this.observeNavigation()
    
    // 监控资源加载
    this.observeResources()
  }

  /**
   * 监控核心 Web 指标
   */
  private observeWebVitals() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number }
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime || 0
          console.log('🎯 LCP:', this.metrics.LCP, 'ms')
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observation not supported')
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime
            console.log('⚡ FID:', this.metrics.FID, 'ms')
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observation not supported')
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.metrics.CLS = clsValue
          console.log('📐 CLS:', this.metrics.CLS)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observation not supported')
      }
    }
  }

  /**
   * 监控导航时机
   */
  private observeNavigation() {
    // 页面加载完成事件
    window.addEventListener('DOMContentLoaded', () => {
      this.metrics.DOMContentLoaded = performance.now()
      console.log('📄 DOMContentLoaded:', this.metrics.DOMContentLoaded, 'ms')
    })

    window.addEventListener('load', () => {
      this.metrics.loadComplete = performance.now()
      console.log('✅ Load Complete:', this.metrics.loadComplete, 'ms')
      
      // 计算其他指标
      this.calculateAdditionalMetrics()
    })
  }

  /**
   * 监控资源加载
   */
  private observeResources() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            // 检查是否为资源加载条目
            const resourceEntry = entry as PerformanceResourceTiming
            // 监控大资源加载
            if (resourceEntry.transferSize && resourceEntry.transferSize > 100000) { // 100KB+
              console.log(`📦 Large resource loaded: ${entry.name} (${Math.round(resourceEntry.transferSize / 1024)}KB)`)
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('Resource observation not supported')
      }
    }
  }

  /**
   * 计算额外性能指标
   */
  private calculateAdditionalMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      this.metrics.timeToFirstByte = navigation.responseStart - navigation.requestStart
      console.log('🚀 TTFB:', this.metrics.timeToFirstByte, 'ms')
    }

    // First Paint
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')

    if (firstPaint) {
      this.metrics.firstPaint = firstPaint.startTime
      console.log('🎨 First Paint:', this.metrics.firstPaint, 'ms')
    }

    if (firstContentfulPaint) {
      this.metrics.firstContentfulPaint = firstContentfulPaint.startTime
      console.log('🖼️ FCP:', this.metrics.firstContentfulPaint, 'ms')
    }
  }

  /**
   * 获取当前性能指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * 记录自定义性能标记
   */
  mark(name: string) {
    performance.mark(name)
    console.log(`📍 Performance mark: ${name}`)
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (endMark) {
      performance.measure(name, startMark, endMark)
    } else {
      performance.measure(name, startMark)
    }
    
    const measures = performance.getEntriesByName(name, 'measure')
    const lastMeasure = measures[measures.length - 1]
    console.log(`⏱️ Performance measure: ${name} = ${lastMeasure.duration}ms`)
    
    return lastMeasure.duration
  }

  /**
   * 监控组件渲染性能
   */
  measureComponentRender(componentName: string, renderFn: () => void) {
    const startMark = `${componentName}-render-start`
    const endMark = `${componentName}-render-end`
    
    this.mark(startMark)
    renderFn()
    this.mark(endMark)
    
    return this.measure(`${componentName}-render`, startMark, endMark)
  }

  /**
   * 清理监控器
   */
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const metrics = this.getMetrics()
    
    let report = '📊 性能报告\n'
    report += '==================\n'
    
    if (metrics.LCP) {
      const lcpScore = metrics.LCP <= 2500 ? '🟢 优秀' : metrics.LCP <= 4000 ? '🟡 良好' : '🔴 需要改进'
      report += `LCP (最大内容绘制): ${metrics.LCP}ms ${lcpScore}\n`
    }
    
    if (metrics.FID) {
      const fidScore = metrics.FID <= 100 ? '🟢 优秀' : metrics.FID <= 300 ? '🟡 良好' : '🔴 需要改进'
      report += `FID (首次输入延迟): ${metrics.FID}ms ${fidScore}\n`
    }
    
    if (metrics.CLS !== undefined) {
      const clsScore = metrics.CLS <= 0.1 ? '🟢 优秀' : metrics.CLS <= 0.25 ? '🟡 良好' : '🔴 需要改进'
      report += `CLS (累积布局偏移): ${metrics.CLS} ${clsScore}\n`
    }
    
    if (metrics.firstContentfulPaint) {
      report += `FCP (首次内容绘制): ${metrics.firstContentfulPaint}ms\n`
    }
    
    if (metrics.timeToFirstByte) {
      report += `TTFB (首字节时间): ${metrics.timeToFirstByte}ms\n`
    }
    
    if (metrics.loadComplete) {
      report += `页面加载完成: ${metrics.loadComplete}ms\n`
    }
    
    return report
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    mark: (name: string) => performanceMonitor.mark(name),
    measure: (name: string, startMark: string, endMark?: string) => 
      performanceMonitor.measure(name, startMark, endMark),
    getMetrics: () => performanceMonitor.getMetrics(),
    generateReport: () => performanceMonitor.generateReport(),
  }
} 
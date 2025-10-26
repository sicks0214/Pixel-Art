import { useRef, useEffect } from 'react'

/**
 * 代码质量检查工具
 * 提供运行时的代码质量分析和性能监控
 */

// 代码质量指标
interface CodeQualityMetrics {
  componentCount: number
  hookCount: number
  memoryLeaks: number
  performanceIssues: number
  errorRate: number
  renderCount: number
  bundleSize?: number
  loadTime: number
}

// 性能阈值配置
const PERFORMANCE_THRESHOLDS = {
  renderTime: 16, // 16ms (60fps)
  memoryUsage: 50 * 1024 * 1024, // 50MB
  bundleSize: 2 * 1024 * 1024, // 2MB
  loadTime: 3000, // 3秒
  errorRate: 0.01 // 1%
}

// 全局质量监控器
class CodeQualityMonitor {
  private metrics: CodeQualityMetrics = {
    componentCount: 0,
    hookCount: 0,
    memoryLeaks: 0,
    performanceIssues: 0,
    errorRate: 0,
    renderCount: 0,
    loadTime: 0
  }

  private errors: Error[] = []
  private warnings: string[] = []
  private startTime = performance.now()
  private renderTimes: number[] = []

  // 记录组件渲染
  recordComponentRender(componentName: string, renderTime: number) {
    this.metrics.renderCount++
    this.renderTimes.push(renderTime)

    if (renderTime > PERFORMANCE_THRESHOLDS.renderTime) {
      this.metrics.performanceIssues++
      this.addWarning(`组件 ${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`)
    }

    console.log(`[Quality] ${componentName} 渲染: ${renderTime.toFixed(2)}ms`)
  }

  // 记录Hook使用
  recordHookUsage(hookName: string, componentName: string) {
    this.metrics.hookCount++
    console.log(`[Quality] Hook ${hookName} 在 ${componentName} 中使用`)
  }

  // 记录错误
  recordError(error: Error, context?: string) {
    this.errors.push(error)
    this.metrics.errorRate = this.errors.length / Math.max(this.metrics.renderCount, 1)
    
    console.error(`[Quality] 错误记录:`, error, context ? `上下文: ${context}` : '')
  }

  // 添加警告
  addWarning(warning: string) {
    this.warnings.push(warning)
    console.warn(`[Quality] ${warning}`)
  }

  // 检查内存泄漏
  checkMemoryLeaks() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize

      if (memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
        this.metrics.memoryLeaks++
        this.addWarning(`内存使用过高: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`)
      }
    }
  }

  // 分析Bundle大小（如果可用）
  analyzeBundleSize() {
    // 尝试从performance API获取资源信息
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      let totalSize = 0

      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          totalSize += resource.encodedBodySize || resource.decodedBodySize || 0
        }
      })

      if (totalSize > 0) {
        this.metrics.bundleSize = totalSize
        
        if (totalSize > PERFORMANCE_THRESHOLDS.bundleSize) {
          this.addWarning(`Bundle大小过大: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
        }
      }
    }
  }

  // 获取质量报告
  getQualityReport(): {
    metrics: CodeQualityMetrics
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    suggestions: string[]
    score: number
  } {
    this.checkMemoryLeaks()
    this.analyzeBundleSize()

    const currentTime = performance.now()
    this.metrics.loadTime = currentTime - this.startTime

    // 计算平均渲染时间
    const avgRenderTime = this.renderTimes.length > 0 
      ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length 
      : 0

    // 计算质量分数 (100分制)
    let score = 100
    
    // 性能扣分
    if (avgRenderTime > PERFORMANCE_THRESHOLDS.renderTime) score -= 20
    if (this.metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime) score -= 15
    if (this.metrics.bundleSize && this.metrics.bundleSize > PERFORMANCE_THRESHOLDS.bundleSize) score -= 15
    
    // 稳定性扣分
    if (this.metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRate) score -= 25
    if (this.metrics.memoryLeaks > 0) score -= 10
    if (this.metrics.performanceIssues > 5) score -= 15

    // 确定等级
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (score >= 90) grade = 'A'
    else if (score >= 80) grade = 'B'
    else if (score >= 70) grade = 'C'
    else if (score >= 60) grade = 'D'
    else grade = 'F'

    // 生成建议
    const suggestions: string[] = []
    
    if (avgRenderTime > PERFORMANCE_THRESHOLDS.renderTime) {
      suggestions.push('优化组件渲染性能，考虑使用React.memo或useMemo')
    }
    
    if (this.metrics.loadTime > PERFORMANCE_THRESHOLDS.loadTime) {
      suggestions.push('优化应用加载时间，考虑代码分割和懒加载')
    }
    
    if (this.metrics.bundleSize && this.metrics.bundleSize > PERFORMANCE_THRESHOLDS.bundleSize) {
      suggestions.push('减小Bundle大小，移除未使用的依赖')
    }
    
    if (this.metrics.errorRate > PERFORMANCE_THRESHOLDS.errorRate) {
      suggestions.push('降低错误率，加强错误处理和测试')
    }
    
    if (this.metrics.memoryLeaks > 0) {
      suggestions.push('修复内存泄漏，确保正确清理事件监听器和定时器')
    }

    return {
      metrics: { ...this.metrics },
      grade,
      suggestions,
      score: Math.max(0, score)
    }
  }

  // 输出详细报告
  logDetailedReport() {
    const report = this.getQualityReport()
    
    console.group('🎯 代码质量报告')
    console.log(`总分: ${report.score}/100 (${report.grade})`)
    console.log('指标详情:', report.metrics)
    
    if (report.suggestions.length > 0) {
      console.group('💡 优化建议')
      report.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`)
      })
      console.groupEnd()
    }
    
    if (this.warnings.length > 0) {
      console.group('⚠️ 警告列表')
      this.warnings.forEach((warning, index) => {
        console.warn(`${index + 1}. ${warning}`)
      })
      console.groupEnd()
    }
    
    if (this.errors.length > 0) {
      console.group('❌ 错误列表')
      this.errors.forEach((error, index) => {
        console.error(`${index + 1}.`, error)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }

  // 重置指标
  reset() {
    this.metrics = {
      componentCount: 0,
      hookCount: 0,
      memoryLeaks: 0,
      performanceIssues: 0,
      errorRate: 0,
      renderCount: 0,
      loadTime: 0
    }
    this.errors = []
    this.warnings = []
    this.startTime = performance.now()
    this.renderTimes = []
  }
}

// 全局监控器实例
export const codeQualityMonitor = new CodeQualityMonitor()

/**
 * React Hook for component quality monitoring
 */
export function useQualityMonitor(componentName: string) {
  const renderStart = useRef<number>(0)
  
  const startRender = () => {
    renderStart.current = performance.now()
  }
  
  const endRender = () => {
    if (renderStart.current) {
      const renderTime = performance.now() - renderStart.current
      codeQualityMonitor.recordComponentRender(componentName, renderTime)
    }
  }

  const recordHook = (hookName: string) => {
    codeQualityMonitor.recordHookUsage(hookName, componentName)
  }

  const recordError = (error: Error, context?: string) => {
    codeQualityMonitor.recordError(error, `${componentName}: ${context || ''}`)
  }

  return { startRender, endRender, recordHook, recordError }
}

/**
 * 自动质量检查Hook
 */
export function useAutoQualityCheck(interval: number = 30000) {
  useEffect(() => {
    const checkInterval = setInterval(() => {
      codeQualityMonitor.checkMemoryLeaks()
    }, interval)

    return () => clearInterval(checkInterval)
  }, [interval])

  useEffect(() => {
    // 页面卸载时输出最终报告
    const handleBeforeUnload = () => {
      if (process.env.NODE_ENV === 'development') {
        codeQualityMonitor.logDetailedReport()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}

/**
 * 性能分析装饰器
 */
export function withPerformanceAnalysis<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now()
    
    try {
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start
          console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms (async)`)
        })
      } else {
        const duration = performance.now() - start
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
        return result
      }
    } catch (error) {
      codeQualityMonitor.recordError(error as Error, `Performance analysis: ${name}`)
      throw error
    }
  }) as T
}

export default codeQualityMonitor

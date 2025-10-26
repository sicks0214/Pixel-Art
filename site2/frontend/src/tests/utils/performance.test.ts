/**
 * 性能监控工具测试示例
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { performanceMonitor } from '@/utils/performance'

// 模拟 performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  now: vi.fn(() => 100),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => [{ duration: 50 }]),
}

Object.defineProperty(globalThis, 'performance', {
  writable: true,
  value: mockPerformance,
})

describe('Performance Monitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应该能够创建性能标记', () => {
    performanceMonitor.mark('test-mark')
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('test-mark')
  })

  it('应该能够测量性能', () => {
    const duration = performanceMonitor.measure('test-measure', 'start-mark', 'end-mark')
    
    expect(mockPerformance.measure).toHaveBeenCalledWith('test-measure', 'start-mark', 'end-mark')
    expect(duration).toBe(50) // 来自模拟的 getEntriesByName
  })

  it('应该能够获取当前指标', () => {
    const metrics = performanceMonitor.getMetrics()
    
    expect(metrics).toBeDefined()
    expect(typeof metrics).toBe('object')
  })

  it('应该能够生成性能报告', () => {
    const report = performanceMonitor.generateReport()
    
    expect(report).toBeDefined()
    expect(typeof report).toBe('string')
    expect(report).toContain('性能报告')
  })
}) 
/**
 * 旋转调试器 - 独立旋转功能模块
 * 提供旋转操作的调试、追踪和验证功能
 */

import { RotationState, isValidAngle, formatAngle } from './rotationHelper'

interface RotationLogEntry {
  timestamp: number
  elementId: string
  action: 'start' | 'update' | 'end'
  angle: number
  deltaAngle?: number
  isSnapped?: boolean
  metadata?: Record<string, any>
}

class RotationDebuggerClass {
  private logs: RotationLogEntry[] = []
  private enabled: boolean = false
  private maxLogs: number = 100

  constructor() {
    // 自动检测开发环境
    this.enabled = this.isDevEnvironment()
  }

  /**
   * 检测是否为开发环境
   */
  private isDevEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           (window.location.hostname === 'localhost' || 
            window.location.hostname.includes('dev'))
  }

  /**
   * 启用或禁用调试
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * 检查是否启用调试
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 记录旋转开始
   */
  logRotationStart(
    elementId: string,
    element: any,
    startAngle: number,
    centerX: number,
    centerY: number
  ) {
    if (!this.enabled) return

    const logEntry: RotationLogEntry = {
      timestamp: Date.now(),
      elementId,
      action: 'start',
      angle: startAngle,
      metadata: {
        elementType: element.type,
        centerX,
        centerY,
        initialRotation: element.rotation || 0
      }
    }

    this.addLog(logEntry)
    
    console.log('🔄 旋转开始:', {
      elementId,
      elementType: element.type,
      startAngle: formatAngle(startAngle),
      center: `(${centerX.toFixed(1)}, ${centerY.toFixed(1)})`
    })
  }

  /**
   * 记录旋转更新
   */
  logRotationUpdate(
    elementId: string,
    element: any,
    newElement: any,
    mouseData: { mouseX: number; mouseY: number; angle: number }
  ) {
    if (!this.enabled) return

    const oldAngle = element.rotation || 0
    const newAngle = newElement.rotation || 0
    const deltaAngle = newAngle - oldAngle

    const logEntry: RotationLogEntry = {
      timestamp: Date.now(),
      elementId,
      action: 'update',
      angle: newAngle,
      deltaAngle,
      metadata: {
        mouseAngle: mouseData.angle,
        mousePosition: `(${mouseData.mouseX.toFixed(1)}, ${mouseData.mouseY.toFixed(1)})`,
        oldAngle,
        newAngle
      }
    }

    this.addLog(logEntry)

    // 🔧 减少控制台日志频率，配合节流机制
    // 只在开发环境且角度变化较大时显示详细日志
    if (this.enabled && Math.abs(deltaAngle) > 8) { // 🔧 第四轮优化：6度 -> 8度 (降低30%敏感度)
      console.log('🔄 旋转更新:', {
        elementId,
        oldAngle: formatAngle(oldAngle),
        newAngle: formatAngle(newAngle),
        deltaAngle: formatAngle(deltaAngle),
        mouseAngle: formatAngle(mouseData.angle)
      })
    }
  }

  /**
   * 记录旋转结束
   */
  logRotationEnd(elementId: string, element: any, finalAngle: number) {
    if (!this.enabled) return

    const logEntry: RotationLogEntry = {
      timestamp: Date.now(),
      elementId,
      action: 'end',
      angle: finalAngle,
      metadata: {
        finalRotation: finalAngle,
        normalizedAngle: (finalAngle % 360 + 360) % 360
      }
    }

    this.addLog(logEntry)
    
    console.log('🔄 旋转结束:', {
      elementId,
      finalAngle: formatAngle(finalAngle),
      normalizedAngle: formatAngle((finalAngle % 360 + 360) % 360)
    })
  }

  /**
   * 记录角度吸附
   */
  logAngleSnap(elementId: string, originalAngle: number, snappedAngle: number) {
    if (!this.enabled) return

    console.log('🧲 角度吸附:', {
      elementId,
      原始角度: formatAngle(originalAngle),
      吸附角度: formatAngle(snappedAngle),
      差值: formatAngle(Math.abs(snappedAngle - originalAngle))
    })
  }

  /**
   * 验证旋转一致性
   */
  validateRotationConsistency(element: any): boolean {
    if (!this.enabled) return true

    const issues: string[] = []
    
    // 检查角度有效性
    const rotation = element.rotation || 0
    if (!isValidAngle(rotation)) {
      issues.push(`无效的旋转角度: ${rotation}`)
    }

    // 检查角度范围
    if (rotation < -720 || rotation > 720) {
      issues.push(`旋转角度超出合理范围: ${formatAngle(rotation)}`)
    }

    // 检查元素状态
    if (element.type === 'text' && !element.data) {
      issues.push('文字元素缺少data属性')
    }

    if (issues.length > 0) {
      console.warn('🚨 旋转一致性问题:', {
        elementId: element.id,
        issues
      })
      return false
    }

    return true
  }

  /**
   * 添加日志条目
   */
  private addLog(entry: RotationLogEntry) {
    this.logs.push(entry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 10): RotationLogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * 获取特定元素的日志
   */
  getElementLogs(elementId: string): RotationLogEntry[] {
    return this.logs.filter(log => log.elementId === elementId)
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    if (this.enabled) {
      console.log('🧹 旋转调试日志已清空')
    }
  }

  /**
   * 导出调试数据
   */
  exportDebugData() {
    return {
      enabled: this.enabled,
      logsCount: this.logs.length,
      logs: this.logs,
      timestamp: Date.now()
    }
  }

  /**
   * 分析旋转性能
   */
  analyzePerformance(): {
    totalOperations: number
    averageRotationTime: number
    rotationFrequency: number
  } {
    if (this.logs.length === 0) {
      return {
        totalOperations: 0,
        averageRotationTime: 0,
        rotationFrequency: 0
      }
    }

    const startLogs = this.logs.filter(log => log.action === 'start')
    const endLogs = this.logs.filter(log => log.action === 'end')
    
    let totalTime = 0
    let completedOperations = 0

    startLogs.forEach(startLog => {
      const endLog = endLogs.find(
        endLog => endLog.elementId === startLog.elementId && 
                  endLog.timestamp > startLog.timestamp
      )
      
      if (endLog) {
        totalTime += endLog.timestamp - startLog.timestamp
        completedOperations++
      }
    })

    const timeSpan = this.logs.length > 1 ? 
      this.logs[this.logs.length - 1].timestamp - this.logs[0].timestamp : 0

    return {
      totalOperations: completedOperations,
      averageRotationTime: completedOperations > 0 ? totalTime / completedOperations : 0,
      rotationFrequency: timeSpan > 0 ? (this.logs.length / timeSpan) * 1000 : 0
    }
  }

  /**
   * 显示调试统计
   */
  showDebugStats() {
    if (!this.enabled) return

    const stats = this.analyzePerformance()
    console.group('📊 旋转调试统计')
    console.log('总操作数:', stats.totalOperations)
    console.log('平均旋转时间:', `${stats.averageRotationTime.toFixed(2)}ms`)
    console.log('操作频率:', `${stats.rotationFrequency.toFixed(2)}次/秒`)
    console.log('日志条目:', this.logs.length)
    console.groupEnd()
  }
}

// 创建单例实例
export const RotationDebugger = new RotationDebuggerClass()

// 在开发环境下添加到全局对象，方便调试
if (typeof window !== 'undefined' && RotationDebugger.isEnabled()) {
  (window as any).RotationDebugger = RotationDebugger
} 
/**
 * 缩放调试工具模块
 * 用于追踪和调试文字缩放过程中的状态变化
 */

export interface ScaleDebugInfo {
  elementId: string
  timestamp: number
  action: 'start' | 'update' | 'end'
  before: {
    width: number
    height: number
    scaleX: number
    scaleY: number
  }
  after?: {
    width: number
    height: number
    scaleX: number
    scaleY: number
  }
  delta?: {
    mouseX: number
    mouseY: number
  }
  direction?: string
}

/**
 * 缩放调试器
 */
export class ScaleDebugger {
  private static logs: ScaleDebugInfo[] = []
  private static isEnabled = typeof window !== 'undefined' && window.location.hostname === 'localhost' // 🔧 简化开发环境检测
  
  /**
   * 记录缩放开始
   */
  static logScaleStart(elementId: string, element: any, direction: string) {
    if (!this.isEnabled) return
    
    const info: ScaleDebugInfo = {
      elementId,
      timestamp: Date.now(),
      action: 'start',
      before: {
        width: element.width,
        height: element.height,
        scaleX: element.scaleX || 1,
        scaleY: element.scaleY || 1
      },
      direction
    }
    
    this.logs.push(info)
    console.log('🎯 缩放开始:', info)
  }
  
  /**
   * 记录缩放更新
   */
  static logScaleUpdate(elementId: string, before: any, after: any, delta: { mouseX: number, mouseY: number }) {
    if (!this.isEnabled) return
    
    const info: ScaleDebugInfo = {
      elementId,
      timestamp: Date.now(),
      action: 'update',
      before: {
        width: before.width,
        height: before.height,
        scaleX: before.scaleX || 1,
        scaleY: before.scaleY || 1
      },
      after: {
        width: after.width,
        height: after.height,
        scaleX: after.scaleX || 1,
        scaleY: after.scaleY || 1
      },
      delta
    }
    
    this.logs.push(info)
    
    // 只显示关键变化
    if (Math.abs((after.scaleX || 1) - (before.scaleX || 1)) > 0.01) {
      console.log('📏 缩放更新:', {
        scale: `${Math.round((before.scaleX || 1) * 100)}% → ${Math.round((after.scaleX || 1) * 100)}%`,
        size: `${before.width}×${before.height} → ${after.width}×${after.height}`,
        delta: `Δ${delta.mouseX},${delta.mouseY}`
      })
    }
  }
  
  /**
   * 记录缩放结束
   */
  static logScaleEnd(elementId: string, finalElement: any) {
    if (!this.isEnabled) return
    
    const info: ScaleDebugInfo = {
      elementId,
      timestamp: Date.now(),
      action: 'end',
      before: {
        width: finalElement.width,
        height: finalElement.height,
        scaleX: finalElement.scaleX || 1,
        scaleY: finalElement.scaleY || 1
      }
    }
    
    this.logs.push(info)
    console.log('🏁 缩放结束:', `最终缩放 ${Math.round((finalElement.scaleX || 1) * 100)}%`)
  }
  
  /**
   * 获取最近的调试日志
   */
  static getRecentLogs(count = 10): ScaleDebugInfo[] {
    return this.logs.slice(-count)
  }
  
  /**
   * 清空调试日志
   */
  static clearLogs() {
    this.logs = []
  }
  
  /**
   * 启用/禁用调试
   */
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }
  
  /**
   * 验证缩放状态一致性
   */
  static validateScaleConsistency(element: any): boolean {
    const scaleX = element.scaleX || 1
    const scaleY = element.scaleY || 1
    const baseFontSize = element.data?.fontSize || 36
    const actualFontSize = baseFontSize * scaleX
    
    const isConsistent = Math.abs(scaleX - scaleY) < 0.01 && 
                        actualFontSize >= 7.2 && // 36 * 0.2
                        actualFontSize <= 180    // 36 * 5
    
    if (!isConsistent && this.isEnabled) {
      console.warn('⚠️ 缩放状态不一致:', {
        scaleX,
        scaleY,
        baseFontSize,
        actualFontSize,
        element
      })
    }
    
    return isConsistent
  }
} 
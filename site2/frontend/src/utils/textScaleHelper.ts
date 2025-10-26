/**
 * 文字缩放工具模块
 * 专门处理文字元素的缩放计算和约束逻辑
 */

export interface ScaleCalculationParams {
  startWidth: number
  startHeight: number
  newWidth: number
  newHeight: number
  currentScaleX: number
  currentScaleY: number
  direction: string
}

export interface ScaleResult {
  scaleX: number
  scaleY: number
  isValid: boolean
}

/**
 * 文字缩放计算器
 */
export class TextScaleHelper {
  // 缩放限制
  private static readonly MIN_SCALE = 0.2
  private static readonly MAX_SCALE = 5.0
  
  /**
   * 计算文字元素的新缩放比例
   */
  static calculateTextScale(params: ScaleCalculationParams): ScaleResult {
    const { startWidth, startHeight, newWidth, newHeight, currentScaleX, currentScaleY } = params
    
    // 计算尺寸变化比例
    const widthRatio = newWidth / startWidth
    const heightRatio = newHeight / startHeight
    
    // 🔧 使用更直观的缩放计算方式
    // 对于文字，主要基于高度变化，因为文字大小主要影响高度
    let newScale: number
    
    // 根据变化较大的维度来确定缩放
    if (Math.abs(heightRatio - 1) > Math.abs(widthRatio - 1)) {
      newScale = currentScaleX * heightRatio
    } else {
      newScale = currentScaleX * widthRatio
    }
    
    // 应用缩放限制
    const clampedScale = Math.max(this.MIN_SCALE, Math.min(newScale, this.MAX_SCALE))
    
    return {
      scaleX: clampedScale,
      scaleY: clampedScale, // 保持等比缩放
      isValid: clampedScale >= this.MIN_SCALE && clampedScale <= this.MAX_SCALE
    }
  }
  
  /**
   * 验证缩放值是否在有效范围内
   */
  static isValidScale(scale: number): boolean {
    return scale >= this.MIN_SCALE && scale <= this.MAX_SCALE
  }
  
  /**
   * 约束缩放值到有效范围
   */
  static clampScale(scale: number): number {
    return Math.max(this.MIN_SCALE, Math.min(scale, this.MAX_SCALE))
  }
  
  /**
   * 格式化缩放百分比显示
   */
  static formatScalePercentage(scale: number): string {
    return `${Math.round(scale * 100)}%`
  }
  
  /**
   * 计算基于初始尺寸的相对缩放
   */
  static calculateRelativeScale(
    initialWidth: number,
    initialHeight: number,
    currentWidth: number,
    currentHeight: number
  ): number {
    // 使用几何平均值计算相对缩放
    const widthScale = currentWidth / initialWidth
    const heightScale = currentHeight / initialHeight
    return Math.sqrt(widthScale * heightScale)
  }
} 
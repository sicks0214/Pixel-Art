/**
 * Canvas辅助工具模块
 * 提供Canvas元素的验证、修复和优化功能
 */

import { CanvasElement } from '@/store/canvasStore'
import { TextScaleHelper } from './textScaleHelper'

/**
 * 基础Canvas工具函数 - 从packages/core合并
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function getContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法获取2D渲染上下文')
  }
  return ctx
}

export function resizeCanvas(
  canvas: HTMLCanvasElement, 
  newWidth: number, 
  newHeight: number
): void {
  canvas.width = newWidth
  canvas.height = newHeight
}

/**
 * Canvas工具辅助类
 */
export class CanvasHelper {
  
  /**
   * 验证并修复文字元素的属性
   */
  static validateAndFixTextElement(element: CanvasElement): CanvasElement {
    if (element.type !== 'text') return element
    
    const fixed = { ...element }
    
    // 确保有基础字体大小
    if (!fixed.data.fontSize) {
      fixed.data = { ...fixed.data, fontSize: 36 }
    }
    
    // 确保有缩放属性
    if (typeof fixed.scaleX !== 'number') {
      fixed.scaleX = 1
    }
    if (typeof fixed.scaleY !== 'number') {
      fixed.scaleY = 1
    }
    
    // 验证缩放范围
    fixed.scaleX = TextScaleHelper.clampScale(fixed.scaleX)
    fixed.scaleY = TextScaleHelper.clampScale(fixed.scaleY)
    
    // 确保基本属性
    if (!fixed.data.fontFamily) {
      fixed.data = { ...fixed.data, fontFamily: 'Arial' }
    }
    if (!fixed.data.color) {
      fixed.data = { ...fixed.data, color: '#000000' }
    }
    if (!fixed.data.textAlign) {
      fixed.data = { ...fixed.data, textAlign: 'center' }
    }
    
    return fixed
  }
  
  /**
   * 计算文字元素的实际显示尺寸
   */
  static calculateTextDisplaySize(element: CanvasElement): { 
    actualFontSize: number
    displayWidth: number
    displayHeight: number
  } {
    if (element.type !== 'text') {
      return { actualFontSize: 0, displayWidth: element.width, displayHeight: element.height }
    }
    
    const baseFontSize = element.data.fontSize || 36
    const scale = element.scaleX || 1
    const actualFontSize = baseFontSize * scale
    
    return {
      actualFontSize,
      displayWidth: element.width * scale,
      displayHeight: element.height * scale
    }
  }
  
  /**
   * 检查文字是否需要容器调整
   */
  static checkTextContainerFit(element: CanvasElement): {
    needsResize: boolean
    suggestedWidth?: number
    suggestedHeight?: number
  } {
    if (element.type !== 'text') {
      return { needsResize: false }
    }
    
    const { actualFontSize } = this.calculateTextDisplaySize(element)
    const text = element.data.text || ''
    
    // 估算理想容器尺寸
    const estimatedWidth = text.length * (actualFontSize * 0.6)
    const estimatedHeight = actualFontSize * 1.5
    
    const widthDiff = Math.abs(element.width - estimatedWidth) / element.width
    const heightDiff = Math.abs(element.height - estimatedHeight) / element.height
    
    // 如果尺寸差异超过20%，建议调整
    const needsResize = widthDiff > 0.2 || heightDiff > 0.2
    
    return {
      needsResize,
      suggestedWidth: needsResize ? estimatedWidth : undefined,
      suggestedHeight: needsResize ? estimatedHeight : undefined
    }
  }
  
  /**
   * 优化文字元素的渲染性能
   */
  static optimizeTextElement(element: CanvasElement): CanvasElement {
    if (element.type !== 'text') return element
    
    const optimized = this.validateAndFixTextElement(element)
    
    // 检查容器适配
    const fitCheck = this.checkTextContainerFit(optimized)
    if (fitCheck.needsResize && fitCheck.suggestedWidth && fitCheck.suggestedHeight) {
      optimized.width = fitCheck.suggestedWidth
      optimized.height = fitCheck.suggestedHeight
    }
    
    return optimized
  }
  
  /**
   * 批量验证和修复Canvas元素
   */
  static validateAndFixElements(elements: CanvasElement[]): CanvasElement[] {
    return elements.map(element => {
      if (element.type === 'text') {
        return this.validateAndFixTextElement(element)
      }
      return element
    })
  }
  
  /**
   * 获取文字元素的调试信息
   */
  static getTextElementDebugInfo(element: CanvasElement): any {
    if (element.type !== 'text') return null
    
    const { actualFontSize, displayWidth, displayHeight } = this.calculateTextDisplaySize(element)
    const fitCheck = this.checkTextContainerFit(element)
    
    return {
      id: element.id,
      text: element.data.text,
      baseFontSize: element.data.fontSize || 36,
      scaleX: element.scaleX || 1,
      scaleY: element.scaleY || 1,
      actualFontSize,
      containerSize: { width: element.width, height: element.height },
      displaySize: { width: displayWidth, height: displayHeight },
      position: { x: element.x, y: element.y },
      fitCheck,
      isValid: TextScaleHelper.isValidScale(element.scaleX || 1)
    }
  }
} 
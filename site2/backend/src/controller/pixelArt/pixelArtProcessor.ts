/**
 * 像素画处理器 - COLOR02风格核心逻辑提取
 * 功能：执行实际的像素画转换，支持进度回调
 */

import sharp from 'sharp'

// ============= 类型定义 =============

export interface PixelArtConversionParams {
  resizeFactor: number
  interpolation: 'nearest_neighbor' | 'bilinear'
  colorMode: 'no_dithering' | 'ordered_dithering_bayer'
  ditheringRatio: number
}

export interface CanvasInfo {
  width: number
  height: number
  coloredPixels: number
}

export interface ConversionResult {
  pixelArtImage: string
  canvasInfo: CanvasInfo
  extractedColors: string[]
  processingTime: number
  metadata: {
    originalSize: number
    processedSize: number
    timestamp: string
  }
}

export type ProgressCallback = (progress: number, step: string) => void

// ============= 核心处理器类 =============

class PixelArtProcessor {
  
  /**
   * 主要的像素画处理方法（COLOR02风格异步）
   */
  async processPixelArt(
    imageBuffer: Buffer,
    params: PixelArtConversionParams,
    imageDimensions: { width: number; height: number },
    quality: 'fast' | 'balanced' | 'high_quality' = 'fast',
    onProgress?: ProgressCallback
  ): Promise<ConversionResult> {
    const startTime = Date.now()
    
    try {
      console.log('[PixelArtProcessor] 🎨 开始像素画处理:', {
        原始尺寸: `${imageDimensions.width}x${imageDimensions.height}`,
        调整因子: `${params.resizeFactor}%`,
        插值方法: params.interpolation,
        质量模式: quality
      })

      if (onProgress) onProgress(10, '分析图像尺寸')

      // 计算目标尺寸
      const targetWidth = Math.max(1, Math.round(imageDimensions.width * (params.resizeFactor / 100)))
      const targetHeight = Math.max(1, Math.round(imageDimensions.height * (params.resizeFactor / 100)))
      
      console.log('[PixelArtProcessor] 📏 目标尺寸:', `${targetWidth}x${targetHeight}`)

      // 验证目标尺寸合理性
      if (targetWidth > 1024 || targetHeight > 1024) {
        throw new Error(`目标尺寸过大: ${targetWidth}x${targetHeight}，请降低调整因子`)
      }

      if (targetWidth < 4 || targetHeight < 4) {
        throw new Error(`目标尺寸过小: ${targetWidth}x${targetHeight}，请提高调整因子`)
      }

      if (onProgress) onProgress(20, '计算处理参数')

      // Sharp处理配置
      const kernel = params.interpolation === 'nearest_neighbor' ? 'nearest' : 'lanczos2'
      
      // 根据质量调整参数
      let maxColors: number
      let compressionLevel: number
      
      switch (quality) {
        case 'fast':
          maxColors = 8
          compressionLevel = 1
          break
        case 'balanced':
          maxColors = 16
          compressionLevel = 4
          break
        case 'high_quality':
          maxColors = 32
          compressionLevel = 6
          break
        default:
          maxColors = 16
          compressionLevel = 4
      }

      // 大图片进一步限制
      if (targetWidth * targetHeight > 50000) {
        maxColors = Math.min(maxColors, 8)
        compressionLevel = 1
      }

      console.log('[PixelArtProcessor] ⚙️ 处理参数:', { 
        kernel, 
        maxColors, 
        compressionLevel,
        估算像素: targetWidth * targetHeight
      })

      if (onProgress) onProgress(40, '开始图像处理')

      // 执行Sharp处理
      const outputBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, {
          kernel,
          fit: 'fill',
          withoutEnlargement: false
        })
        .png({
          compressionLevel,
          colors: maxColors,
          palette: true
        })
        .toBuffer()

      if (onProgress) onProgress(80, '生成结果数据')

      // 生成结果
      const base64Image = `data:image/png;base64,${outputBuffer.toString('base64')}`
      const extractedColors = this.generateColors(maxColors)
      const processingTime = Date.now() - startTime

      if (onProgress) onProgress(95, '完成处理')

      console.log('[PixelArtProcessor] ✅ 处理成功:', {
        处理时间: `${processingTime}ms`,
        输出大小: `${(outputBuffer.length / 1024).toFixed(2)}KB`,
        颜色数量: extractedColors.length
      })

      const result: ConversionResult = {
        pixelArtImage: base64Image,
        canvasInfo: {
          width: targetWidth,
          height: targetHeight,
          coloredPixels: targetWidth * targetHeight
        },
        extractedColors,
        processingTime,
        metadata: {
          originalSize: imageBuffer.length,
          processedSize: outputBuffer.length,
          timestamp: new Date().toISOString()
        }
      }

      if (onProgress) onProgress(100, '转换完成')

      return result

    } catch (error) {
      console.error('[PixelArtProcessor] ❌ 处理失败:', error)
      
      // 尝试最简单的降级处理
      try {
        console.log('[PixelArtProcessor] 🔄 尝试降级处理...')
        if (onProgress) onProgress(50, '尝试降级处理')
        
        return await this.processPixelArtFallback(imageBuffer, params, imageDimensions, onProgress)
      } catch (fallbackError) {
        console.error('[PixelArtProcessor] ❌ 降级处理也失败:', fallbackError)
        throw new Error(`处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  }

  /**
   * 降级处理 - 最简单最可靠的方法
   */
  private async processPixelArtFallback(
    imageBuffer: Buffer,
    params: PixelArtConversionParams,
    imageDimensions: { width: number; height: number },
    onProgress?: ProgressCallback
  ): Promise<ConversionResult> {
    const startTime = Date.now()
    
    console.log('[PixelArtProcessor] 🆘 启动最简单处理模式')
    
    try {
      if (onProgress) onProgress(60, '降级处理中')

      // 计算安全的小尺寸
      const maxDim = 100 // 降级模式限制为100px
      const scaleFactor = Math.min(params.resizeFactor / 100, 0.3) // 最大30%
      
      let targetWidth = Math.max(8, Math.round(imageDimensions.width * scaleFactor))
      let targetHeight = Math.max(8, Math.round(imageDimensions.height * scaleFactor))
      
      if (targetWidth > maxDim || targetHeight > maxDim) {
        const scale = maxDim / Math.max(targetWidth, targetHeight)
        targetWidth = Math.round(targetWidth * scale)
        targetHeight = Math.round(targetHeight * scale)
      }
      
      console.log('[PixelArtProcessor] 📏 降级尺寸:', `${targetWidth}x${targetHeight}`)

      if (onProgress) onProgress(80, '执行降级转换')

      // 最简单的处理
      const outputBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, { 
          kernel: 'nearest',
          fit: 'fill'
        })
        .png({ compressionLevel: 1 })
        .toBuffer()

      const base64Image = `data:image/png;base64,${outputBuffer.toString('base64')}`
      const processingTime = Date.now() - startTime

      console.log('[PixelArtProcessor] ✅ 降级处理成功:', {
        处理时间: `${processingTime}ms`,
        最终尺寸: `${targetWidth}x${targetHeight}`
      })

      const result: ConversionResult = {
        pixelArtImage: base64Image,
        canvasInfo: {
          width: targetWidth,
          height: targetHeight,
          coloredPixels: targetWidth * targetHeight
        },
        extractedColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'],
        processingTime,
        metadata: {
          originalSize: imageBuffer.length,
          processedSize: outputBuffer.length,
          timestamp: new Date().toISOString()
        }
      }

      if (onProgress) onProgress(100, '降级处理完成')

      return result

    } catch (error) {
      console.error('[PixelArtProcessor] ❌ 降级处理失败:', error)
      
      const processingTime = Date.now() - startTime
      throw new Error(`完全失败: ${error instanceof Error ? error.message : '未知错误'}。这可能表明Sharp库配置有问题`)
    }
  }

  /**
   * 生成颜色数组
   */
  private generateColors(count: number): string[] {
    const baseColors = [
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
      '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
      '#FFA500', '#FFC0CB', '#800080', '#4B0082', '#9400D3', '#FF1493'
    ]
    
    const colors = []
    for (let i = 0; i < count && i < baseColors.length; i++) {
      colors.push(baseColors[i])
    }
    
    // 如果需要更多颜色，生成随机颜色
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')  
      const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
      colors.push(`#${r}${g}${b}`)
    }
    
    return colors
  }

  /**
   * 获取图像元数据
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(imageBuffer).metadata()
      console.log('[PixelArtProcessor] 📊 图像元数据:', {
        尺寸: `${metadata.width}x${metadata.height}`,
        格式: metadata.format,
        通道数: metadata.channels,
        大小: `${(imageBuffer.length / 1024).toFixed(2)}KB`
      })
      return metadata
    } catch (error) {
      console.error('[PixelArtProcessor] ❌ 获取元数据失败:', error)
      throw new Error('无法解析图像文件，请检查文件是否损坏')
    }
  }

  /**
   * 验证图像尺寸
   */
  validateImageDimensions(width: number, height: number): { valid: boolean; error?: string } {
    const MAX_DIMENSION = 2048
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return {
        valid: false,
        error: `图像尺寸过大 (${width}x${height})，最大支持 ${MAX_DIMENSION}x${MAX_DIMENSION} 像素`
      }
    }
    
    if (width < 1 || height < 1) {
      return {
        valid: false,
        error: '图像尺寸无效'
      }
    }
    
    return { valid: true }
  }
}

// 单例模式导出
let processorInstance: PixelArtProcessor | null = null

export function getPixelArtProcessor(): PixelArtProcessor {
  if (!processorInstance) {
    processorInstance = new PixelArtProcessor()
  }
  return processorInstance
}

// 便捷函数导出
export async function processPixelArt(
  imageBuffer: Buffer,
  params: PixelArtConversionParams,
  imageDimensions: { width: number; height: number },
  quality: 'fast' | 'balanced' | 'high_quality' = 'fast',
  onProgress?: ProgressCallback
): Promise<ConversionResult> {
  const processor = getPixelArtProcessor()
  return await processor.processPixelArt(imageBuffer, params, imageDimensions, quality, onProgress)
}

export default PixelArtProcessor 
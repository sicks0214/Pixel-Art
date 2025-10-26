/**
 * 图片压缩服务 - COLOR03上传性能优化
 * 功能：浏览器端图片压缩，减少上传时间
 */

// 压缩配置
export interface CompressionOptions {
  maxSizeMB: number           // 最大文件大小（MB）
  maxWidthOrHeight: number    // 最大宽度或高度（像素）
  useWebWorker: boolean       // 是否使用Web Worker
  quality: number             // 压缩质量（0-1）
  preserveExif: boolean       // 是否保留EXIF信息
}

// 压缩结果
export interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  processingTime: number
  dimensions: {
    original: { width: number; height: number }
    compressed: { width: number; height: number }
  }
}

// 默认压缩配置
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 2,                // 压缩到2MB以下
  maxWidthOrHeight: 1920,      // 最大1920像素
  useWebWorker: true,          // 使用Web Worker避免UI阻塞
  quality: 0.8,                // 80%质量
  preserveExif: false          // 移除EXIF减少大小
}

// 针对像素画的特殊配置
export const PIXEL_ART_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 5,                // 像素画可以稍大一些
  maxWidthOrHeight: 2048,      // 支持更大尺寸
  useWebWorker: true,
  quality: 0.9,                // 更高质量保持细节
  preserveExif: false
}

/**
 * 图片压缩服务类
 */
class ImageCompressionService {
  
  /**
   * 压缩图片文件（浏览器原生实现）
   */
  async compressImage(
    file: File, 
    options: Partial<CompressionOptions> = {}
  ): Promise<CompressionResult> {
    const startTime = performance.now()
    
    try {
      console.log('[ImageCompression] 🗜️ 开始压缩图片:', {
        fileName: file.name,
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      })

      // 合并配置
      const config: CompressionOptions = {
        ...DEFAULT_COMPRESSION_OPTIONS,
        ...options
      }

      // 如果文件已经足够小，直接返回
      if (file.size <= config.maxSizeMB * 1024 * 1024) {
        console.log('[ImageCompression] ✅ 文件已足够小，无需压缩')
        
        const dimensions = await this.getImageDimensions(file)
        
        return {
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 1,
          processingTime: performance.now() - startTime,
          dimensions: {
            original: dimensions,
            compressed: dimensions
          }
        }
      }

      // 获取原始图片信息
      const originalDimensions = await this.getImageDimensions(file)
      
      // 使用Canvas进行压缩
      const compressedFile = await this.compressWithCanvas(file, config, originalDimensions)
      const compressedDimensions = await this.getImageDimensions(compressedFile)
      
      const processingTime = performance.now() - startTime
      const compressionRatio = file.size / compressedFile.size

      console.log('[ImageCompression] ✅ 压缩完成:', {
        原始大小: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        压缩后: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        压缩比: `${compressionRatio.toFixed(2)}x`,
        处理时间: `${processingTime.toFixed(2)}ms`,
        尺寸变化: `${originalDimensions.width}×${originalDimensions.height} → ${compressedDimensions.width}×${compressedDimensions.height}`
      })

      return {
        compressedFile,
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio,
        processingTime,
        dimensions: {
          original: originalDimensions,
          compressed: compressedDimensions
        }
      }

    } catch (error) {
      console.error('[ImageCompression] ❌ 压缩失败:', error)
      
      // 压缩失败时返回原文件
      const dimensions = await this.getImageDimensions(file)
      
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        processingTime: performance.now() - startTime,
        dimensions: {
          original: dimensions,
          compressed: dimensions
        }
      }
    }
  }

  /**
   * 使用Canvas压缩图片
   */
  private async compressWithCanvas(
    file: File, 
    options: CompressionOptions,
    originalDimensions: { width: number; height: number }
  ): Promise<File> {
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      const img = new Image()
      
      img.onload = () => {
        try {
          // 计算目标尺寸（保持宽高比）
          const { width: targetWidth, height: targetHeight } = this.calculateTargetDimensions(
            originalDimensions, 
            options.maxWidthOrHeight
          )

          // 设置Canvas尺寸
          canvas.width = targetWidth
          canvas.height = targetHeight

          // 设置高质量渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // 绘制压缩后的图片
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 创建新的File对象
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg', // 统一使用JPEG格式压缩
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Canvas转换失败'))
              }
            },
            'image/jpeg',
            options.quality
          )
          
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 计算目标尺寸（保持宽高比）
   */
  private calculateTargetDimensions(
    original: { width: number; height: number },
    maxSize: number
  ): { width: number; height: number } {
    
    if (original.width <= maxSize && original.height <= maxSize) {
      return original
    }

    const aspectRatio = original.width / original.height

    if (original.width > original.height) {
      // 宽图
      return {
        width: maxSize,
        height: Math.round(maxSize / aspectRatio)
      }
    } else {
      // 高图或正方形
      return {
        width: Math.round(maxSize * aspectRatio),
        height: maxSize
      }
    }
  }

  /**
   * 获取图片尺寸
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
        URL.revokeObjectURL(img.src)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('无法获取图片尺寸'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 快速尺寸检查（不加载完整图片）
   */
  async quickSizeCheck(file: File): Promise<boolean> {
    try {
      const dimensions = await this.getImageDimensions(file)
      
      // 如果图片很小，不需要压缩
      if (dimensions.width <= 800 && dimensions.height <= 600) {
        return false
      }
      
      // 如果文件很小，不需要压缩
      if (file.size <= 1 * 1024 * 1024) { // 1MB
        return false
      }
      
      return true
      
    } catch (error) {
      console.warn('[ImageCompression] 快速检查失败，建议压缩:', error)
      return true
    }
  }

  /**
   * 智能压缩（根据文件自动选择策略）
   */
  async smartCompress(file: File): Promise<CompressionResult> {
    const needsCompression = await this.quickSizeCheck(file)
    
    if (!needsCompression) {
      console.log('[ImageCompression] 🚀 文件无需压缩，直接使用')
      const dimensions = await this.getImageDimensions(file)
      
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        processingTime: 0,
        dimensions: {
          original: dimensions,
          compressed: dimensions
        }
      }
    }

    // 根据文件大小选择压缩策略
    let compressionOptions: CompressionOptions

    if (file.size > 10 * 1024 * 1024) {
      // 大文件：激进压缩
      compressionOptions = {
        ...PIXEL_ART_COMPRESSION_OPTIONS,
        maxSizeMB: 3,
        maxWidthOrHeight: 1600,
        quality: 0.7
      }
    } else if (file.size > 5 * 1024 * 1024) {
      // 中等文件：平衡压缩
      compressionOptions = {
        ...PIXEL_ART_COMPRESSION_OPTIONS,
        maxSizeMB: 4,
        maxWidthOrHeight: 1800,
        quality: 0.8
      }
    } else {
      // 小文件：温和压缩
      compressionOptions = PIXEL_ART_COMPRESSION_OPTIONS
    }

    return await this.compressImage(file, compressionOptions)
  }
}

// 导出单例实例
export const imageCompressionService = new ImageCompressionService()

// 便捷函数导出
export async function compressImageForUpload(file: File): Promise<CompressionResult> {
  return await imageCompressionService.smartCompress(file)
}

export default imageCompressionService 
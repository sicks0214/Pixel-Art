/**
 * 优化上传服务 - COLOR03终极性能优化
 * 集成：图片压缩 + 分片上传 + 智能策略
 */

import { imageCompressionService, CompressionResult } from './imageCompression'
import { chunkUploadService, ChunkUploadResult, UploadProgress } from './chunkUpload'

// 优化上传配置
export interface OptimizedUploadOptions {
  enableCompression: boolean      // 启用压缩
  enableChunking: boolean        // 启用分片
  compressionQuality: number     // 压缩质量（0-1）
  maxDimensions: number          // 最大尺寸
  chunkSize: number             // 分片大小
  concurrency: number           // 并发数
}

// 上传阶段
export type UploadStage = 'analyzing' | 'compressing' | 'uploading' | 'finalizing' | 'completed'

// 详细进度信息
export interface DetailedProgress {
  stage: UploadStage
  stageProgress: number         // 当前阶段进度（0-100）
  overallProgress: number       // 总体进度（0-100）
  message: string              // 进度消息
  speed?: number               // 上传速度（字节/秒）
  estimatedTimeRemaining?: number  // 预计剩余时间（毫秒）
  
  // 压缩信息
  compressionInfo?: {
    originalSize: number
    compressedSize: number
    compressionRatio: number
  }
  
  // 分片信息
  chunkInfo?: {
    currentChunk: number
    totalChunks: number
    chunkSize: number
  }
}

// 优化上传结果
export interface OptimizedUploadResult {
  imageId: string
  fileName: string
  originalFile: {
    size: number
    dimensions: { width: number; height: number }
  }
  processedFile: {
    size: number
    dimensions: { width: number; height: number }
  }
  performance: {
    totalTime: number
    compressionTime: number
    uploadTime: number
    averageUploadSpeed: number
  }
  optimization: {
    compressionRatio: number
    chunksUsed: number
    bytesTransferred: number
  }
}

// 默认优化配置
export const DEFAULT_OPTIMIZED_OPTIONS: OptimizedUploadOptions = {
  enableCompression: true,       // 默认启用压缩
  enableChunking: true,         // 默认启用分片
  compressionQuality: 0.85,     // 85%质量
  maxDimensions: 1920,          // 最大1920px
  chunkSize: 1024 * 1024,      // 1MB分片
  concurrency: 3               // 3个并发
}

/**
 * 优化上传服务类
 */
class OptimizedUploadService {

  /**
   * 智能优化上传（压缩+分片）
   */
  async uploadWithOptimizations(
    file: File,
    options: Partial<OptimizedUploadOptions> = {},
    onProgress?: (progress: DetailedProgress) => void
  ): Promise<OptimizedUploadResult> {
    
    const startTime = performance.now()
    const config: OptimizedUploadOptions = {
      ...DEFAULT_OPTIMIZED_OPTIONS,
      ...options
    }

    try {
      console.log('[OptimizedUpload] 🚀 开始智能优化上传:', {
        fileName: file.name,
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        启用压缩: config.enableCompression,
        启用分片: config.enableChunking
      })

      // 阶段1：分析文件
      if (onProgress) {
        onProgress({
          stage: 'analyzing',
          stageProgress: 50,
          overallProgress: 5,
          message: '分析文件信息...'
        })
      }

      const originalDimensions = await this.getImageDimensions(file)
      let compressionResult: CompressionResult | null = null
      let finalFile = file

      // 阶段2：压缩优化（如果启用）
      if (config.enableCompression && this.shouldCompress(file)) {
        if (onProgress) {
          onProgress({
            stage: 'compressing',
            stageProgress: 0,
            overallProgress: 10,
            message: '压缩图片以加速上传...'
          })
        }

        compressionResult = await imageCompressionService.compressImage(file, {
          maxSizeMB: Math.ceil(file.size / (1024 * 1024)) * 0.5, // 压缩到50%大小
          maxWidthOrHeight: config.maxDimensions,
          quality: config.compressionQuality,
          useWebWorker: true,
          preserveExif: false
        })

        finalFile = compressionResult.compressedFile

        if (onProgress) {
          onProgress({
            stage: 'compressing',
            stageProgress: 100,
            overallProgress: 25,
            message: `压缩完成，文件减小 ${compressionResult.compressionRatio.toFixed(1)}x`,
            compressionInfo: {
              originalSize: compressionResult.originalSize,
              compressedSize: compressionResult.compressedSize,
              compressionRatio: compressionResult.compressionRatio
            }
          })
        }

        console.log('[OptimizedUpload] ✅ 压缩完成:', {
          压缩比: `${compressionResult.compressionRatio.toFixed(2)}x`,
          原始: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          压缩后: `${(finalFile.size / 1024 / 1024).toFixed(2)}MB`
        })
      }

      // 阶段3：上传优化（分片或直接）
      if (onProgress) {
        onProgress({
          stage: 'uploading',
          stageProgress: 0,
          overallProgress: 30,
          message: '开始上传...'
        })
      }

      const uploadResult = await chunkUploadService.smartUpload(
        finalFile,
        (uploadProgress) => {
          if (onProgress) {
            onProgress({
              stage: 'uploading',
              stageProgress: uploadProgress.percentage,
              overallProgress: 30 + (uploadProgress.percentage * 0.65), // 30% + 65%
              message: `上传中... ${(uploadProgress.speed / 1024 / 1024).toFixed(1)}MB/s`,
              speed: uploadProgress.speed,
              estimatedTimeRemaining: uploadProgress.estimatedTimeRemaining,
              chunkInfo: {
                currentChunk: uploadProgress.currentChunk,
                totalChunks: uploadProgress.totalChunks,
                chunkSize: config.chunkSize
              }
            })
          }
        }
      )

      // 阶段4：完成
      if (onProgress) {
        onProgress({
          stage: 'completed',
          stageProgress: 100,
          overallProgress: 100,
          message: '上传完成！'
        })
      }

      const totalTime = performance.now() - startTime

      console.log('[OptimizedUpload] 🎉 优化上传完成:', {
        总耗时: `${totalTime.toFixed(2)}ms`,
        上传速度: `${(uploadResult.averageSpeed / 1024 / 1024).toFixed(2)}MB/s`,
        优化效果: compressionResult ? `文件减小${compressionResult.compressionRatio.toFixed(1)}x` : '无压缩',
        分片数: uploadResult.chunks
      })

      return {
        imageId: uploadResult.imageId,
        fileName: file.name,
        originalFile: {
          size: file.size,
          dimensions: originalDimensions
        },
        processedFile: {
          size: finalFile.size,
          dimensions: uploadResult.dimensions
        },
        performance: {
          totalTime,
          compressionTime: compressionResult?.processingTime || 0,
          uploadTime: uploadResult.uploadTime,
          averageUploadSpeed: uploadResult.averageSpeed
        },
        optimization: {
          compressionRatio: compressionResult?.compressionRatio || 1,
          chunksUsed: uploadResult.chunks,
          bytesTransferred: finalFile.size
        }
      }

    } catch (error) {
      console.error('[OptimizedUpload] ❌ 优化上传失败:', error)
      throw error
    }
  }

  /**
   * 判断是否需要压缩
   */
  private shouldCompress(file: File): boolean {
    // 大于1MB的文件建议压缩
    if (file.size > 1024 * 1024) {
      return true
    }

    // PNG和WEBP通常压缩效果更好
    if (file.type === 'image/png' || file.type === 'image/webp') {
      return true
    }

    return false
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
   * 预检查上传策略
   */
  async analyzeUploadStrategy(file: File): Promise<{
    recommendCompression: boolean
    recommendChunking: boolean
    estimatedCompressionRatio: number
    estimatedUploadTime: number
    strategy: 'direct' | 'compress' | 'chunk' | 'compress_chunk'
  }> {
    
    const dimensions = await this.getImageDimensions(file)
    const fileSize = file.size
    
    // 分析是否需要压缩
    const recommendCompression = this.shouldCompress(file)
    
    // 分析是否需要分片
    const recommendChunking = fileSize > 5 * 1024 * 1024
    
    // 估算压缩比例
    let estimatedCompressionRatio = 1
    if (recommendCompression) {
      if (file.type === 'image/png') {
        estimatedCompressionRatio = 3 // PNG通常压缩效果很好
      } else if (file.type === 'image/webp') {
        estimatedCompressionRatio = 1.5
      } else {
        estimatedCompressionRatio = 1.2
      }
    }

    // 估算上传时间（基于1MB/s基准速度）
    const effectiveSize = fileSize / estimatedCompressionRatio
    const baseUploadTime = effectiveSize / (1024 * 1024) * 1000 // 毫秒
    const estimatedUploadTime = recommendChunking ? baseUploadTime * 0.7 : baseUploadTime // 分片上传提速30%

    // 确定策略
    let strategy: 'direct' | 'compress' | 'chunk' | 'compress_chunk'
    if (recommendCompression && recommendChunking) {
      strategy = 'compress_chunk'
    } else if (recommendCompression) {
      strategy = 'compress'
    } else if (recommendChunking) {
      strategy = 'chunk'
    } else {
      strategy = 'direct'
    }

    return {
      recommendCompression,
      recommendChunking,
      estimatedCompressionRatio,
      estimatedUploadTime,
      strategy
    }
  }
}

// 导出单例实例
export const optimizedUploadService = new OptimizedUploadService()

// 便捷函数导出
export async function uploadFileOptimized(
  file: File,
  onProgress?: (progress: DetailedProgress) => void
): Promise<OptimizedUploadResult> {
  return await optimizedUploadService.uploadWithOptimizations(file, {}, onProgress)
}

export default optimizedUploadService 
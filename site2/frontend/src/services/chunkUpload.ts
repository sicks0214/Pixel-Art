/**
 * 分片上传服务 - COLOR03性能优化
 * 功能：大文件分片并发上传，提升上传速度
 */

import { API_CONFIG, API_ENDPOINTS } from '../config/api'

// 分片配置
export interface ChunkUploadOptions {
  chunkSize: number           // 分片大小（字节）
  concurrency: number         // 并发数
  retryAttempts: number       // 重试次数
  retryDelay: number          // 重试延迟（毫秒）
}

// 分片信息
export interface ChunkInfo {
  chunkIndex: number
  chunkSize: number
  start: number
  end: number
  data: Blob
  uploadId?: string
}

// 上传进度
export interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
  speed: number              // 字节/秒
  estimatedTimeRemaining: number  // 毫秒
  currentChunk: number
  totalChunks: number
}

// 分片上传结果
export interface ChunkUploadResult {
  imageId: string
  fileName: string
  fileSize: number
  dimensions: {
    width: number
    height: number
  }
  uploadTime: number
  chunks: number
  averageSpeed: number       // 字节/秒
}

// 默认分片配置
export const DEFAULT_CHUNK_OPTIONS: ChunkUploadOptions = {
  chunkSize: 1024 * 1024,    // 1MB分片
  concurrency: 3,            // 3个并发
  retryAttempts: 3,          // 3次重试
  retryDelay: 1000          // 1秒延迟
}

// 大文件优化配置
export const LARGE_FILE_CHUNK_OPTIONS: ChunkUploadOptions = {
  chunkSize: 2 * 1024 * 1024, // 2MB分片
  concurrency: 5,             // 5个并发
  retryAttempts: 5,           // 5次重试  
  retryDelay: 2000           // 2秒延迟
}

/**
 * 分片上传服务类
 */
class ChunkUploadService {

  /**
   * 分片上传文件
   */
  async uploadFileInChunks(
    file: File,
    options: Partial<ChunkUploadOptions> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ChunkUploadResult> {
    const startTime = performance.now()
    
    try {
      console.log('[ChunkUpload] 📦 开始分片上传:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      })

      // 合并配置
      const config: ChunkUploadOptions = {
        ...DEFAULT_CHUNK_OPTIONS,
        ...options
      }

      // 小文件直接上传，不分片
      if (file.size <= config.chunkSize) {
        console.log('[ChunkUpload] 🚀 小文件直接上传')
        return await this.uploadDirectly(file, onProgress)
      }

      // 创建分片
      const chunks = this.createChunks(file, config.chunkSize)
      
      console.log('[ChunkUpload] 📋 分片信息:', {
        分片数: chunks.length,
        分片大小: `${(config.chunkSize / 1024 / 1024).toFixed(2)}MB`,
        并发数: config.concurrency
      })

      // 初始化上传会话
      const uploadSession = await this.initializeUploadSession(file, chunks.length)
      
      // 并发上传分片
      const uploadResults = await this.uploadChunksConcurrently(
        chunks, 
        uploadSession.uploadId, 
        config, 
        onProgress
      )

      // 合并分片
      const finalResult = await this.finalizeUpload(uploadSession.uploadId, uploadResults)
      
      const uploadTime = performance.now() - startTime
      const averageSpeed = file.size / (uploadTime / 1000) // 字节/秒

      console.log('[ChunkUpload] ✅ 分片上传完成:', {
        总耗时: `${uploadTime.toFixed(2)}ms`,
        平均速度: `${(averageSpeed / 1024 / 1024).toFixed(2)}MB/s`,
        成功分片: uploadResults.filter(r => r.success).length,
        总分片: chunks.length
      })

      return {
        imageId: finalResult.imageId,
        fileName: file.name,
        fileSize: file.size,
        dimensions: finalResult.dimensions,
        uploadTime,
        chunks: chunks.length,
        averageSpeed
      }

    } catch (error) {
      console.error('[ChunkUpload] ❌ 分片上传失败:', error)
      throw error
    }
  }

  /**
   * 创建文件分片
   */
  private createChunks(file: File, chunkSize: number): ChunkInfo[] {
    const chunks: ChunkInfo[] = []
    const totalChunks = Math.ceil(file.size / chunkSize)

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const data = file.slice(start, end)

      chunks.push({
        chunkIndex: i,
        chunkSize: end - start,
        start,
        end,
        data
      })
    }

    return chunks
  }

  /**
   * 初始化上传会话
   */
  private async initializeUploadSession(file: File, totalChunks: number): Promise<{
    uploadId: string
    uploadUrl: string
  }> {
    // 模拟分片上传初始化
    // 实际实现中这里会调用后端API创建上传会话
    
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('[ChunkUpload] 🔗 初始化上传会话:', {
      uploadId,
      fileName: file.name,
      totalChunks
    })

    return {
      uploadId,
      uploadUrl: `${API_CONFIG.baseURL}${API_ENDPOINTS.pixelArtUpload}`
    }
  }

  /**
   * 并发上传分片
   */
  private async uploadChunksConcurrently(
    chunks: ChunkInfo[],
    uploadId: string,
    options: ChunkUploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Array<{ chunkIndex: number; success: boolean; error?: string }>> {
    
    const results: Array<{ chunkIndex: number; success: boolean; error?: string }> = []
    const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.chunkSize, 0)
    let uploadedBytes = 0
    const uploadStartTime = performance.now()

    // 创建并发上传队列
    const uploadPromises: Promise<void>[] = []
    
    // 控制并发数
    for (let i = 0; i < Math.min(options.concurrency, chunks.length); i++) {
      const uploadWorker = async () => {
        let chunkIndex = i
        
        while (chunkIndex < chunks.length) {
          const chunk = chunks[chunkIndex]
          
          try {
            await this.uploadSingleChunk(chunk, uploadId, options)
            
            uploadedBytes += chunk.chunkSize
            
            // 计算进度
            const progress: UploadProgress = {
              uploadedBytes,
              totalBytes,
              percentage: Math.round((uploadedBytes / totalBytes) * 100),
              speed: uploadedBytes / ((performance.now() - uploadStartTime) / 1000),
              estimatedTimeRemaining: ((totalBytes - uploadedBytes) / (uploadedBytes / ((performance.now() - uploadStartTime) / 1000))),
              currentChunk: chunkIndex + 1,
              totalChunks: chunks.length
            }

            if (onProgress) {
              onProgress(progress)
            }

            results.push({ chunkIndex, success: true })
            
          } catch (error) {
            console.error(`[ChunkUpload] 分片 ${chunkIndex} 上传失败:`, error)
            results.push({ 
              chunkIndex, 
              success: false, 
              error: error instanceof Error ? error.message : '上传失败'
            })
          }
          
          chunkIndex += options.concurrency
        }
      }
      
      uploadPromises.push(uploadWorker())
    }

    // 等待所有上传完成
    await Promise.all(uploadPromises)
    
    return results
  }

  /**
   * 上传单个分片
   */
  private async uploadSingleChunk(
    chunk: ChunkInfo,
    uploadId: string,
    options: ChunkUploadOptions
  ): Promise<void> {
    
    for (let attempt = 0; attempt < options.retryAttempts; attempt++) {
      try {
        // 模拟分片上传
        // 实际实现中这里会发送分片数据到后端
        
        const formData = new FormData()
        formData.append('chunk', chunk.data)
        formData.append('chunkIndex', chunk.chunkIndex.toString())
        formData.append('uploadId', uploadId)

        const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.pixelArtUpload}/chunk`, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`分片上传失败: ${response.status}`)
        }

        console.log(`[ChunkUpload] ✅ 分片 ${chunk.chunkIndex} 上传成功`)
        return

      } catch (error) {
        console.warn(`[ChunkUpload] ⚠️ 分片 ${chunk.chunkIndex} 上传失败 (尝试 ${attempt + 1}/${options.retryAttempts}):`, error)
        
        if (attempt < options.retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, options.retryDelay))
        } else {
          throw error
        }
      }
    }
  }

  /**
   * 完成上传（合并分片）
   */
  private async finalizeUpload(uploadId: string, results: Array<{ chunkIndex: number; success: boolean }>): Promise<{
    imageId: string
    dimensions: { width: number; height: number }
  }> {
    
    const successfulChunks = results.filter(r => r.success).length
    const totalChunks = results.length
    
    if (successfulChunks !== totalChunks) {
      throw new Error(`分片上传不完整: ${successfulChunks}/${totalChunks}`)
    }

    // 模拟分片合并
    // 实际实现中这里会调用后端API合并分片
    
    console.log('[ChunkUpload] 🔗 开始合并分片:', { uploadId, totalChunks })

    const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.pixelArtUpload}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId,
        totalChunks
      })
    })

    if (!response.ok) {
      throw new Error('分片合并失败')
    }

    const result = await response.json()
    
    console.log('[ChunkUpload] ✅ 分片合并完成:', result.data.imageId)

    return {
      imageId: result.data.imageId,
      dimensions: result.data.fileDimensions
    }
  }

  /**
   * 直接上传（小文件）
   */
  private async uploadDirectly(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ChunkUploadResult> {
    const startTime = performance.now()
    
    try {
      const formData = new FormData()
      formData.append('imageFile', file)

      // 创建XMLHttpRequest以便监控进度
      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress: UploadProgress = {
              uploadedBytes: event.loaded,
              totalBytes: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
              speed: event.loaded / ((performance.now() - startTime) / 1000),
              estimatedTimeRemaining: ((event.total - event.loaded) / (event.loaded / ((performance.now() - startTime) / 1000))),
              currentChunk: 1,
              totalChunks: 1
            }
            onProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText)
            const uploadTime = performance.now() - startTime
            
            if (response.success) {
              resolve({
                imageId: response.data.imageId,
                fileName: file.name,
                fileSize: file.size,
                dimensions: response.data.fileDimensions,
                uploadTime,
                chunks: 1,
                averageSpeed: file.size / (uploadTime / 1000)
              })
            } else {
              reject(new Error(response.error || '上传失败'))
            }
          } catch (error) {
            reject(new Error('响应解析失败'))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'))
        })

        xhr.open('POST', `${API_CONFIG.baseURL}${API_ENDPOINTS.pixelArtUpload}`)
        xhr.send(formData)
      })
      
    } catch (error) {
      console.error('[ChunkUpload] 直接上传失败:', error)
      throw error
    }
  }

  /**
   * 智能上传策略选择
   */
  async smartUpload(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ChunkUploadResult> {
    
    // 根据文件大小选择上传策略
    if (file.size <= 5 * 1024 * 1024) {
      // 小于5MB：直接上传
      console.log('[ChunkUpload] 🚀 使用直接上传模式')
      return await this.uploadDirectly(file, onProgress)
      
    } else if (file.size <= 20 * 1024 * 1024) {
      // 5-20MB：标准分片
      console.log('[ChunkUpload] 📦 使用标准分片上传')
      return await this.uploadFileInChunks(file, DEFAULT_CHUNK_OPTIONS, onProgress)
      
    } else {
      // 大于20MB：大文件优化分片
      console.log('[ChunkUpload] 🚚 使用大文件优化上传')
      return await this.uploadFileInChunks(file, LARGE_FILE_CHUNK_OPTIONS, onProgress)
    }
  }
}

// 导出单例实例
export const chunkUploadService = new ChunkUploadService()

// 便捷函数导出
export async function uploadFileWithChunks(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChunkUploadResult> {
  return await chunkUploadService.smartUpload(file, onProgress)
}

export default chunkUploadService 
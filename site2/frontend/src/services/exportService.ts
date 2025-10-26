/**
 * 导出服务API
 */

import axios, { AxiosInstance } from 'axios'
import type { ApiResponse, ExportImageRequest } from '@/types/api'
import type { ImageFormat } from '@/types/image'
import { mockService } from './mockService'

// 前端独立运行模式 - 检查是否有后端连接
const FRONTEND_ONLY_MODE = !window.location.hostname.includes('localhost') || 
                          window.location.port === '3000'

class ExportService {
  private api: AxiosInstance
  private isMockMode: boolean = FRONTEND_ONLY_MODE

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        console.log(`📥 导出请求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('❌ 导出请求错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ 导出响应: ${response.config.url}`)
        return response
      },
      (error) => {
        console.error('❌ 导出错误:', error.response?.data || error.message)
        // 如果API连接失败，自动切换到Mock模式
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          console.log('🎭 网络连接失败，自动切换到Mock模式')
          this.isMockMode = true
        }
        return Promise.reject(this.handleExportError(error))
      }
    )
  }

  /**
   * 设置Mock模式
   */
  setMockMode(enabled: boolean) {
    this.isMockMode = enabled
    mockService.setEnabled(enabled)
    console.log(`🎭 导出服务 Mock模式: ${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 检查是否为Mock模式
   */
  get isInMockMode() {
    return this.isMockMode
  }

  /**
   * 处理导出错误
   */
  private handleExportError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response
      switch (status) {
        case 413:
          return new Error('图片文件过大，无法导出')
        case 422:
          return new Error('导出参数错误，请检查格式和质量设置')
        case 503:
          return new Error('导出服务暂时不可用，请稍后再试')
        default:
          return new Error(data?.error || data?.message || `导出失败 (${status})`)
      }
    } else if (error.request) {
      return new Error('导出服务连接失败，前端将使用Mock模式运行')
    } else {
      return new Error(error.message || '导出未知错误')
    }
  }

  /**
   * 导出图片
   */
  async exportImage(
    format: ImageFormat = 'png',
    quality: number = 90,
    options?: {
      width?: number
      height?: number
      includeWatermark?: boolean
    }
  ): Promise<Blob> {
    // Mock模式处理
    if (this.isMockMode) {
      console.log('🎭 使用Mock模式导出图片')
      await mockService.mockExport('', format, quality)
      
      // 创建Mock图片Blob
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = options?.width || 800
      canvas.height = options?.height || 600
      
      if (ctx) {
        // 绘制Mock图片内容
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#666'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Mock图片导出', canvas.width / 2, canvas.height / 2 - 20)
        ctx.fillText(`格式: ${format.toUpperCase()}`, canvas.width / 2, canvas.height / 2 + 20)
        ctx.fillText(`质量: ${quality}%`, canvas.width / 2, canvas.height / 2 + 60)
      }
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob(['Mock image data'], { type: `image/${format}` }))
        }, `image/${format}`, quality / 100)
      })
    }

    // 真实API调用
    try {
      const request: ExportImageRequest = {
        format,
        quality: Math.max(50, Math.min(100, quality)), // 限制质量范围 50-100
        width: options?.width,
        height: options?.height,
        includeWatermark: options?.includeWatermark || false,
      }

      console.log(`📤 开始导出图片 (${format.toUpperCase()}, 质量: ${quality}%)`)

      const response = await this.api.post(
        '/export',
        request,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'image/*',
          },
          // 下载进度
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              console.log(`📥 下载进度: ${progress}%`)
            }
          },
        }
      )

      console.log('✅ 图片导出成功')
      return response.data
    } catch (error) {
      console.error('❌ 图片导出失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockMode = true
      
      // 创建Mock图片Blob
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = options?.width || 800
      canvas.height = options?.height || 600
      
      if (ctx) {
        ctx.fillStyle = '#ffcccc'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = '#cc0000'
        ctx.font = '20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('API连接失败', canvas.width / 2, canvas.height / 2 - 20)
        ctx.fillText('Mock模式导出', canvas.width / 2, canvas.height / 2 + 20)
      }
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || new Blob(['Mock image data'], { type: `image/${format}` }))
        }, `image/${format}`, quality / 100)
      })
    }
  }

  /**
   * 下载图片文件
   */
  async downloadImage(
    blob: Blob,
    filename?: string,
    format: ImageFormat = 'png'
  ): Promise<void> {
    try {
      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `meme-${Date.now()}.${format}`
      
      // 添加到DOM并触发下载
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`✅ 文件下载完成: ${link.download}`)
    } catch (error) {
      console.error('❌ 文件下载失败:', error)
      throw new Error('文件下载失败')
    }
  }

  /**
   * 导出并下载图片（一体化方法）
   */
  async exportAndDownload(
    format: ImageFormat = 'png',
    quality: number = 90,
    filename?: string,
    options?: {
      width?: number
      height?: number
      includeWatermark?: boolean
    }
  ): Promise<void> {
    try {
      // 导出图片
      const blob = await this.exportImage(format, quality, options)
      
      // 下载图片
      await this.downloadImage(blob, filename, format)
    } catch (error) {
      console.error('❌ 导出下载失败:', error)
      throw error
    }
  }

  /**
   * 获取导出预览信息
   */
  async getExportPreview(
    format: ImageFormat,
    quality: number
  ): Promise<ApiResponse<{
    estimatedSize: number
    format: string
    quality: number
    supportedFormats: string[]
  }>> {
    try {
      const response = await this.api.get<ApiResponse<{
        estimatedSize: number
        format: string
        quality: number
        supportedFormats: string[]
      }>>(`/export-preview?format=${format}&quality=${quality}`)
      
      return response.data
    } catch (error) {
      console.error('❌ 获取导出预览失败:', error)
      throw error
    }
  }

  /**
   * 批量导出图片
   */
  async batchExport(
    exports: Array<{
      format: ImageFormat
      quality: number
      filename?: string
    }>
  ): Promise<Blob[]> {
    try {
      console.log(`📦 开始批量导出 (${exports.length} 个文件)`)
      
      const results = await Promise.all(
        exports.map(async (exportConfig, index) => {
          console.log(`📤 导出文件 ${index + 1}/${exports.length}`)
          return await this.exportImage(exportConfig.format, exportConfig.quality)
        })
      )
      
      console.log('✅ 批量导出完成')
      return results
    } catch (error) {
      console.error('❌ 批量导出失败:', error)
      throw error
    }
  }

  /**
   * 创建压缩包下载
   */
  async downloadAsZip(
    exports: Array<{
      format: ImageFormat
      quality: number
      filename: string
    }>
  ): Promise<void> {
    try {
      const response = await this.api.post(
        '/export-zip',
        { exports },
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/zip',
          },
        }
      )

      // 下载ZIP文件
      const blob = response.data
      await this.downloadImage(blob, `memes-${Date.now()}.zip`, 'zip' as ImageFormat)
    } catch (error) {
      console.error('❌ ZIP下载失败:', error)
      throw error
    }
  }

  /**
   * 获取支持的导出格式
   */
  getSupportedFormats(): ImageFormat[] {
    return ['png', 'jpg', 'jpeg', 'webp']
  }

  /**
   * 验证导出参数
   */
  validateExportParams(format: ImageFormat, quality: number): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (!this.getSupportedFormats().includes(format)) {
      errors.push(`不支持的格式: ${format}`)
    }
    
    if (quality < 50 || quality > 100) {
      errors.push('质量必须在50-100之间')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// 导出单例实例
export const exportService = new ExportService()
export default exportService 
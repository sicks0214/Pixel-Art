/**
 * 图片处理服务API
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import type { AddTextRequest } from '@/types/api'
import { mockService } from './mockService'
import { API_CONFIG, API_ENDPOINTS, isMockMode } from '../config/api'

// 扩展Axios配置类型
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number
    }
  }
}

class ImageService {
  private api: AxiosInstance
  private isMockModeEnabled: boolean = isMockMode()

  constructor() {
    this.api = axios.create({
      baseURL: `${API_CONFIG.baseURL}${API_ENDPOINTS.image}`,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers
    })

    // 请求拦截器
    this.api.interceptors.request.use(
      (config: any) => {
        // 添加请求时间戳
        config.metadata = { startTime: Date.now() }
        console.log(`🚀 API请求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error: any) => {
        console.error('❌ 请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - (response.config.metadata?.startTime || 0)
        console.log(`✅ API响应: ${response.config.url} (${duration}ms)`)
        return response
      },
      (error: any) => {
        console.error('❌ API错误:', error.response?.data || error.message)
        // 如果API连接失败，自动切换到Mock模式
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
          console.log('🎭 网络连接失败，自动切换到Mock模式')
          this.isMockModeEnabled = true
        }
        return Promise.reject(this.handleApiError(error))
      }
    )
  }

  /**
   * 设置Mock模式
   */
  setMockMode(enabled: boolean) {
    this.isMockModeEnabled = enabled
  }

  /**
   * 检查是否为Mock模式
   */
  get isInMockMode() {
    return this.isMockModeEnabled
  }

  /**
   * 处理API错误
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response
      return new Error(data?.error || data?.message || `HTTP ${status} 错误`)
    } else if (error.request) {
      // 网络错误
      return new Error('网络连接失败，前端将使用Mock模式运行')
    } else {
      // 其他错误
      return new Error(error.message || '未知错误')
    }
  }

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<any> {
    // Mock模式处理
    if (this.isMockModeEnabled) {
      console.log('🎭 使用Mock模式上传图片')
      return await mockService.mockUpload(file)
    }

    // 真实API调用
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await this.api.post(
        '/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // 上传进度回调
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              console.log(`📤 上传进度: ${progress}%`)
            }
          },
        }
      )

      return response.data
    } catch (error) {
      console.error('❌ 图片上传失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockModeEnabled = true
      return await mockService.mockUpload(file)
    }
  }

  /**
   * 添加文字到图片
   */
  async addText(request: AddTextRequest): Promise<any> {
    // Mock模式处理
    if (this.isMockModeEnabled) {
      console.log('🎭 使用Mock模式添加文字')
      return await mockService.mockAddText(
        '', // Mock模式下不需要实际的imageUrl
        request.text, 
        {
          position: request.position,
          color: request.style.color,
          fontSize: request.style.fontSize,
          fontFamily: request.style.fontFamily || 'Arial'
        }
      )
    }

    // 真实API调用
    try {
      const response = await this.api.post(
        '/add-text',
        request
      )
      return response.data
    } catch (error) {
      console.error('❌ 添加文字失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockModeEnabled = true
      return await mockService.mockAddText(
        '', // Mock模式下不需要实际的imageUrl
        request.text, 
        {
          position: request.position,
          color: request.style.color,
          fontSize: request.style.fontSize,
          fontFamily: request.style.fontFamily || 'Arial'
        }
      )
    }
  }

  /**
   * 导出图片
   */
  async exportImage(request: any): Promise<Blob> {
    // Mock模式处理
    if (this.isMockModeEnabled) {
      console.log('🎭 使用Mock模式导出图片')
      // 创建一个简单的Blob用于Mock
      return new Blob(['Mock image data'], { type: `image/${request.format || 'png'}` })
    }

    // 真实API调用
    try {
      const response = await this.api.post(
        '/export',
        request,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'image/*',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('❌ 导出图片失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockModeEnabled = true
      return new Blob(['Mock image data'], { type: `image/${request.format || 'png'}` })
    }
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(imageUrl: string): Promise<any> {
    // Mock模式处理
    if (this.isMockModeEnabled) {
      console.log('🎭 使用Mock模式获取图片信息')
      return {
        success: true,
        data: {
          url: imageUrl,
          dimensions: { width: 800, height: 600 },
          size: 1024000,
          format: 'jpeg',
          created: new Date().toISOString()
        }
      }
    }

    // 真实API调用
    try {
      const response = await this.api.get(
        `/image-info?url=${encodeURIComponent(imageUrl)}`
      )
      return response.data
    } catch (error) {
      console.error('❌ 获取图片信息失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockModeEnabled = true
      return {
        success: true,
        data: {
          url: imageUrl,
          dimensions: { width: 800, height: 600 },
          size: 1024000,
          format: 'jpeg',
          created: new Date().toISOString()
        }
      }
    }
  }

  /**
   * 删除图片
   */
  async deleteImage(imageId: string): Promise<any> {
    // Mock模式处理
    if (this.isMockModeEnabled) {
      console.log('🎭 使用Mock模式删除图片')
      return {
        success: true,
        data: {
          imageId,
          deleted: true,
          message: 'Mock删除成功'
        }
      }
    }

    // 真实API调用
    try {
      const response = await this.api.delete(`/image/${imageId}`)
      return response.data
    } catch (error) {
      console.error('❌ 删除图片失败:', error)
      // 失败时尝试使用Mock模式
      console.log('🎭 API失败，尝试使用Mock模式')
      this.isMockModeEnabled = true
      return {
        success: true,
        data: {
          imageId,
          deleted: true,
          message: 'Mock删除成功'
        }
      }
    }
  }

  /**
   * 清除所有文字
   */
  async clearTexts(): Promise<any> {
    try {
      const response = await this.api.post(
        '/clear-texts'
      )
      return response.data
    } catch (error) {
      console.error('❌ 清除文字失败:', error)
      throw error
    }
  }

  /**
   * 重置图片到原始状态
   */
  async resetImage(): Promise<any> {
    try {
      const response = await this.api.post(
        '/reset'
      )
      return response.data
    } catch (error) {
      console.error('❌ 重置图片失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const imageService = new ImageService()
export default imageService 
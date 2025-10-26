import axios, { AxiosResponse } from 'axios'
import { performanceMonitor } from '@/utils/performanceMonitor'
import { API_CONFIG, API_ENDPOINTS, PIXEL_ART_CONFIG } from '@/config/api'
import { 
  ConversionRequest, 
  ConversionResponse, 
  PixelArtApiError, 
  ProgressCallback, 
  ValidationResult,
  ParameterState 
} from '../types/pixelArt'

// ============= COLOR02风格分步式API架构 =============

// 上传响应类型
interface UploadImageResponse {
  success: boolean
  data?: {
    imageId: string
    previewUrl?: string
    fileDimensions: {
      width: number
      height: number
    }
    fileSize: number
    fileName: string
  }
  error?: string
}

// 转换任务启动响应
interface StartConversionResponse {
  success: boolean
  data?: {
    taskId: string
    estimatedTime: number
    status: 'queued' | 'processing'
  }
  error?: string
}

// 进度查询响应
interface ProgressResponse {
  success: boolean
  data?: {
    taskId: string
    progress: number
    status: 'queued' | 'processing' | 'completed' | 'failed'
    currentStep: string
    estimatedTimeRemaining?: number
    message?: string
  }
  error?: string
}

// 结果获取响应
interface ResultResponse {
  success: boolean
  data?: {
    pixelArtImage: string
    canvasInfo: {
      width: number
      height: number
      coloredPixels: number
    }
    extractedColors: string[]
    processingTime: number
    metadata: {
      originalSize: number
      processedSize: number
      timestamp: string
    }
  }
  error?: string
}

// 创建axios实例（COLOR02风格）
const pixelArtApiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: PIXEL_ART_CONFIG.timeout,
  headers: {
    'Accept': 'application/json'
  }
})

// 请求拦截器（COLOR02风格）
pixelArtApiClient.interceptors.request.use(
  (config) => {
    (config as any).metadata = {
      startTime: performance.now(),
      endpoint: config.url?.split('/').pop() || 'unknown'
    }
    
    console.log(`[COLOR03 API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('[COLOR03 API] Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（COLOR02风格）
pixelArtApiClient.interceptors.response.use(
  (response) => {
    const metadata = (response.config as any).metadata
    if (metadata) {
      const duration = performance.now() - metadata.startTime
      console.log(`[COLOR03 API] ${metadata.endpoint} completed in ${duration.toFixed(2)}ms`)
    }
    return response
  },
  (error) => {
    const metadata = (error.config as any)?.metadata
    if (metadata) {
      const duration = performance.now() - metadata.startTime
      console.error(`[COLOR03 API] ${metadata.endpoint} failed after ${duration.toFixed(2)}ms:`, error)
    }
    return Promise.reject(error)
  }
)

// ============= COLOR02风格分步式API服务 =============

export const pixelArtApiService = {
  
  /**
   * 第1步：上传图片（COLOR02风格）
   */
  uploadImage: async (file: File): Promise<UploadImageResponse> => {
    try {
      console.log('[COLOR03 API] 步骤1：开始上传图片')
      
      // 验证文件
      const validation = validateFile(file)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        }
      }
      
      const formData = new FormData()
      formData.append('imageFile', file)
      
      const response: AxiosResponse<UploadImageResponse> = await pixelArtApiClient.post(
        API_ENDPOINTS.pixelArtUpload,
        formData,
        {
          timeout: PIXEL_ART_CONFIG.uploadTimeout,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              console.log(`[COLOR03 API] 上传进度: ${progress}%`)
            }
          }
        }
      )
      
      console.log('[COLOR03 API] ✅ 图片上传完成')
      return response.data
      
    } catch (error) {
      console.error('[COLOR03 API] 上传失败:', error)
      
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.message || error.message || '上传失败'
          : '上传失败，请重试'
      }
    }
  },

  /**
   * 第2步：开始转换任务（COLOR02风格）
   */
  startConversion: async (imageId: string, params: ParameterState): Promise<StartConversionResponse> => {
    try {
      console.log('[COLOR03 API] 步骤2：开始转换任务')
      
      const response: AxiosResponse<StartConversionResponse> = await pixelArtApiClient.post(
        API_ENDPOINTS.pixelArtConvert,
        {
          imageId,
          parameters: {
            resizeFactor: params.resizeFactor,
            interpolation: params.interpolation,
            colorMode: params.colorMode,
            ditheringRatio: params.ditheringRatio
          }
        }
      )
      
      console.log('[COLOR03 API] ✅ 转换任务已启动:', response.data.data?.taskId)
      return response.data
      
    } catch (error) {
      console.error('[COLOR03 API] 启动转换失败:', error)
      
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.message || error.message || '启动转换失败'
          : '启动转换失败，请重试'
      }
    }
  },

  /**
   * 第3步：轮询转换进度（COLOR02风格）
   */
  getConversionProgress: async (taskId: string): Promise<ProgressResponse> => {
    try {
      const response: AxiosResponse<ProgressResponse> = await pixelArtApiClient.get(
        `${API_ENDPOINTS.pixelArtProgress}/${taskId}`
      )
      
      return response.data
      
    } catch (error) {
      console.error('[COLOR03 API] 进度查询失败:', error)
      
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.message || error.message || '进度查询失败'
          : '进度查询失败'
      }
    }
  },

  /**
   * 第4步：获取转换结果（COLOR02风格）
   */
  getConversionResult: async (taskId: string): Promise<ResultResponse> => {
    try {
      console.log('[COLOR03 API] 步骤4：获取转换结果')
      
      const response: AxiosResponse<ResultResponse> = await pixelArtApiClient.get(
        `${API_ENDPOINTS.pixelArtResult}/${taskId}`
      )
      
      console.log('[COLOR03 API] ✅ 转换结果获取完成')
      return response.data
      
    } catch (error) {
      console.error('[COLOR03 API] 获取结果失败:', error)
      
      return {
        success: false,
        error: axios.isAxiosError(error) 
          ? error.response?.data?.message || error.message || '获取结果失败'
          : '获取结果失败'
      }
    }
  },

  /**
   * 健康检查（COLOR02风格）
   */
  healthCheck: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await pixelArtApiClient.get(API_ENDPOINTS.pixelArtHealth, {
        timeout: 5000
      })
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: '后端服务不可用'
      }
    }
  }
}

// ============= COLOR02风格的高级API方法 =============

/**
 * 完整的像素画转换流程（COLOR02风格分步式）
 */
export async function convertToPixelArt(
  request: ConversionRequest,
  onProgress?: ProgressCallback
): Promise<ConversionResponse> {
  const endMeasure = performanceMonitor.startMeasurement('pixel-art-conversion-full', {
    fileSize: request.imageFile.size,
    fileName: request.imageFile.name
  })
  
  try {
    console.log('[COLOR03 API] 开始COLOR02风格完整转换流程')
    
    // ⚡ 立即开始进度
    if (onProgress) onProgress(5)

    // 检查是否启用Mock模式（COLOR02兼容）
    const useMockData = import.meta.env.VITE_ENABLE_MOCK_MODE === 'true'
    
    if (useMockData) {
      console.log('[COLOR03 API] 使用Mock模式生成像素画数据')
      
      const mockResponse = await performanceMonitor.measureAsync(
        generateMockPixelArt,
        'mock-pixel-art-generation'
      )(request.imageFile)
      
      if (onProgress) onProgress(100)
      
      const measurement = endMeasure()
      console.log(`[COLOR03 API] Mock转换完成: ${measurement.duration.toFixed(2)}ms`)
      
      return mockResponse
    }

    // 步骤1：上传图片
    console.log('[COLOR03 API] 步骤1/4：上传图片')
    const uploadResult = await pixelArtApiService.uploadImage(request.imageFile)
    
    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(uploadResult.error || '图片上传失败')
    }
    
    if (onProgress) onProgress(25)
    
    // 步骤2：开始转换
    console.log('[COLOR03 API] 步骤2/4：开始转换任务')
    const conversionResult = await pixelArtApiService.startConversion(
      uploadResult.data.imageId,
      {
        resizeFactor: request.resizeFactor,
        interpolation: request.interpolation,
        colorMode: request.colorMode,
        ditheringRatio: request.ditheringRatio
      }
    )
    
    if (!conversionResult.success || !conversionResult.data) {
      throw new Error(conversionResult.error || '转换任务启动失败')
    }
    
    if (onProgress) onProgress(35)
    
    // 步骤3：轮询进度
    console.log('[COLOR03 API] 步骤3/4：轮询转换进度')
    const taskId = conversionResult.data.taskId
    let progressCount = 0
    
    while (progressCount < PIXEL_ART_CONFIG.maxProgressPolls) {
      const progressResult = await pixelArtApiService.getConversionProgress(taskId)
      
      if (progressResult.success && progressResult.data) {
        const { progress, status } = progressResult.data
        
        // 更新进度 (35% + 55% * API进度)
        const adjustedProgress = 35 + Math.round(progress * 0.55)
        if (onProgress) onProgress(Math.min(adjustedProgress, 90))
        
        console.log(`[COLOR03 API] 转换进度: ${progress}% (状态: ${status})`)
        
        if (status === 'completed') {
          break
        } else if (status === 'failed') {
          throw new Error(progressResult.data.message || '转换失败')
        }
      }
      
      // 等待后继续轮询
      await new Promise(resolve => setTimeout(resolve, PIXEL_ART_CONFIG.progressPollInterval))
      progressCount++
    }
    
    if (progressCount >= PIXEL_ART_CONFIG.maxProgressPolls) {
      throw new Error('转换超时，请重试')
    }
    
    if (onProgress) onProgress(90)
    
    // 步骤4：获取结果
    console.log('[COLOR03 API] 步骤4/4：获取转换结果')
    const resultResponse = await pixelArtApiService.getConversionResult(taskId)
    
    if (!resultResponse.success || !resultResponse.data) {
      throw new Error(resultResponse.error || '获取结果失败')
    }
    
    if (onProgress) onProgress(100)
    
    const measurement = endMeasure()
    console.log(`[COLOR03 API] ✅ 完整转换流程完成: ${measurement.duration.toFixed(2)}ms`)
    
    return {
      success: true,
      data: resultResponse.data
    }
    
  } catch (error) {
    console.error('[COLOR03 API] 转换流程失败:', error)
    
    let errorMessage = '转换失败，请重试'
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = '处理超时，请稍后重试'
      } else if (error.response?.status === 413) {
        errorMessage = '文件过大，请选择小一些的图片'
      } else if (error.response?.status === 415) {
        errorMessage = '不支持的文件格式'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    const measurement = endMeasure()
    console.log(`[COLOR03 API] 转换流程失败: ${measurement.duration.toFixed(2)}ms, 错误: ${errorMessage}`)

    return {
      success: false,
      error: errorMessage
    }
  }
}

// ============= 文件验证（COLOR02风格） =============

export function validateFile(file: File): ValidationResult {
  const errors: string[] = []
  
  // 检查文件类型
  if (!PIXEL_ART_CONFIG.supportedFormats.includes(file.type)) {
    errors.push('只支持PNG、JPG、WEBP格式的图片')
  }
  
  // 检查文件大小
  if (file.size > PIXEL_ART_CONFIG.maxFileSize) {
    errors.push(`文件大小不能超过${(PIXEL_ART_CONFIG.maxFileSize / 1024 / 1024).toFixed(0)}MB`)
  }
  
  // 检查文件是否为空
  if (file.size === 0) {
    errors.push('文件不能为空')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============= 模拟数据（开发测试用） =============

async function generateMockPixelArt(imageFile: File): Promise<ConversionResponse> {
  console.log('[Mock] 生成模拟像素画数据...')
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 生成模拟的Base64图像数据
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = 100
  canvas.height = 100
  
  if (ctx) {
    // 生成简单的像素画图案
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    for (let x = 0; x < 100; x += 10) {
      for (let y = 0; y < 100; y += 10) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx.fillRect(x, y, 10, 10)
      }
    }
  }
  
  const pixelArtImage = canvas.toDataURL('image/png')
  
  return {
    success: true,
    data: {
      pixelArtImage,
      canvasInfo: {
        width: 100,
        height: 100,
        coloredPixels: 100
      },
      extractedColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      processingTime: 1500,
      metadata: {
        originalSize: imageFile.size,
        processedSize: pixelArtImage.length,
        timestamp: new Date().toISOString()
      }
    }
  }
}

// ============= 兼容性保持 =============

/**
 * 验证转换请求参数（保持兼容）
 */
export function validateConversionRequest(request: ConversionRequest): ValidationResult {
  return validateFile(request.imageFile)
}

// 导出默认服务
export default pixelArtApiService

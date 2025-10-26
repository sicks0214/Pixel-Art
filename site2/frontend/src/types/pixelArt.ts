/**
 * 像素画转换相关的类型定义 - COLOR02架构风格
 */

// 转换请求参数
export interface ConversionRequest {
  imageFile: File
  resizeFactor: number      // 0-100 调整大小因子
  interpolation: string     // 插值方法
  colorMode: string        // 颜色模式 
  ditheringRatio: number   // 抖动比例 0.1-3.0
}

// 转换响应数据
export interface ConversionResponse {
  success: boolean
  data?: {
    pixelArtImage: string     // Base64图像数据
    canvasInfo: {
      width: number           // 画布宽度(像素)
      height: number          // 画布高度(像素)
      coloredPixels: number   // 有色像素数量
    }
    extractedColors: string[] // 提取的颜色数组(HEX格式)
    processingTime: number    // 处理时间(毫秒)
    metadata: {
      originalSize: number    // 原始文件大小
      processedSize: number   // 处理后大小
      timestamp: string       // 处理时间戳
    }
  }
  error?: string
}

// API错误类型
export interface PixelArtApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

// 处理进度回调
export interface ProgressCallback {
  (progress: number): void
}

// API配置
export interface PixelArtApiConfig {
  baseURL: string
  timeout: number
  maxFileSize: number
  supportedFormats: string[]
}

// 转换参数验证结果
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// ============= COLOR02风格的分离状态类型 =============

// 上传状态（COLOR02风格）
export interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

// 转换状态（COLOR02风格）
export interface ConversionState {
  isConverting: boolean
  progress: number
  currentStep: 'idle' | 'preparing' | 'processing' | 'finishing' | 'completed' | 'failed'
  taskId: string | null
  error: string | null
  startTime: number | null
  estimatedTime: number | null
}

// 结果状态（COLOR02风格）
export interface ResultState {
  pixelArtImage: string | null
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
  } | null
}

// 文件状态（COLOR02风格）
export interface FileState {
  selectedFile: File | null
  fileName: string
  originalImageUrl: string | null
  imageId: string | null
  fileSize: number
  fileDimensions: {
    width: number
    height: number
  } | null
}

// 参数状态（COLOR02风格）
export interface ParameterState {
  resizeFactor: number      // 0-100
  interpolation: string     // 'bilinear' | 'nearest'
  colorMode: string        // 'no_dithering' | 'ordered_dithering_bayer'
  ditheringRatio: number   // 0.1-3.0
}

// 错误类型（COLOR02风格）
export interface PixelArtError {
  code: string
  message: string
  timestamp: Date
  context?: Record<string, any>
}

// 默认值定义
export const DEFAULT_UPLOAD_STATE: UploadState = {
  isUploading: false,
  progress: 0,
  error: null
}

export const DEFAULT_CONVERSION_STATE: ConversionState = {
  isConverting: false,
  progress: 0,
  currentStep: 'idle',
  taskId: null,
  error: null,
  startTime: null,
  estimatedTime: null
}

export const DEFAULT_RESULT_STATE: ResultState = {
  pixelArtImage: null,
  canvasInfo: {
    width: 0,
    height: 0,
    coloredPixels: 0
  },
  extractedColors: [],
  processingTime: 0,
  metadata: null
}

export const DEFAULT_FILE_STATE: FileState = {
  selectedFile: null,
  fileName: '',
  originalImageUrl: null,
  imageId: null,
  fileSize: 0,
  fileDimensions: null
}

export const DEFAULT_PARAMETER_STATE: ParameterState = {
  resizeFactor: 50,                    // 默认50%
  interpolation: 'bilinear',           // 默认双线性
  colorMode: 'no_dithering',          // 默认无抖动
  ditheringRatio: 1.0                 // 默认1x
}

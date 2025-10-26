/**
 * API相关类型定义
 */

// 基础API响应
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: number
  version?: string
}

// 图片上传请求
export interface UploadImageRequest {
  file: File
  options?: {
    compress?: boolean
    maxWidth?: number
    maxHeight?: number
    quality?: number
  }
}

// 图片上传响应
export interface UploadImageResponse {
  id: string
  url: string
  filename: string
  size: number
  mimeType: string
  dimensions: {
    width: number
    height: number
  }
  uploadedAt: string
}



// 添加文字请求
export interface AddTextRequest {
  text: string
  position: {
    x: number
    y: number
  }
  style: {
    fontSize: number
    color: string
    fontFamily?: string
    fontWeight?: string
    strokeColor?: string
    strokeWidth?: number
  }
}

// 导出图片请求
export interface ExportImageRequest {
  format: 'png' | 'jpg' | 'jpeg' | 'webp'
  quality?: number // 1-100
  width?: number
  height?: number
  includeWatermark?: boolean
}

// 图片处理任务状态
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

// API错误类型
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
  requestId?: string
} 
/**
 * 图片相关类型定义
 */

// 图片文件数据
export interface ImageData {
  file: File
  url: string
  name: string
  size: number
  type: string
  width?: number
  height?: number
  lastModified?: number
}

// 处理后的图片数据
export interface ProcessedImage {
  url: string
  processed: boolean
  processType?: 'cartoonify' | 'text' | 'filter' | 'edit'
  timestamp?: number
}

// 图片处理状态
export type ProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'processing' 
  | 'uploaded' 
  | 'processed' 
  | 'error'

// 图片格式类型
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp'

// 图片质量设置
export interface ImageQuality {
  format: ImageFormat
  quality: number // 50-100
  compression?: boolean
}

// 图片尺寸
export interface ImageDimensions {
  width: number
  height: number
  aspectRatio?: number
}

// 图片变换参数
export interface ImageTransform {
  scale?: number
  rotation?: number
  flipX?: boolean
  flipY?: boolean
  brightness?: number
  contrast?: number
  saturation?: number
}

// 图片裁剪区域
export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

// 图片元数据
export interface ImageMetadata {
  exif?: Record<string, any>
  colorProfile?: string
  hasAlpha?: boolean
  bitDepth?: number
}

// 图片验证规则
export interface ImageValidation {
  maxSize: number // bytes
  minSize?: number
  allowedTypes: string[]
  maxWidth?: number
  maxHeight?: number
  minWidth?: number
  minHeight?: number
}

// 图片预览配置
export interface ImagePreview {
  url: string
  thumbnail?: string
  dimensions: ImageDimensions
  fileSize: number
} 
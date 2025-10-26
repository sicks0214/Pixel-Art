/**
 * 新的图片处理工作流程类型定义
 */

// 处理步骤类型
export type ProcessingStep = 
  | 'upload'           // 图片上传
  | 'center'           // 处理中心
  | 'cartoonify'       // 卡通化
  | 'purify'           // 图像净化
  | 'text'             // 添加语句
  | 'stickers'         // 添加贴纸/背景
  | 'canvas'           // 画布展示
  | 'export'           // 导出下载

// 处理状态
export type ProcessingStatus = 
  | 'idle'
  | 'processing'
  | 'completed'
  | 'error'

// 功能模块
export interface ProcessingModule {
  id: string
  name: string
  icon: string
  description: string
  enabled: boolean
  status: ProcessingStatus
  config?: any
}

// 卡通化配置
export interface CartoonifyConfig {
  style: 'anime' | 'cartoon' | 'sketch' | 'comic'
  intensity: number // 0-100
  edgeStrength: number // 0-100
  colorReduction: number // 0-100
}

// 图像净化配置
export interface PurifyConfig {
  skinSmoothing: number // 0-100
  blemishRemoval: boolean
  eyeEnhancement: boolean
  teethWhitening: boolean
  wrinkleReduction: number // 0-100
}

// 文本配置
export interface TextConfig {
  type: 'system' | 'custom'
  content: string
  style: {
    fontSize: number
    fontFamily: string
    color: string
    fontWeight: string
    textAlign: 'left' | 'center' | 'right'
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    padding?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    shadow?: {
      offsetX: number
      offsetY: number
      blur: number
      color: string
    }
  }
  position: {
    x: number
    y: number
  }
  rotation?: number
  opacity?: number
}

// 贴纸元素
export interface StickerElement {
  id: string
  type: 'emoji' | 'decoration' | 'frame' | 'background'
  url: string
  name: string
  category: string
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  rotation?: number
  opacity?: number
  zIndex: number
}

// 系统推荐文本
export interface RecommendedText {
  id: string
  category: 'funny' | 'cute' | 'cool' | 'romantic' | 'inspirational'
  content: string
  style: TextConfig['style']
  popular: boolean
}

// 处理结果
export interface ProcessingResult {
  step: ProcessingStep
  status: ProcessingStatus
  originalImage?: string
  processedImage?: string
  previewImage?: string
  error?: string
  timestamp: number
  metadata?: {
    processingTime?: number
    fileSize?: number
    dimensions?: {
      width: number
      height: number
    }
  }
}

// 工作流程状态
export interface WorkflowState {
  currentStep: ProcessingStep
  originalImage: string | null
  processedImage: string | null
  modules: {
    cartoonify: {
      enabled: boolean
      config: CartoonifyConfig
      result?: ProcessingResult
    }
    purify: {
      enabled: boolean
      config: PurifyConfig
      result?: ProcessingResult
    }
    text: {
      enabled: boolean
      elements: TextConfig[]
      recommended: RecommendedText[]
    }
    stickers: {
      enabled: boolean
      elements: StickerElement[]
      availableStickers: StickerElement[]
    }
  }
  canvas: {
    width: number
    height: number
    scale: number
    compositeImage?: string
  }
  export: {
    formats: ('png' | 'webp' | 'gif')[]
    quality: number
  }
}

// 处理选项
export interface ProcessingOptions {
  skipSteps?: ProcessingStep[]
  autoPreview?: boolean
  saveIntermediate?: boolean
  quality?: 'low' | 'medium' | 'high'
}

// 画布合成配置
export interface CanvasComposition {
  background: string | null
  layers: Array<{
    id: string
    type: 'image' | 'text' | 'sticker'
    content: string | TextConfig | StickerElement
    zIndex: number
    visible: boolean
    opacity: number
  }>
}

// 导出配置
export interface ExportConfig {
  format: 'png' | 'webp' | 'gif'
  quality: number // 0-100
  width?: number
  height?: number
  includeMetadata?: boolean
  watermark?: boolean
} 
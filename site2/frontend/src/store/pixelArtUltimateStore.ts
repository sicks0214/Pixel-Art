/**
 * 🔥 COLOR03 终极版轻量级状态管理
 * 精简到极致，只保留核心状态，提升性能
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============= 精简的类型定义 =============

interface PixelArtParams {
  pixelSize: number
  colorCount: number
  palette: string
  filter: 'none' | 'retro' | 'neon' | 'blackwhite'
  exportFormat: 'png' | 'jpg'
  // 像素处理模式
  pixelMode: 'normal' | 'enhanced' | 'isolated' | 'original'
  edgeDensity: 'minimal' | 'low' | 'medium' | 'high' | 'maximum'
}

interface ProcessingMetrics {
  startTime: number
  processTime: number
  fileSize: number
  dimensions: { width: number; height: number }
}

// ============= 轻量级状态接口 =============

interface PixelArtUltimateState {
  // 核心状态
  file: File | null
  imageSrc: string
  result: string | null
  params: PixelArtParams
  
  // 处理状态
  isProcessing: boolean
  realtimeMode: boolean
  
  // 性能指标
  metrics: ProcessingMetrics | null
  
  // Actions
  setFile: (file: File | null) => void
  setImageSrc: (src: string) => void
  setResult: (result: string | null) => void
  updateParams: (updates: Partial<PixelArtParams>) => void
  setProcessing: (processing: boolean) => void
  setRealtimeMode: (enabled: boolean) => void
  recordMetrics: (metrics: ProcessingMetrics) => void
  reset: () => void
}

// ============= 默认值 =============

const DEFAULT_PARAMS: PixelArtParams = {
  pixelSize: 8,
  colorCount: 32,
  palette: 'auto',
  filter: 'none',
  exportFormat: 'png',
  // 像素处理模式
  pixelMode: 'normal',
  edgeDensity: 'medium'
}

const INITIAL_STATE = {
  file: null,
  imageSrc: '',
  result: null,
  params: DEFAULT_PARAMS,
  isProcessing: false,
  realtimeMode: true,
  metrics: null
}

// ============= Store创建 =============

export const usePixelArtUltimateStore = create<PixelArtUltimateState>()(
  devtools(
    (set, get) => ({
      ...INITIAL_STATE,

      setFile: (file) => set({ file }),
      
      setImageSrc: (imageSrc) => set({ imageSrc }),
      
      setResult: (result) => set({ result }),
      
      updateParams: (updates) => set((state) => ({
        params: { ...state.params, ...updates }
      })),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setRealtimeMode: (realtimeMode) => set({ realtimeMode }),
      
      recordMetrics: (metrics) => set({ metrics }),
      
      reset: () => set(INITIAL_STATE)
    }),
    {
      name: 'pixelart-ultimate-store',
      // 只在开发环境启用devtools
      enabled: process.env.NODE_ENV === 'development'
    }
  )
)

// ============= 性能优化Hooks =============

// 仅订阅处理状态的Hook
export const useProcessingState = () => {
  return usePixelArtUltimateStore(state => ({
    isProcessing: state.isProcessing,
    realtimeMode: state.realtimeMode
  }))
}

// 仅订阅参数的Hook
export const usePixelArtParams = () => {
  return usePixelArtUltimateStore(state => state.params)
}

// 仅订阅文件状态的Hook
export const useFileState = () => {
  return usePixelArtUltimateStore(state => ({
    file: state.file,
    imageSrc: state.imageSrc,
    result: state.result
  }))
}

// 仅订阅UI状态的Hook
export const useUIState = () => {
  return usePixelArtUltimateStore(state => ({
    realtimeMode: state.realtimeMode
  }))
}

// 性能指标Hook
export const usePerformanceMetrics = () => {
  return usePixelArtUltimateStore(state => state.metrics)
} 
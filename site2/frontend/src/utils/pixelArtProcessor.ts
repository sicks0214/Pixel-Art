/**
 * 前端像素画处理器
 * 完全基于Canvas API，无需后端传输，速度更快！
 * 🆕 增强版：实时预览 + 预设模板 + 高级调节
 */

// ============= 类型定义 =============

export interface PixelArtOptions {
  resizeFactor: number      // 缩放因子 0-100%
  interpolation: 'nearest' | 'bilinear'  // 插值方法
  colorMode: 'no-dither' | 'ordered-dither'  // 颜色模式
  ditheringRatio: number    // 抖动比例 0.1-3.0
  maxColors?: number        // 最大颜色数（默认32）
  // 🆕 新增参数
  brightness?: number       // 亮度调节 -100 到 100
  contrast?: number         // 对比度 0.5 到 2.0
  saturation?: number       // 饱和度 0 到 2.0
  customPalette?: string[]  // 自定义调色板
  style?: StylePreset       // 预设风格
}

// 🆕 预设风格类型
export type StylePreset = 
  | 'classic-8bit'     // 经典8位游戏
  | '16bit-console'    // 16位主机
  | 'gameboy-green'    // Game Boy绿色
  | 'crt-monitor'      // CRT显示器
  | 'art-poster'       // 艺术海报
  | 'cyberpunk'        // 赛博朋克
  | 'retro-neon'       // 复古霓虹
  | 'custom'           // 自定义

// 🆕 预设风格配置
export const STYLE_PRESETS: Record<StylePreset, Partial<PixelArtOptions>> = {
  'classic-8bit': {
    maxColors: 16,
    colorMode: 'no-dither',
    brightness: 10,
    contrast: 1.2,
    saturation: 1.3
  },
  '16bit-console': {
    maxColors: 32,
    colorMode: 'ordered-dither',
    ditheringRatio: 0.8,
    brightness: 5,
    contrast: 1.1,
    saturation: 1.2
  },
  'gameboy-green': {
    maxColors: 4,
    colorMode: 'no-dither',
    customPalette: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    brightness: 0,
    contrast: 1.4
  },
  'crt-monitor': {
    maxColors: 24,
    colorMode: 'ordered-dither',
    ditheringRatio: 1.5,
    brightness: -5,
    contrast: 1.3,
    saturation: 0.9
  },
  'art-poster': {
    maxColors: 12,
    colorMode: 'no-dither',
    brightness: 15,
    contrast: 1.4,
    saturation: 1.5
  },
  'cyberpunk': {
    maxColors: 20,
    colorMode: 'ordered-dither',
    customPalette: ['#000000', '#0f0f23', '#ff00ff', '#00ffff', '#ff0080', '#8000ff'],
    brightness: 10,
    contrast: 1.6,
    saturation: 1.8
  },
  'retro-neon': {
    maxColors: 16,
    colorMode: 'ordered-dither',
    customPalette: ['#000814', '#001d3d', '#003566', '#ffd60a', '#ffc300', '#ff006e'],
    brightness: 20,
    contrast: 1.5,
    saturation: 2.0
  },
  'custom': {}
}

export interface ProcessingResult {
  canvas: HTMLCanvasElement
  dataUrl: string
  extractedColors: string[]
  canvasInfo: {
    width: number
    height: number
    pixelCount: number
  }
  processingTime: number
}

export interface RGB {
  r: number
  g: number
  b: number
}

// 🆕 实时预览结果
export interface PreviewResult {
  canvas: HTMLCanvasElement
  previewUrl: string
  processingTime: number
}

// ============= 前端像素画处理器类 =============

export class FrontendPixelArtProcessor {
  private tempCanvas: HTMLCanvasElement
  private tempCtx: CanvasRenderingContext2D
  private originalImage: HTMLImageElement | null = null
  private previewCanvas: HTMLCanvasElement
  private previewCtx: CanvasRenderingContext2D

  constructor() {
    // 创建临时画布用于处理
    this.tempCanvas = document.createElement('canvas')
    this.tempCtx = this.tempCanvas.getContext('2d')!
    this.tempCtx.imageSmoothingEnabled = false // 保持像素化效果
    
    // 🆕 创建预览画布
    this.previewCanvas = document.createElement('canvas')
    this.previewCtx = this.previewCanvas.getContext('2d')!
    this.previewCtx.imageSmoothingEnabled = false
  }

  /**
   * 🆕 加载原始图片（用于实时预览）
   */
  async loadOriginalImage(file: File): Promise<void> {
    this.originalImage = await this.loadImage(file)
  }

  /**
   * 🆕 实时预览功能 - 快速生成预览效果
   */
  async generatePreview(
    options: PixelArtOptions,
    maxPreviewSize: number = 200
  ): Promise<PreviewResult> {
    if (!this.originalImage) {
      throw new Error('请先加载原始图片')
    }

    const startTime = performance.now()
    
    try {
      // 计算预览尺寸（保持宽高比）
      const img = this.originalImage
      const scale = Math.min(maxPreviewSize / img.width, maxPreviewSize / img.height)
      const previewWidth = Math.floor(img.width * scale * (options.resizeFactor / 100))
      const previewHeight = Math.floor(img.height * scale * (options.resizeFactor / 100))
      
      // 应用预设风格
      const finalOptions = this.applyStylePreset(options)
      
      // 快速处理
      const processedCanvas = await this.quickProcess(img, previewWidth, previewHeight, finalOptions)
      
      const processingTime = performance.now() - startTime
      
      return {
        canvas: processedCanvas,
        previewUrl: processedCanvas.toDataURL('image/png'),
        processingTime
      }
      
    } catch (error) {
      console.error('[PixelArtProcessor] 预览生成失败:', error)
      throw error
    }
  }

  /**
   * 🆕 应用预设风格
   */
  private applyStylePreset(options: PixelArtOptions): PixelArtOptions {
    if (!options.style || options.style === 'custom') {
      return options
    }
    
    const preset = STYLE_PRESETS[options.style]
    return { ...options, ...preset }
  }

  /**
   * 🆕 快速处理（用于预览）
   */
  private async quickProcess(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    options: PixelArtOptions
  ): Promise<HTMLCanvasElement> {
    // 设置预览画布尺寸
    this.previewCanvas.width = targetWidth
    this.previewCanvas.height = targetHeight
    
    // 设置插值方法
    if (options.interpolation === 'nearest') {
      this.previewCtx.imageSmoothingEnabled = false
    } else {
      this.previewCtx.imageSmoothingEnabled = true
      this.previewCtx.imageSmoothingQuality = 'high'
    }
    
    // 绘制缩放后的图片
    this.previewCtx.drawImage(img, 0, 0, targetWidth, targetHeight)
    
    // 应用颜色调整
    const imageData = this.previewCtx.getImageData(0, 0, targetWidth, targetHeight)
    this.applyColorAdjustments(imageData.data, options)
    
    // 应用像素化效果
    if (options.colorMode === 'no-dither') {
      this.quantizeColors(imageData.data, options.maxColors || 32, options.customPalette)
    } else {
      this.applyOrderedDithering(imageData.data, targetWidth, targetHeight, options.ditheringRatio)
    }
    
    // 写回画布
    this.previewCtx.putImageData(imageData, 0, 0)
    
    return this.previewCanvas
  }

  /**
   * 🆕 颜色调整（亮度、对比度、饱和度）
   */
  private applyColorAdjustments(data: Uint8ClampedArray, options: PixelArtOptions): void {
    const brightness = options.brightness || 0
    const contrast = options.contrast || 1
    const saturation = options.saturation || 1
    
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      
      // 应用亮度
      r += brightness * 2.55
      g += brightness * 2.55
      b += brightness * 2.55
      
      // 应用对比度
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255
      
      // 应用饱和度
      if (saturation !== 1) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = gray + (r - gray) * saturation
        g = gray + (g - gray) * saturation
        b = gray + (b - gray) * saturation
      }
      
      // 确保值在有效范围内
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
      // Alpha通道保持不变
    }
  }

  /**
   * 主处理函数 - 将图片转换为像素画（增强版）
   */
  async processImage(
    file: File, 
    options: PixelArtOptions,
    onProgress?: (progress: number) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now()
    
    try {
      onProgress?.(10)
      
      // 步骤1: 加载图片
      const img = await this.loadImage(file)
      this.originalImage = img // 保存原始图片用于预览
      onProgress?.(20)
      
      // 步骤2: 应用预设风格
      const finalOptions = this.applyStylePreset(options)
      
      // 步骤3: 计算目标尺寸
      const targetWidth = Math.floor(img.width * (finalOptions.resizeFactor / 100))
      const targetHeight = Math.floor(img.height * (finalOptions.resizeFactor / 100))
      onProgress?.(30)
      
      // 步骤4: 图像缩放
      const resizedCanvas = this.resizeImage(img, targetWidth, targetHeight, finalOptions.interpolation)
      onProgress?.(50)
      
      // 步骤5: 颜色处理（增强版）
      const processedCanvas = await this.processColorsEnhanced(resizedCanvas, finalOptions)
      onProgress?.(80)
      
      // 步骤6: 提取颜色统计
      const extractedColors = this.extractColors(processedCanvas, finalOptions.maxColors || 32)
      onProgress?.(90)
      
      const processingTime = performance.now() - startTime
      onProgress?.(100)
      
      return {
        canvas: processedCanvas,
        dataUrl: processedCanvas.toDataURL('image/png'),
        extractedColors,
        canvasInfo: {
          width: processedCanvas.width,
          height: processedCanvas.height,
          pixelCount: processedCanvas.width * processedCanvas.height
        },
        processingTime
      }
      
    } catch (error) {
      console.error('[PixelArtProcessor] 处理失败:', error)
      throw error
    }
  }

  /**
   * 🆕 增强版颜色处理
   */
  private async processColorsEnhanced(canvas: HTMLCanvasElement, options: PixelArtOptions): Promise<HTMLCanvasElement> {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // 应用颜色调整
    this.applyColorAdjustments(data, options)
    
    // 应用像素化效果
    if (options.colorMode === 'no-dither') {
      this.quantizeColors(data, options.maxColors || 32, options.customPalette)
    } else {
      this.applyOrderedDithering(data, canvas.width, canvas.height, options.ditheringRatio)
    }
    
    // 将处理后的数据写回画布
    ctx.putImageData(imageData, 0, 0)
    
    return canvas
  }

  /**
   * 🆕 支持自定义调色板的颜色量化算法
   */
  private quantizeColors(data: Uint8ClampedArray, maxColors: number, customPalette?: string[]): void {
    if (customPalette && customPalette.length > 0) {
      // 使用自定义调色板
      const palette = customPalette.map(color => {
        const hex = color.replace('#', '')
        return {
          r: parseInt(hex.substr(0, 2), 16),
          g: parseInt(hex.substr(2, 2), 16),
          b: parseInt(hex.substr(4, 2), 16)
        }
      })
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // 找到最接近的调色板颜色
        let minDistance = Infinity
        let closestColor = palette[0]
        
        for (const paletteColor of palette) {
          const distance = Math.sqrt(
            Math.pow(r - paletteColor.r, 2) +
            Math.pow(g - paletteColor.g, 2) +
            Math.pow(b - paletteColor.b, 2)
          )
          
          if (distance < minDistance) {
            minDistance = distance
            closestColor = paletteColor
          }
        }
        
        data[i] = closestColor.r
        data[i + 1] = closestColor.g
        data[i + 2] = closestColor.b
      }
    } else {
      // 使用原始的量化算法
      const quantizationLevel = Math.max(1, Math.floor(256 / Math.pow(maxColors, 1/3)))
      
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(data[i] / quantizationLevel) * quantizationLevel
        const g = Math.floor(data[i + 1] / quantizationLevel) * quantizationLevel
        const b = Math.floor(data[i + 2] / quantizationLevel) * quantizationLevel
        
        data[i] = Math.min(255, r)
        data[i + 1] = Math.min(255, g)
        data[i + 2] = Math.min(255, b)
      }
    }
  }

  /**
   * 加载图片文件
   */
  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('图片加载失败'))
      }
      
      img.src = url
    })
  }

  /**
   * 图像缩放处理
   */
  private resizeImage(
    img: HTMLImageElement, 
    targetWidth: number, 
    targetHeight: number, 
    interpolation: 'nearest' | 'bilinear'
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = targetWidth
    canvas.height = targetHeight
    
    // 设置插值方法
    if (interpolation === 'nearest') {
      ctx.imageSmoothingEnabled = false
    } else {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
    }
    
    // 绘制缩放后的图片
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
    
    return canvas
  }

  /**
   * 有序抖动算法（基于拜耳矩阵）
   */
  private applyOrderedDithering(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    ratio: number
  ): void {
    // 4x4 拜耳抖动矩阵
    const bayerMatrix = [
      [ 0,  8,  2, 10],
      [12,  4, 14,  6],
      [ 3, 11,  1,  9],
      [15,  7, 13,  5]
    ]
    
    const matrixSize = 4
    const threshold = 16
    const ditherStrength = ratio * 32 // 抖动强度
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4
        
        // 获取拜耳矩阵值
        const matrixValue = bayerMatrix[y % matrixSize][x % matrixSize]
        const ditherValue = (matrixValue / threshold - 0.5) * ditherStrength
        
        // 应用抖动
        data[index] = Math.max(0, Math.min(255, data[index] + ditherValue))     // R
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] + ditherValue)) // G
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] + ditherValue)) // B
        // Alpha通道不变
      }
    }
  }

  /**
   * 提取图片中的主要颜色
   */
  private extractColors(canvas: HTMLCanvasElement, maxColors: number): string[] {
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const colorCount = new Map<string, number>()
    
    // 统计颜色出现次数
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const alpha = data[i + 3]
      
      // 跳过透明像素
      if (alpha < 128) continue
      
      const colorKey = `${r},${g},${b}`
      colorCount.set(colorKey, (colorCount.get(colorKey) || 0) + 1)
    }
    
    // 按出现次数排序并转换为十六进制
    return Array.from(colorCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map(([colorKey]) => {
        const [r, g, b] = colorKey.split(',').map(Number)
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      })
  }

  /**
   * 清理资源
   */
  dispose(): void {
    // 清理临时画布
    if (this.tempCanvas) {
      this.tempCanvas.width = 0
      this.tempCanvas.height = 0
    }
    if (this.previewCanvas) {
      this.previewCanvas.width = 0
      this.previewCanvas.height = 0
    }
    this.originalImage = null
  }
}

// 导出单例实例
export const frontendPixelArtProcessor = new FrontendPixelArtProcessor()

// ============= 便捷函数 =============

/**
 * 快速处理函数
 */
export async function processPixelArt(
  file: File,
  options: Partial<PixelArtOptions> = {},
  onProgress?: (progress: number) => void
): Promise<ProcessingResult> {
  const defaultOptions: PixelArtOptions = {
    resizeFactor: 50,
    interpolation: 'nearest',
    colorMode: 'no-dither',
    ditheringRatio: 1.0,
    maxColors: 32,
    brightness: 0,
    contrast: 1.0,
    saturation: 1.0,
    style: 'custom',
    ...options
  }
  
  return frontendPixelArtProcessor.processImage(file, defaultOptions, onProgress)
}

/**
 * 🆕 生成实时预览
 */
export async function generatePreview(
  file: File,
  options: Partial<PixelArtOptions> = {},
  maxSize: number = 200
): Promise<PreviewResult> {
  const defaultOptions: PixelArtOptions = {
    resizeFactor: 50,
    interpolation: 'nearest',
    colorMode: 'no-dither',
    ditheringRatio: 1.0,
    maxColors: 32,
    brightness: 0,
    contrast: 1.0,
    saturation: 1.0,
    style: 'custom',
    ...options
  }
  
  // 先加载原始图片
  await frontendPixelArtProcessor.loadOriginalImage(file)
  
  return frontendPixelArtProcessor.generatePreview(defaultOptions, maxSize)
}

/**
 * 检查浏览器支持
 */
export function checkBrowserSupport(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    return !!(ctx && canvas.toDataURL)
  } catch {
    return false
  }
} 
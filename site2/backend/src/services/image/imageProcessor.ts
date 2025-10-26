import sharp from 'sharp'
import { ColorMath, RGB, HSL } from '../color/colorMath'

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

export interface ExtractedColor {
  hex: string
  rgb: RGB
  percentage: number
  position: 'dominant' | 'accent' | 'secondary'
}

export interface ImageAnalysisResult {
  colors: ExtractedColor[]
  dominantColor: ExtractedColor
  colorPalette: ExtractedColor[]
  metadata: {
    width: number
    height: number
    format: string
    fileSize: number
    colorCount: number
    temperature: 'warm' | 'cool' | 'neutral'
    brightness: 'light' | 'medium' | 'dark'
    saturation: 'low' | 'medium' | 'high'
  }
}

export class ImageProcessor {
  private readonly defaultOptions: ImageProcessingOptions = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 85,
    format: 'jpeg'
  }

  /**
   * 处理上传的图像
   */
  async processImage(
    imageBuffer: Buffer, 
    options: ImageProcessingOptions = {}
  ): Promise<{ processedBuffer: Buffer; metadata: any }> {
    const processingOptions = { ...this.defaultOptions, ...options }
    
    let sharpInstance = sharp(imageBuffer)
    
    // 获取图像元数据
    const metadata = await sharpInstance.metadata()
    
    // 调整尺寸
    if (processingOptions.maxWidth || processingOptions.maxHeight) {
      sharpInstance = sharpInstance.resize({
        width: processingOptions.maxWidth,
        height: processingOptions.maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    }
    
    // 转换格式和压缩
    let outputBuffer: Buffer
    switch (processingOptions.format) {
      case 'jpeg':
        outputBuffer = await sharpInstance
          .jpeg({ quality: processingOptions.quality })
          .toBuffer()
        break
      case 'png':
        outputBuffer = await sharpInstance
          .png({ compressionLevel: 6 })
          .toBuffer()
        break
      case 'webp':
        outputBuffer = await sharpInstance
          .webp({ quality: processingOptions.quality })
          .toBuffer()
        break
      default:
        outputBuffer = await sharpInstance.toBuffer()
    }
    
    return {
      processedBuffer: outputBuffer,
      metadata: {
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        originalFormat: metadata.format,
        originalSize: imageBuffer.length,
        processedSize: outputBuffer.length,
        format: processingOptions.format
      }
    }
  }

  /**
   * 提取图像主要颜色
   */
  async extractColors(imageBuffer: Buffer, colorCount: number = 8): Promise<ImageAnalysisResult> {
    try {
      // 调整图像大小以提高处理速度
      const resizedBuffer = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'cover' })
        .toBuffer()

      // 获取原始元数据
      const metadata = await sharp(imageBuffer).metadata()

      // 使用sharp的stats功能获取像素数据
      const { data, info } = await sharp(resizedBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true })

      // 分析颜色
      const colors = this.analyzePixelData(data, info, colorCount)
      const dominantColor = colors[0]
      
      // 计算整体特征
      const temperature = this.calculateImageTemperature(colors)
      const brightness = this.calculateImageBrightness(colors)
      const saturation = this.calculateImageSaturation(colors)

      return {
        colors,
        dominantColor,
        colorPalette: colors.slice(0, 5), // 前5个作为调色板
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          fileSize: imageBuffer.length,
          colorCount: colors.length,
          temperature,
          brightness,
          saturation
        }
      }
    } catch (error) {
      throw new Error(`Failed to extract colors: ${error}`)
    }
  }

  /**
   * 分析像素数据提取颜色
   */
  private analyzePixelData(data: Buffer, info: sharp.OutputInfo, colorCount: number): ExtractedColor[] {
    const { width, height, channels } = info
    const colorMap = new Map<string, number>()
    const totalPixels = width * height

    // 采样像素（每隔几个像素采样一次以提高性能）
    const sampleStep = Math.max(1, Math.floor(totalPixels / 10000)) // 最多采样10000个像素

    for (let i = 0; i < data.length; i += channels * sampleStep) {
      if (i + 2 < data.length) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // 过滤极端颜色（太亮或太暗）
        const brightness = (r + g + b) / 3
        if (brightness < 20 || brightness > 235) continue
        
        // 量化颜色以减少噪音
        const quantizedR = Math.round(r / 16) * 16
        const quantizedG = Math.round(g / 16) * 16
        const quantizedB = Math.round(b / 16) * 16
        
        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      }
    }

    // 排序并提取前N个颜色
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)

    const sampledPixels = Math.floor(totalPixels / sampleStep)
    
    return sortedColors.map((([colorKey, count], index) => {
      const [r, g, b] = colorKey.split(',').map(Number)
      const rgb: RGB = { r, g, b }
      const hex = ColorMath.rgbToHex(rgb)
      const percentage = (count / sampledPixels) * 100

      let position: 'dominant' | 'accent' | 'secondary'
      if (index === 0) position = 'dominant'
      else if (index < 3) position = 'accent'
      else position = 'secondary'

      return {
        hex,
        rgb,
        percentage: Math.round(percentage * 100) / 100,
        position
      }
    }))
  }

  /**
   * 计算图像色温
   */
  private calculateImageTemperature(colors: ExtractedColor[]): 'warm' | 'cool' | 'neutral' {
    let warmScore = 0
    let coolScore = 0

    colors.forEach(color => {
      const temp = ColorMath.getColorTemperature(color.rgb)
      const weight = color.percentage / 100

      if (temp === 'warm') warmScore += weight
      else if (temp === 'cool') coolScore += weight
    })

    if (warmScore > coolScore * 1.2) return 'warm'
    if (coolScore > warmScore * 1.2) return 'cool'
    return 'neutral'
  }

  /**
   * 计算图像亮度
   */
  private calculateImageBrightness(colors: ExtractedColor[]): 'light' | 'medium' | 'dark' {
    const weightedBrightness = colors.reduce((sum, color) => {
      const brightness = ColorMath.getLuminance(color.rgb)
      return sum + brightness * (color.percentage / 100)
    }, 0)

    if (weightedBrightness > 0.6) return 'light'
    if (weightedBrightness > 0.3) return 'medium'
    return 'dark'
  }

  /**
   * 计算图像饱和度
   */
  private calculateImageSaturation(colors: ExtractedColor[]): 'low' | 'medium' | 'high' {
    const weightedSaturation = colors.reduce((sum, color) => {
      const hsl = ColorMath.rgbToHsl(color.rgb)
      return sum + (hsl.s / 100) * (color.percentage / 100)
    }, 0)

    if (weightedSaturation > 0.6) return 'high'
    if (weightedSaturation > 0.3) return 'medium'
    return 'low'
  }

  /**
   * 生成图像的色彩签名（用于相似度比较）
   */
  generateColorSignature(colors: ExtractedColor[]): string {
    return colors
      .slice(0, 5) // 取前5个主要颜色
      .map(color => color.hex)
      .join('-')
  }

  /**
   * 验证图像格式
   */
  isValidImageFormat(buffer: Buffer): boolean {
    try {
      // 检查文件头
      const header = buffer.slice(0, 10)
      
      // JPEG
      if (header[0] === 0xFF && header[1] === 0xD8) return true
      
      // PNG
      if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return true
      
      // WebP
      if (header[8] === 0x57 && header[9] === 0x45) return true
      
      return false
    } catch {
      return false
    }
  }

  /**
   * 计算图像复杂度
   */
  calculateComplexity(colors: ExtractedColor[]): 'simple' | 'moderate' | 'complex' {
    // 基于颜色数量和分布均匀度
    const colorCount = colors.length
    const dominantPercentage = colors[0]?.percentage || 0
    
    if (colorCount <= 3 && dominantPercentage > 50) return 'simple'
    if (colorCount <= 6 && dominantPercentage > 30) return 'moderate'
    return 'complex'
  }

  /**
   * 从HEX计算RGB和HSL - 公共方法
   */
  calculateColorData(hex: string): { rgb: RGB; hsl: HSL } {
    // HEX to RGB
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    // RGB to HSL
    const rNorm = r / 255
    const gNorm = g / 255
    const bNorm = b / 255
    const max = Math.max(rNorm, gNorm, bNorm)
    const min = Math.min(rNorm, gNorm, bNorm)
    const diff = max - min
    const l = (max + min) / 2

    let h = 0
    let s = 0

    if (diff !== 0) {
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min)
      
      switch (max) {
        case rNorm:
          h = (gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)
          break
        case gNorm:
          h = (bNorm - rNorm) / diff + 2
          break
        case bNorm:
          h = (rNorm - gNorm) / diff + 4
          break
      }
      h /= 6
    }

    return {
      rgb: { r, g, b },
      hsl: { 
        h: Math.round(h * 360), 
        s: Math.round(s * 100), 
        l: Math.round(l * 100) 
      }
    }
  }

  /**
   * 从HEX计算RGB和HSL - 内部方法（用于isColorDataConsistent）
   */
  private calculateColorDataInternal(hex: string): { rgb: ExtractedColor['rgb']; hsl: ExtractedColor['rgb'] } {
    const result = this.calculateColorData(hex)
    return {
      rgb: result.rgb,
      hsl: result.rgb // 这里应该是hsl，但为了兼容现有代码暂时保持
    }
  }
} 
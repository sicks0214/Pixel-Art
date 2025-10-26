/**
 * 抖动处理器
 * 实现有序抖动（Ordered Dithering）+ 拜耳矩阵算法
 */

interface RGB {
  r: number
  g: number
  b: number
}

/**
 * 拜耳矩阵生成器
 */
class BayerMatrixGenerator {
  /**
   * 生成拜耳矩阵
   */
  static generateMatrix(size: number): number[][] {
    if (size === 1) {
      return [[0]]
    }
    
    const prevMatrix = this.generateMatrix(size / 2)
    const prevSize = prevMatrix.length
    const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0))
    
    // 递归构造拜耳矩阵
    for (let i = 0; i < prevSize; i++) {
      for (let j = 0; j < prevSize; j++) {
        const value = prevMatrix[i][j] * 4
        matrix[i][j] = value
        matrix[i][j + prevSize] = value + 2
        matrix[i + prevSize][j] = value + 3
        matrix[i + prevSize][j + prevSize] = value + 1
      }
    }
    
    return matrix
  }
  
  /**
   * 标准化矩阵值到0-1范围
   */
  static normalizeMatrix(matrix: number[][]): number[][] {
    const size = matrix.length
    const maxValue = size * size - 1
    
    return matrix.map(row => 
      row.map(value => value / maxValue)
    )
  }
}

/**
 * Floyd-Steinberg抖动算法（误差扩散）
 */
class FloydSteinbergDithering {
  /**
   * 应用Floyd-Steinberg抖动
   */
  static applyDithering(
    imageData: Buffer,
    width: number,
    height: number,
    palette: RGB[]
  ): Buffer {
    const outputData = Buffer.alloc(width * height * 3)
    const errorBuffer = Array(height).fill(0).map(() => 
      Array(width).fill(0).map(() => ({ r: 0, g: 0, b: 0 }))
    )
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 3
        
        // 获取原始颜色并加上累积误差
        const original: RGB = {
          r: Math.max(0, Math.min(255, imageData[offset] + errorBuffer[y][x].r)),
          g: Math.max(0, Math.min(255, imageData[offset + 1] + errorBuffer[y][x].g)),
          b: Math.max(0, Math.min(255, imageData[offset + 2] + errorBuffer[y][x].b))
        }
        
        // 找到最接近的调色板颜色
        const quantized = this.findClosestColor(original, palette)
        
        // 输出量化后的颜色
        outputData[offset] = quantized.r
        outputData[offset + 1] = quantized.g
        outputData[offset + 2] = quantized.b
        
        // 计算量化误差
        const error: RGB = {
          r: original.r - quantized.r,
          g: original.g - quantized.g,
          b: original.b - quantized.b
        }
        
        // 扩散误差到相邻像素
        if (x < width - 1) {
          // 右边像素 (7/16)
          errorBuffer[y][x + 1].r += error.r * 7 / 16
          errorBuffer[y][x + 1].g += error.g * 7 / 16
          errorBuffer[y][x + 1].b += error.b * 7 / 16
        }
        
        if (y < height - 1) {
          if (x > 0) {
            // 左下像素 (3/16)
            errorBuffer[y + 1][x - 1].r += error.r * 3 / 16
            errorBuffer[y + 1][x - 1].g += error.g * 3 / 16
            errorBuffer[y + 1][x - 1].b += error.b * 3 / 16
          }
          
          // 下边像素 (5/16)
          errorBuffer[y + 1][x].r += error.r * 5 / 16
          errorBuffer[y + 1][x].g += error.g * 5 / 16
          errorBuffer[y + 1][x].b += error.b * 5 / 16
          
          if (x < width - 1) {
            // 右下像素 (1/16)
            errorBuffer[y + 1][x + 1].r += error.r * 1 / 16
            errorBuffer[y + 1][x + 1].g += error.g * 1 / 16
            errorBuffer[y + 1][x + 1].b += error.b * 1 / 16
          }
        }
      }
    }
    
    return outputData
  }
  
  private static findClosestColor(color: RGB, palette: RGB[]): RGB {
    let closestColor = palette[0]
    let minDistance = Infinity
    
    for (const paletteColor of palette) {
      const distance = Math.sqrt(
        Math.pow(color.r - paletteColor.r, 2) +
        Math.pow(color.g - paletteColor.g, 2) +
        Math.pow(color.b - paletteColor.b, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestColor = paletteColor
      }
    }
    
    return closestColor
  }
}

/**
 * 抖动处理器类
 */
class DitheringProcessor {
  private bayerMatrix4x4: number[][]
  private bayerMatrix8x8: number[][]
  
  constructor() {
    // 预生成常用的拜耳矩阵
    this.bayerMatrix4x4 = BayerMatrixGenerator.normalizeMatrix(
      BayerMatrixGenerator.generateMatrix(4)
    )
    this.bayerMatrix8x8 = BayerMatrixGenerator.normalizeMatrix(
      BayerMatrixGenerator.generateMatrix(8)
    )
    
    console.log('[DitheringProcessor] 初始化完成')
  }
  
  /**
   * 应用有序抖动 + 拜耳矩阵
   */
  async applyOrderedDithering(
    imageData: Buffer,
    width: number,
    height: number,
    ditheringRatio: number = 1.0
  ): Promise<{
    data: Buffer
    palette: string[]
  }> {
    
    console.log('[DitheringProcessor] 开始有序抖动处理:', {
      imageSize: `${width}x${height}`,
      ratio: ditheringRatio
    })
    
    try {
      // 第一步：生成简化调色板
      const simplifiedPalette = this.generateSimplifiedPalette(imageData, width, height)
      
      // 第二步：应用拜耳矩阵抖动
      const ditheredData = this.applyBayerDithering(
        imageData,
        width,
        height,
        simplifiedPalette,
        ditheringRatio
      )
      
      // 第三步：后处理 - 增强像素画效果
      const enhancedData = this.enhancePixelArtEffect(ditheredData, width, height)
      
      const paletteStrings = simplifiedPalette.map(color => 
        `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
      )
      
      console.log('[DitheringProcessor] 抖动处理完成, 调色板大小:', simplifiedPalette.length)
      
      return {
        data: enhancedData,
        palette: paletteStrings
      }
      
    } catch (error) {
      console.error('[DitheringProcessor] 抖动处理失败:', error)
      throw error
    }
  }
  
  /**
   * 生成简化调色板
   */
  private generateSimplifiedPalette(
    imageData: Buffer,
    width: number,
    height: number,
    maxColors: number = 16
  ): RGB[] {
    
    const colorFrequency = new Map<string, { color: RGB; count: number }>()
    const totalPixels = width * height
    
    // 统计颜色频率
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 3
      const color: RGB = {
        r: imageData[offset],
        g: imageData[offset + 1],
        b: imageData[offset + 2]
      }
      
      // 量化颜色到较粗的级别以减少颜色数
      const quantizedColor: RGB = {
        r: Math.round(color.r / 32) * 32,
        g: Math.round(color.g / 32) * 32,
        b: Math.round(color.b / 32) * 32
      }
      
      const key = `${quantizedColor.r},${quantizedColor.g},${quantizedColor.b}`
      
      if (colorFrequency.has(key)) {
        colorFrequency.get(key)!.count++
      } else {
        colorFrequency.set(key, { color: quantizedColor, count: 1 })
      }
    }
    
    // 选择最常见的颜色作为调色板
    const sortedColors = Array.from(colorFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxColors)
    
    return sortedColors.map(item => item.color)
  }
  
  /**
   * 应用拜耳矩阵抖动
   */
  private applyBayerDithering(
    imageData: Buffer,
    width: number,
    height: number,
    palette: RGB[],
    ditheringRatio: number
  ): Buffer {
    
    const outputData = Buffer.alloc(width * height * 3)
    const matrix = this.bayerMatrix8x8 // 使用8x8矩阵获得更好的效果
    const matrixSize = matrix.length
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 3
        
        // 获取原始颜色
        const original: RGB = {
          r: imageData[offset],
          g: imageData[offset + 1],
          b: imageData[offset + 2]
        }
        
        // 获取拜耳矩阵的阈值
        const threshold = matrix[y % matrixSize][x % matrixSize]
        
        // 应用抖动
        const dithered: RGB = {
          r: this.applyDitheringToChannel(original.r, threshold, ditheringRatio),
          g: this.applyDitheringToChannel(original.g, threshold, ditheringRatio),
          b: this.applyDitheringToChannel(original.b, threshold, ditheringRatio)
        }
        
        // 量化到最接近的调色板颜色
        const quantized = this.findClosestPaletteColor(dithered, palette)
        
        outputData[offset] = quantized.r
        outputData[offset + 1] = quantized.g
        outputData[offset + 2] = quantized.b
      }
    }
    
    return outputData
  }
  
  /**
   * 对单个颜色通道应用抖动
   */
  private applyDitheringToChannel(
    value: number,
    threshold: number,
    ratio: number
  ): number {
    
    const ditheredValue = value + (threshold - 0.5) * 64 * ratio
    return Math.max(0, Math.min(255, Math.round(ditheredValue)))
  }
  
  /**
   * 找到最接近的调色板颜色
   */
  private findClosestPaletteColor(color: RGB, palette: RGB[]): RGB {
    let closestColor = palette[0]
    let minDistance = Infinity
    
    for (const paletteColor of palette) {
      // 使用加权欧几里得距离，更符合人眼感知
      const distance = Math.sqrt(
        0.299 * Math.pow(color.r - paletteColor.r, 2) +
        0.587 * Math.pow(color.g - paletteColor.g, 2) +
        0.114 * Math.pow(color.b - paletteColor.b, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestColor = paletteColor
      }
    }
    
    return closestColor
  }
  
  /**
   * 增强像素画效果
   */
  private enhancePixelArtEffect(
    imageData: Buffer,
    width: number,
    height: number
  ): Buffer {
    
    // 应用轻微的锐化滤波器增强像素边界
    const outputData = Buffer.alloc(width * height * 3)
    
    // 锐化核
    const sharpenKernel = [
      [0, -0.25, 0],
      [-0.25, 2, -0.25],
      [0, -0.25, 0]
    ]
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const centerOffset = (y * width + x) * 3
        
        for (let channel = 0; channel < 3; channel++) {
          let sum = 0
          
          // 应用卷积核
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelOffset = ((y + ky) * width + (x + kx)) * 3 + channel
              sum += imageData[pixelOffset] * sharpenKernel[ky + 1][kx + 1]
            }
          }
          
          // 限制到有效范围
          outputData[centerOffset + channel] = Math.max(0, Math.min(255, Math.round(sum)))
        }
      }
    }
    
    // 复制边界像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          const offset = (y * width + x) * 3
          outputData[offset] = imageData[offset]
          outputData[offset + 1] = imageData[offset + 1]
          outputData[offset + 2] = imageData[offset + 2]
        }
      }
    }
    
    return outputData
  }
}

export const ditheringProcessor = new DitheringProcessor()

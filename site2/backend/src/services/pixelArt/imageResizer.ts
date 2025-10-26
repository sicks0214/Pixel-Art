/**
 * 图像缩放器
 * 实现不同的插值算法进行图像缩放
 */

interface RGB {
  r: number
  g: number
  b: number
}

/**
 * 图像缩放器类
 */
class ImageResizer {
  /**
   * 使用最近邻插值缩放图像
   */
  nearestNeighborResize(
    imageData: Buffer,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Buffer {
    
    console.log('[ImageResizer] 最近邻插值缩放:', {
      from: `${originalWidth}x${originalHeight}`,
      to: `${newWidth}x${newHeight}`
    })
    
    const outputData = Buffer.alloc(newWidth * newHeight * 3)
    
    const xRatio = originalWidth / newWidth
    const yRatio = originalHeight / newHeight
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        // 找到最近邻的源像素
        const srcX = Math.floor(x * xRatio)
        const srcY = Math.floor(y * yRatio)
        
        // 确保索引在有效范围内
        const clampedSrcX = Math.min(srcX, originalWidth - 1)
        const clampedSrcY = Math.min(srcY, originalHeight - 1)
        
        const srcOffset = (clampedSrcY * originalWidth + clampedSrcX) * 3
        const destOffset = (y * newWidth + x) * 3
        
        outputData[destOffset] = imageData[srcOffset]
        outputData[destOffset + 1] = imageData[srcOffset + 1]
        outputData[destOffset + 2] = imageData[srcOffset + 2]
      }
    }
    
    return outputData
  }
  
  /**
   * 使用双线性插值缩放图像
   */
  bilinearResize(
    imageData: Buffer,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Buffer {
    
    console.log('[ImageResizer] 双线性插值缩放:', {
      from: `${originalWidth}x${originalHeight}`,
      to: `${newWidth}x${newHeight}`
    })
    
    const outputData = Buffer.alloc(newWidth * newHeight * 3)
    
    const xRatio = (originalWidth - 1) / newWidth
    const yRatio = (originalHeight - 1) / newHeight
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = x * xRatio
        const srcY = y * yRatio
        
        // 找到四个最近的像素
        const x1 = Math.floor(srcX)
        const y1 = Math.floor(srcY)
        const x2 = Math.min(x1 + 1, originalWidth - 1)
        const y2 = Math.min(y1 + 1, originalHeight - 1)
        
        // 计算权重
        const wx = srcX - x1
        const wy = srcY - y1
        
        // 获取四个角的像素值
        const topLeft = this.getPixel(imageData, x1, y1, originalWidth)
        const topRight = this.getPixel(imageData, x2, y1, originalWidth)
        const bottomLeft = this.getPixel(imageData, x1, y2, originalWidth)
        const bottomRight = this.getPixel(imageData, x2, y2, originalWidth)
        
        // 双线性插值
        const interpolated = this.bilinearInterpolate(
          topLeft, topRight, bottomLeft, bottomRight,
          wx, wy
        )
        
        const destOffset = (y * newWidth + x) * 3
        outputData[destOffset] = Math.round(interpolated.r)
        outputData[destOffset + 1] = Math.round(interpolated.g)
        outputData[destOffset + 2] = Math.round(interpolated.b)
      }
    }
    
    return outputData
  }
  
  /**
   * 使用双三次插值缩放图像（更高质量）
   */
  bicubicResize(
    imageData: Buffer,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Buffer {
    
    console.log('[ImageResizer] 双三次插值缩放:', {
      from: `${originalWidth}x${originalHeight}`,
      to: `${newWidth}x${newHeight}`
    })
    
    const outputData = Buffer.alloc(newWidth * newHeight * 3)
    
    const xRatio = originalWidth / newWidth
    const yRatio = originalHeight / newHeight
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = x * xRatio
        const srcY = y * yRatio
        
        const interpolated = this.bicubicInterpolate(
          imageData, originalWidth, originalHeight,
          srcX, srcY
        )
        
        const destOffset = (y * newWidth + x) * 3
        outputData[destOffset] = Math.max(0, Math.min(255, Math.round(interpolated.r)))
        outputData[destOffset + 1] = Math.max(0, Math.min(255, Math.round(interpolated.g)))
        outputData[destOffset + 2] = Math.max(0, Math.min(255, Math.round(interpolated.b)))
      }
    }
    
    return outputData
  }
  
  /**
   * 获取指定位置的像素值
   */
  private getPixel(
    imageData: Buffer,
    x: number,
    y: number,
    width: number
  ): RGB {
    const offset = (y * width + x) * 3
    return {
      r: imageData[offset],
      g: imageData[offset + 1],
      b: imageData[offset + 2]
    }
  }
  
  /**
   * 安全地获取像素值（处理边界情况）
   */
  private getPixelSafe(
    imageData: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): RGB {
    const clampedX = Math.max(0, Math.min(x, width - 1))
    const clampedY = Math.max(0, Math.min(y, height - 1))
    
    return this.getPixel(imageData, clampedX, clampedY, width)
  }
  
  /**
   * 双线性插值计算
   */
  private bilinearInterpolate(
    topLeft: RGB,
    topRight: RGB,
    bottomLeft: RGB,
    bottomRight: RGB,
    wx: number,
    wy: number
  ): RGB {
    
    // 水平方向插值
    const top: RGB = {
      r: topLeft.r * (1 - wx) + topRight.r * wx,
      g: topLeft.g * (1 - wx) + topRight.g * wx,
      b: topLeft.b * (1 - wx) + topRight.b * wx
    }
    
    const bottom: RGB = {
      r: bottomLeft.r * (1 - wx) + bottomRight.r * wx,
      g: bottomLeft.g * (1 - wx) + bottomRight.g * wx,
      b: bottomLeft.b * (1 - wx) + bottomRight.b * wx
    }
    
    // 垂直方向插值
    return {
      r: top.r * (1 - wy) + bottom.r * wy,
      g: top.g * (1 - wy) + bottom.g * wy,
      b: top.b * (1 - wy) + bottom.b * wy
    }
  }
  
  /**
   * 双三次插值计算
   */
  private bicubicInterpolate(
    imageData: Buffer,
    width: number,
    height: number,
    x: number,
    y: number
  ): RGB {
    
    const x1 = Math.floor(x)
    const y1 = Math.floor(y)
    const dx = x - x1
    const dy = y - y1
    
    let r = 0, g = 0, b = 0
    
    // 使用16个邻近像素进行三次插值
    for (let j = -1; j <= 2; j++) {
      for (let i = -1; i <= 2; i++) {
        const pixel = this.getPixelSafe(imageData, x1 + i, y1 + j, width, height)
        const weight = this.cubicWeight(i - dx) * this.cubicWeight(j - dy)
        
        r += pixel.r * weight
        g += pixel.g * weight
        b += pixel.b * weight
      }
    }
    
    return { r, g, b }
  }
  
  /**
   * 三次权重函数
   */
  private cubicWeight(t: number): number {
    const a = -0.5
    const absT = Math.abs(t)
    
    if (absT <= 1) {
      return (a + 2) * Math.pow(absT, 3) - (a + 3) * Math.pow(absT, 2) + 1
    } else if (absT < 2) {
      return a * Math.pow(absT, 3) - 5 * a * Math.pow(absT, 2) + 8 * a * absT - 4 * a
    }
    
    return 0
  }
  
  /**
   * 像素画专用缩放（保持锐利边缘）
   */
  pixelArtResize(
    imageData: Buffer,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): Buffer {
    
    console.log('[ImageResizer] 像素画专用缩放:', {
      from: `${originalWidth}x${originalHeight}`,
      to: `${newWidth}x${newHeight}`
    })
    
    // 对于像素画，我们使用最近邻插值以保持锐利的边缘
    // 但在某些情况下可能需要后处理来优化结果
    
    const baseResult = this.nearestNeighborResize(
      imageData, originalWidth, originalHeight,
      newWidth, newHeight
    )
    
    // 应用像素画优化滤波器
    return this.applyPixelArtFilter(baseResult, newWidth, newHeight)
  }
  
  /**
   * 应用像素画优化滤波器
   */
  private applyPixelArtFilter(
    imageData: Buffer,
    width: number,
    height: number
  ): Buffer {
    
    const outputData = Buffer.from(imageData)
    
    // 简单的边缘增强算法
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const centerOffset = (y * width + x) * 3
        
        // 检查是否需要增强这个像素
        if (this.shouldEnhancePixel(imageData, x, y, width, height)) {
          // 轻微增强对比度
          for (let c = 0; c < 3; c++) {
            const value = imageData[centerOffset + c]
            const enhanced = value + (value - 128) * 0.1 // 轻微的对比度增强
            outputData[centerOffset + c] = Math.max(0, Math.min(255, Math.round(enhanced)))
          }
        }
      }
    }
    
    return outputData
  }
  
  /**
   * 判断像素是否需要增强
   */
  private shouldEnhancePixel(
    imageData: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    
    const centerOffset = (y * width + x) * 3
    const center = this.getPixel(imageData, x, y, width)
    
    // 检查相邻像素的差异
    let maxDiff = 0
    const neighbors = [
      [-1, 0], [1, 0], [0, -1], [0, 1] // 上下左右
    ]
    
    for (const [dx, dy] of neighbors) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = this.getPixel(imageData, nx, ny, width)
        const diff = Math.max(
          Math.abs(center.r - neighbor.r),
          Math.abs(center.g - neighbor.g),
          Math.abs(center.b - neighbor.b)
        )
        maxDiff = Math.max(maxDiff, diff)
      }
    }
    
    // 如果相邻像素差异较大，说明是边缘，需要增强
    return maxDiff > 30
  }
}

export const imageResizer = new ImageResizer()

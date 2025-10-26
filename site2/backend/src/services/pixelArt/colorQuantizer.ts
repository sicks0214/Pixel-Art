/**
 * 颜色量化器
 * 实现颜色减少算法，创建像素画风格的调色板
 */

interface RGB {
  r: number
  g: number
  b: number
}

interface ColorNode {
  color: RGB
  count: number
  children: ColorNode[]
  isLeaf: boolean
  level: number
  pixelCount: number
}

/**
 * Octree颜色量化算法实现
 */
class OctreeColorQuantizer {
  private root: ColorNode
  private leafNodes: ColorNode[]
  private maxColors: number
  
  constructor(maxColors: number = 256) {
    this.maxColors = maxColors
    this.leafNodes = []
    this.root = {
      color: { r: 0, g: 0, b: 0 },
      count: 0,
      children: [],
      isLeaf: false,
      level: 0,
      pixelCount: 0
    }
  }
  
  /**
   * 添加颜色到八叉树
   */
  private addColor(color: RGB, node: ColorNode = this.root, level: number = 0) {
    if (level === 8) {
      // 达到叶子节点
      node.isLeaf = true
      node.color = color
      node.pixelCount++
      
      if (this.leafNodes.indexOf(node) === -1) {
        this.leafNodes.push(node)
      }
      return
    }
    
    // 计算八叉树索引
    const index = this.getOctreeIndex(color, level)
    
    if (!node.children[index]) {
      node.children[index] = {
        color: { r: 0, g: 0, b: 0 },
        count: 0,
        children: [],
        isLeaf: false,
        level: level + 1,
        pixelCount: 0
      }
    }
    
    this.addColor(color, node.children[index], level + 1)
  }
  
  /**
   * 获取八叉树索引
   */
  private getOctreeIndex(color: RGB, level: number): number {
    const mask = 0x80 >> level
    let index = 0
    
    if (color.r & mask) index |= 4
    if (color.g & mask) index |= 2
    if (color.b & mask) index |= 1
    
    return index
  }
  
  /**
   * 减少颜色数量
   */
  private reduceColors() {
    // 找到像素数最少的叶子节点进行合并
    let minPixels = Infinity
    let targetNode: ColorNode | null = null
    
    for (const leaf of this.leafNodes) {
      if (leaf.pixelCount < minPixels) {
        minPixels = leaf.pixelCount
        targetNode = leaf
      }
    }
    
    if (targetNode) {
      // 从叶子节点列表中移除
      const index = this.leafNodes.indexOf(targetNode)
      if (index > -1) {
        this.leafNodes.splice(index, 1)
      }
    }
  }
  
  /**
   * 获取调色板
   */
  private getPalette(): RGB[] {
    const palette: RGB[] = []
    
    for (const leaf of this.leafNodes) {
      if (leaf.isLeaf && leaf.pixelCount > 0) {
        palette.push({ ...leaf.color })
      }
    }
    
    return palette
  }
  
  /**
   * 量化单个像素
   */
  private quantizePixel(color: RGB): RGB {
    let bestMatch = { r: 0, g: 0, b: 0 }
    let minDistance = Infinity
    
    const palette = this.getPalette()
    
    for (const paletteColor of palette) {
      const distance = this.colorDistance(color, paletteColor)
      if (distance < minDistance) {
        minDistance = distance
        bestMatch = paletteColor
      }
    }
    
    return bestMatch
  }
  
  /**
   * 计算颜色距离
   */
  private colorDistance(c1: RGB, c2: RGB): number {
    const dr = c1.r - c2.r
    const dg = c1.g - c2.g
    const db = c1.b - c2.b
    
    // 使用加权欧几里得距离，更符合人眼感知
    return Math.sqrt(
      0.299 * dr * dr +
      0.587 * dg * dg + 
      0.114 * db * db
    )
  }
  
  /**
   * 量化图像
   */
  quantizeImage(imageData: Buffer, width: number, height: number): {
    data: Buffer
    palette: RGB[]
  } {
    console.log('[ColorQuantizer] 开始八叉树颜色量化:', {
      imageSize: `${width}x${height}`,
      maxColors: this.maxColors
    })
    
    const totalPixels = width * height
    const outputData = Buffer.alloc(totalPixels * 3)
    
    // 第一步：构建八叉树
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 3
      const color: RGB = {
        r: imageData[offset],
        g: imageData[offset + 1],
        b: imageData[offset + 2]
      }
      
      this.addColor(color)
      
      // 控制颜色数量
      while (this.leafNodes.length > this.maxColors) {
        this.reduceColors()
      }
    }
    
    console.log('[ColorQuantizer] 八叉树构建完成, 叶子节点数:', this.leafNodes.length)
    
    // 第二步：量化所有像素
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 3
      const originalColor: RGB = {
        r: imageData[offset],
        g: imageData[offset + 1], 
        b: imageData[offset + 2]
      }
      
      const quantizedColor = this.quantizePixel(originalColor)
      
      outputData[offset] = quantizedColor.r
      outputData[offset + 1] = quantizedColor.g
      outputData[offset + 2] = quantizedColor.b
    }
    
    const palette = this.getPalette()
    console.log('[ColorQuantizer] 量化完成, 调色板大小:', palette.length)
    
    return {
      data: outputData,
      palette: palette.map(color => 
        `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
      )
    }
  }
}

/**
 * K-means颜色聚类算法 (简化版本)
 */
class KMeansColorQuantizer {
  private maxColors: number
  
  constructor(maxColors: number = 256) {
    this.maxColors = maxColors
  }
  
  /**
   * 使用K-means算法量化颜色
   */
  quantizeImage(imageData: Buffer, width: number, height: number): {
    data: Buffer
    palette: RGB[]
  } {
    console.log('[ColorQuantizer] 开始K-means颜色量化:', {
      imageSize: `${width}x${height}`,
      maxColors: this.maxColors
    })
    
    const totalPixels = width * height
    const colors: RGB[] = []
    
    // 收集所有颜色
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 3
      colors.push({
        r: imageData[offset],
        g: imageData[offset + 1],
        b: imageData[offset + 2]
      })
    }
    
    // 简化的K-means实现：随机选择初始中心点
    const centers: RGB[] = []
    const maxIterations = 10
    
    // 初始化中心点
    for (let i = 0; i < Math.min(this.maxColors, colors.length); i++) {
      const randomIndex = Math.floor(Math.random() * colors.length)
      centers.push({ ...colors[randomIndex] })
    }
    
    // K-means迭代
    for (let iter = 0; iter < maxIterations; iter++) {
      const clusters: RGB[][] = Array(centers.length).fill(null).map(() => [])
      
      // 分配颜色到最近的中心点
      for (const color of colors) {
        let nearestCenter = 0
        let minDistance = Infinity
        
        for (let j = 0; j < centers.length; j++) {
          const distance = this.colorDistance(color, centers[j])
          if (distance < minDistance) {
            minDistance = distance
            nearestCenter = j
          }
        }
        
        clusters[nearestCenter].push(color)
      }
      
      // 更新中心点
      for (let j = 0; j < centers.length; j++) {
        if (clusters[j].length > 0) {
          const avgR = clusters[j].reduce((sum, c) => sum + c.r, 0) / clusters[j].length
          const avgG = clusters[j].reduce((sum, c) => sum + c.g, 0) / clusters[j].length
          const avgB = clusters[j].reduce((sum, c) => sum + c.b, 0) / clusters[j].length
          
          centers[j] = {
            r: Math.round(avgR),
            g: Math.round(avgG),
            b: Math.round(avgB)
          }
        }
      }
    }
    
    // 量化所有像素
    const outputData = Buffer.alloc(totalPixels * 3)
    
    for (let i = 0; i < totalPixels; i++) {
      const offset = i * 3
      const originalColor: RGB = {
        r: imageData[offset],
        g: imageData[offset + 1],
        b: imageData[offset + 2]
      }
      
      let nearestCenter = centers[0]
      let minDistance = Infinity
      
      for (const center of centers) {
        const distance = this.colorDistance(originalColor, center)
        if (distance < minDistance) {
          minDistance = distance
          nearestCenter = center
        }
      }
      
      outputData[offset] = nearestCenter.r
      outputData[offset + 1] = nearestCenter.g
      outputData[offset + 2] = nearestCenter.b
    }
    
    console.log('[ColorQuantizer] K-means量化完成, 调色板大小:', centers.length)
    
    return {
      data: outputData,
      palette: centers.map(color => 
        `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`
      )
    }
  }
  
  private colorDistance(c1: RGB, c2: RGB): number {
    const dr = c1.r - c2.r
    const dg = c1.g - c2.g
    const db = c1.b - c2.b
    
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }
}

/**
 * 颜色量化器类
 */
class ColorQuantizer {
  /**
   * 量化图像颜色
   */
  async quantizeImage(
    imageData: Buffer,
    width: number,
    height: number,
    maxColors: number = 32
  ): Promise<{
    data: Buffer
    palette: string[]
  }> {
    
    try {
      // 使用八叉树算法进行颜色量化
      const octreeQuantizer = new OctreeColorQuantizer(maxColors)
      const result = octreeQuantizer.quantizeImage(imageData, width, height)
      
      return {
        data: result.data,
        palette: result.palette
      }
      
    } catch (error) {
      console.error('[ColorQuantizer] 量化失败，尝试备用方法:', error)
      
      // 备用方案：使用K-means算法
      try {
        const kmeansQuantizer = new KMeansColorQuantizer(maxColors)
        const result = kmeansQuantizer.quantizeImage(imageData, width, height)
        
        return {
          data: result.data,
          palette: result.palette
        }
      } catch (backupError) {
        console.error('[ColorQuantizer] 备用方法也失败:', backupError)
        throw new Error('颜色量化失败')
      }
    }
  }
}

export const colorQuantizer = new ColorQuantizer()

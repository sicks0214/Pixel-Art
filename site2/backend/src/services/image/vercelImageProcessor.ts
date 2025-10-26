import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  filename: string
  mimeType: string
  aspectRatio: number
}

export interface ProcessedImage {
  id: string
  buffer: Buffer
  thumbnailBuffer?: Buffer
  metadata: ImageMetadata
  checksum: string
}

export interface ProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  generateThumbnail?: boolean
  thumbnailSize?: { width: number; height: number }
}

export class VercelImageProcessor {
  private readonly DEFAULT_MAX_WIDTH = 1920
  private readonly DEFAULT_MAX_HEIGHT = 1080
  private readonly DEFAULT_QUALITY = 85
  private readonly DEFAULT_THUMBNAIL_SIZE = { width: 300, height: 300 }

  /**
   * 处理上传的图像文件（Vercel兼容）
   */
  async processImage(
    fileBuffer: Buffer,
    originalName: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage> {
    try {
      console.log(`[VercelImageProcessor] 开始处理图像: ${originalName}`)

      // 获取图像信息
      const sharpImage = sharp(fileBuffer)
      const metadata = await sharpImage.metadata()

      if (!metadata.width || !metadata.height) {
        throw new Error('无法获取图像尺寸信息')
      }

      // 设置处理选项
      const maxWidth = options.maxWidth || this.DEFAULT_MAX_WIDTH
      const maxHeight = options.maxHeight || this.DEFAULT_MAX_HEIGHT
      const quality = options.quality || this.DEFAULT_QUALITY

      // 计算目标尺寸
      const targetSize = this.calculateTargetSize(
        metadata.width,
        metadata.height,
        maxWidth,
        maxHeight
      )

      // 处理主图像
      const processedImageBuffer = await sharpImage
        .resize(targetSize.width, targetSize.height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality })
        .toBuffer()

      // 生成缩略图（如果需要）
      let thumbnailBuffer: Buffer | undefined
      if (options.generateThumbnail !== false) {
        const thumbSize = options.thumbnailSize || this.DEFAULT_THUMBNAIL_SIZE
        thumbnailBuffer = await sharpImage
          .resize(thumbSize.width, thumbSize.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 80 })
          .toBuffer()
      }

      // 生成图像ID和校验和
      const imageId = uuidv4()
      const checksum = crypto
        .createHash('md5')
        .update(processedImageBuffer)
        .digest('hex')

      // 构建元数据
      const processedMetadata: ImageMetadata = {
        width: targetSize.width,
        height: targetSize.height,
        format: 'jpeg',
        size: processedImageBuffer.length,
        filename: `${imageId}.jpg`,
        mimeType: 'image/jpeg',
        aspectRatio: targetSize.width / targetSize.height
      }

      console.log(`[VercelImageProcessor] 图像处理完成: ${imageId}`)

      return {
        id: imageId,
        buffer: processedImageBuffer,
        thumbnailBuffer,
        metadata: processedMetadata,
        checksum
      }
    } catch (error) {
      console.error('[VercelImageProcessor] 图像处理失败:', error)
      throw new Error(`图像处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 从图像Buffer提取颜色
   */
  async extractColorsFromBuffer(
    imageBuffer: Buffer,
    colorCount: number = 5
  ): Promise<Array<{ hex: string; rgb: [number, number, number]; percentage: number }>> {
    try {
      // 调整图像大小以提高性能
      const resizedBuffer = await sharp(imageBuffer)
        .resize(200, 200, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true })

      const { data, info } = resizedBuffer
      const colors = this.extractDominantColors(data, info.width, info.height, colorCount)

      return colors
    } catch (error) {
      console.error('[VercelImageProcessor] 颜色提取失败:', error)
      throw new Error('颜色提取失败')
    }
  }

  /**
   * 从像素位置获取颜色
   */
  async getPixelColor(
    imageBuffer: Buffer,
    x: number,
    y: number
  ): Promise<{ hex: string; rgb: [number, number, number] }> {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true })

      // 确保坐标在图像范围内
      const clampedX = Math.max(0, Math.min(x, info.width - 1))
      const clampedY = Math.max(0, Math.min(y, info.height - 1))

      // 计算像素在数组中的位置
      const pixelIndex = (clampedY * info.width + clampedX) * info.channels
      
      const r = data[pixelIndex]
      const g = data[pixelIndex + 1]
      const b = data[pixelIndex + 2]

      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

      return {
        hex,
        rgb: [r, g, b]
      }
    } catch (error) {
      console.error('[VercelImageProcessor] 像素颜色获取失败:', error)
      throw new Error('像素颜色获取失败')
    }
  }

  /**
   * 计算目标尺寸
   */
  private calculateTargetSize(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight

    let targetWidth = originalWidth
    let targetHeight = originalHeight

    // 如果超过最大宽度，按宽度缩放
    if (targetWidth > maxWidth) {
      targetWidth = maxWidth
      targetHeight = Math.round(targetWidth / aspectRatio)
    }

    // 如果高度仍然超过最大高度，按高度缩放
    if (targetHeight > maxHeight) {
      targetHeight = maxHeight
      targetWidth = Math.round(targetHeight * aspectRatio)
    }

    return { width: targetWidth, height: targetHeight }
  }

  /**
   * 提取主要颜色（简化实现）
   */
  private extractDominantColors(
    pixelData: Buffer,
    width: number,
    height: number,
    colorCount: number
  ): Array<{ hex: string; rgb: [number, number, number]; percentage: number }> {
    const colorMap = new Map<string, number>()
    const totalPixels = width * height

    // 采样像素以提高性能
    const sampleRate = Math.max(1, Math.floor(totalPixels / 10000))

    for (let i = 0; i < pixelData.length; i += 3 * sampleRate) {
      const r = pixelData[i]
      const g = pixelData[i + 1]
      const b = pixelData[i + 2]

      // 量化颜色以减少相似颜色
      const quantizedR = Math.round(r / 32) * 32
      const quantizedG = Math.round(g / 32) * 32
      const quantizedB = Math.round(b / 32) * 32

      const key = `${quantizedR},${quantizedG},${quantizedB}`
      colorMap.set(key, (colorMap.get(key) || 0) + 1)
    }

    // 排序并取前N个颜色
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, colorCount)

    const sampledPixels = Math.floor(totalPixels / sampleRate)

    return sortedColors.map(([color, count]) => {
      const [r, g, b] = color.split(',').map(Number)
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      const percentage = (count / sampledPixels) * 100

      return {
        hex,
        rgb: [r, g, b] as [number, number, number],
        percentage: Math.round(percentage * 100) / 100
      }
    })
  }
}

// 导出单例实例
export const vercelImageProcessor = new VercelImageProcessor() 
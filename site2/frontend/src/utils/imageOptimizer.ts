/**
 * 图像优化工具
 * 提供图像压缩、缩放、格式转换等功能
 */

// 图像优化选项
interface ImageOptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  enableResize?: boolean
}

// 图像信息
interface ImageInfo {
  width: number
  height: number
  size: number
  format: string
  aspectRatio: number
}

/**
 * 获取图像基本信息
 */
export async function getImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      const info: ImageInfo = {
        width: img.width,
        height: img.height,
        size: file.size,
        format: file.type,
        aspectRatio: img.width / img.height
      }
      
      URL.revokeObjectURL(url)
      resolve(info)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法加载图像'))
    }
    
    img.src = url
  })
}

/**
 * 压缩和优化图像
 */
export async function optimizeImage(
  file: File, 
  options: ImageOptimizeOptions = {}
): Promise<{ file: File; info: ImageInfo }> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.9,
    format = 'jpeg',
    enableResize = true
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        let { width, height } = img
        
        // 计算优化后的尺寸
        if (enableResize && (width > maxWidth || height > maxHeight)) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = Math.min(width, maxWidth)
            height = width / aspectRatio
          } else {
            height = Math.min(height, maxHeight)
            width = height * aspectRatio
          }
        }
        
        // 创建Canvas进行重绘
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('无法创建Canvas上下文')
        }
        
        canvas.width = width
        canvas.height = height
        
        // 高质量重绘
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        
        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('图像优化失败'))
              return
            }
            
            const optimizedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, `.${format}`),
              { type: blob.type }
            )
            
            const info: ImageInfo = {
              width,
              height,
              size: blob.size,
              format: blob.type,
              aspectRatio: width / height
            }
            
            URL.revokeObjectURL(url)
            resolve({ file: optimizedFile, info })
          },
          format === 'jpeg' ? 'image/jpeg' : `image/${format}`,
          quality
        )
        
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图像加载失败'))
    }
    
    img.src = url
  })
}

/**
 * 创建图像缩略图
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('无法创建Canvas上下文')
        }
        
        // 计算缩略图尺寸（保持宽高比）
        const aspectRatio = img.width / img.height
        let width: number
        let height: number
        
        if (aspectRatio > 1) {
          width = size
          height = size / aspectRatio
        } else {
          height = size
          width = size * aspectRatio
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制缩略图
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        URL.revokeObjectURL(url)
        resolve(thumbnailUrl)
        
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
      }
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('缩略图生成失败'))
    }
    
    img.src = url
  })
}

/**
 * 批量处理图像
 */
export async function batchOptimizeImages(
  files: File[],
  options: ImageOptimizeOptions = {},
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<Array<{ file: File; info: ImageInfo }>> {
  const results: Array<{ file: File; info: ImageInfo }> = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await optimizeImage(files[i], options)
      results.push(result)
      
      if (onProgress) {
        onProgress(((i + 1) / files.length) * 100, i + 1, files.length)
      }
    } catch (error) {
      console.error(`优化图像 ${files[i].name} 失败:`, error)
      // 使用原始文件作为fallback
      const info = await getImageInfo(files[i])
      results.push({ file: files[i], info })
    }
  }
  
  return results
}

/**
 * 检查图像是否需要优化
 */
export function shouldOptimizeImage(file: File, maxSize: number = 2048): boolean {
  // 文件大小超过限制
  if (file.size > maxSize * 1024) {
    return true
  }
  
  // 特定格式需要转换
  if (file.type === 'image/bmp' || file.type === 'image/tiff') {
    return true
  }
  
  return false
}

/**
 * 估算优化后的文件大小
 */
export function estimateOptimizedSize(
  originalSize: number,
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number,
  quality: number = 0.9
): number {
  const sizeRatio = (targetWidth * targetHeight) / (originalWidth * originalHeight)
  const qualityFactor = quality * 0.8 + 0.2 // 质量对文件大小的影响
  
  return Math.round(originalSize * sizeRatio * qualityFactor)
}

// 导出优化工具对象
export const imageOptimizer = {
  getImageInfo,
  optimizeImage,
  createThumbnail,
  batchOptimizeImages,
  shouldOptimizeImage,
  estimateOptimizedSize
}

export default imageOptimizer

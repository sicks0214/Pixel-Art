/**
 * 图片上传自定义Hook
 */

import { useState, useCallback } from 'react'
import { useImageStore } from '@/store/imageStore'
import { useAppStore } from '@/store/appStore'
import { imageService } from '@/services/imageService'
import type { ImageData } from '@/types/image'

interface UseImageUploadOptions {
  maxSize?: number // bytes
  allowedTypes?: string[]
  autoUpload?: boolean
  onSuccess?: (imageData: ImageData) => void
  onError?: (error: Error) => void
}

interface UseImageUploadReturn {
  // 状态
  uploading: boolean
  progress: number
  error: string | null
  
  // 方法
  uploadFile: (file: File) => Promise<void>
  uploadFromUrl: (url: string) => Promise<void>
  validateFile: (file: File) => { valid: boolean; error?: string }
  reset: () => void
}

export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    autoUpload = true,
    onSuccess,
    onError,
  } = options

  // 状态
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Store
  const { setImage, setProcessingStatus } = useImageStore()
  const { addError } = useAppStore()

  /**
   * 验证文件
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件格式。支持的格式：${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
      }
    }

    // 检查文件大小
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024))
      return {
        valid: false,
        error: `文件过大。最大支持 ${maxSizeMB}MB`
      }
    }

    // 检查文件名
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: '文件名无效或过长'
      }
    }

    return { valid: true }
  }, [allowedTypes, maxSize])

  /**
   * 上传文件
   */
  const uploadFile = useCallback(async (file: File): Promise<void> => {
    try {
      // 重置状态
      setError(null)
      setProgress(0)

      // 验证文件
      const validation = validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      setUploading(true)
      setProcessingStatus('uploading')

      // 创建图片预览URL
      const url = URL.createObjectURL(file)

      // 获取图片尺寸
      const dimensions = await getImageDimensions(file)

      // 构建图片数据
      const imageData: ImageData = {
        file,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        lastModified: file.lastModified,
      }

      if (autoUpload) {
        // 调用API上传
        const response = await imageService.uploadImage(file)
        
        if (response.success && response.data) {
          // 更新图片数据
          const uploadedImageData: ImageData = {
            ...imageData,
            url: response.data.url, // 使用服务器返回的URL
          }
          
          setImage(uploadedImageData)
          setProcessingStatus('uploaded')
          
          console.log('✅ 图片上传成功')
          onSuccess?.(uploadedImageData)
        } else {
          throw new Error(response.error || '上传失败')
        }
      } else {
        // 仅设置本地预览
        setImage(imageData)
        setProcessingStatus('uploaded')
        onSuccess?.(imageData)
      }

      setProgress(100)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传失败'
      setError(errorMessage)
      setProcessingStatus('error')
      
      // 添加到全局错误
      addError(errorMessage, 'error')
      
      console.error('❌ 图片上传失败:', err)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setUploading(false)
    }
  }, [validateFile, autoUpload, setImage, setProcessingStatus, addError, onSuccess, onError])

  /**
   * 从URL上传图片
   */
  const uploadFromUrl = useCallback(async (url: string): Promise<void> => {
    try {
      setError(null)
      setUploading(true)
      setProcessingStatus('uploading')

      // 下载图片
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('无法下载图片')
      }

      const blob = await response.blob()
      const file = new File([blob], 'image.jpg', { type: blob.type })

      // 使用上传文件方法
      await uploadFile(file)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '从URL上传失败'
      setError(errorMessage)
      setProcessingStatus('error')
      
      addError(errorMessage, 'error')
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [uploadFile, setProcessingStatus, addError, onError])

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    uploading,
    progress,
    error,
    uploadFile,
    uploadFromUrl,
    validateFile,
    reset,
  }
}

/**
 * 获取图片尺寸
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取图片尺寸'))
    }
    
    img.src = url
  })
} 
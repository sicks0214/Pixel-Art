import React, { useRef, useEffect, useState, useCallback } from 'react'
import { AlertCircle, Download, Maximize2, RotateCcw } from 'lucide-react'
import { performanceMonitor } from '@/utils/performanceMonitor'
import { memoryManager } from '@/utils/memoryManager'

interface ImageCanvasProps {
  imageUrl: string | null
  title: string
  placeholder?: {
    icon: string
    text: string
  }
  isProcessing?: boolean
  enableControls?: boolean
  onImageLoad?: (dimensions: { width: number; height: number }) => void
  onDownload?: () => void
}

interface ImageDimensions {
  width: number
  height: number
  fileSize?: number
}

/**
 * 增强的图像Canvas显示组件
 * 支持加载状态、错误处理、图像信息显示和控制
 */
const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageUrl,
  title,
  placeholder = { icon: '📷', text: '无图像' },
  isProcessing = false,
  enableControls = false,
  onImageLoad,
  onDownload
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [zoom, setZoom] = useState(1)
  const [canFitToScreen, setCanFitToScreen] = useState(true)

  // 清除Canvas
  const clearCanvas = useCallback(() => {
    const endMeasure = performanceMonitor.startMeasurement('canvas-clear')
    
    const canvas = canvasRef.current
    if (!canvas) {
      endMeasure()
      return
    }
    
    // 使用管理的Canvas上下文
    const ctx = memoryManager.getManagedCanvasContext(canvas)
    if (!ctx) {
      endMeasure()
      return
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    endMeasure()
  }, [])

  // 绘制图像（带性能监控和渲染缓存）
  const drawImage = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement) => {
    // 生成缓存键，避免重复绘制相同内容
    const cacheKey = `${img.src}-${zoom}-${canvas.width}x${canvas.height}`
    
    // 简单的渲染缓存检查（避免频繁重绘）
    if ((img as any)._lastCacheKey === cacheKey) {
      console.log('[Canvas] 跳过重复绘制，使用缓存')
      return
    }

    const endMeasure = performanceMonitor.startMeasurement('canvas-draw', {
      imageSize: `${img.width}x${img.height}`,
      canvasSize: `${canvas.width}x${canvas.height}`,
      zoom,
      cached: (img as any)._lastCacheKey === cacheKey
    })

    // 使用管理的Canvas上下文
    const ctx = memoryManager.getManagedCanvasContext(canvas)
    if (!ctx) {
      endMeasure()
      return
    }

    try {
      // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 计算适配尺寸，保持宽高比
      const canvasAspect = canvas.width / canvas.height
      const imgAspect = img.width / img.height

      let drawWidth: number
      let drawHeight: number

      if (imgAspect > canvasAspect) {
        // 图片更宽，以宽度为准
        drawWidth = canvas.width * zoom
        drawHeight = (canvas.width / imgAspect) * zoom
      } else {
        // 图片更高，以高度为准
        drawHeight = canvas.height * zoom
        drawWidth = (canvas.height * imgAspect) * zoom
      }

      // 居中绘制
      const x = (canvas.width - drawWidth) / 2
      const y = (canvas.height - drawHeight) / 2

      // 设置图像渲染质量
      ctx.imageSmoothingEnabled = false // 保持像素画的锐利效果
      ctx.imageSmoothingQuality = 'high'

      // 绘制图像
      ctx.drawImage(img, x, y, drawWidth, drawHeight)
      
      // 设置缓存键，标记此次绘制
      ;(img as any)._lastCacheKey = cacheKey
      
      // 记录成功的绘制
      const measurement = endMeasure()
      
      if (process.env.NODE_ENV === 'development' && measurement.duration > 16) {
        console.warn(`[Canvas] 绘制时间过长: ${measurement.duration.toFixed(2)}ms`)
      }
      
    } catch (err) {
      console.error('Failed to draw image on canvas:', err)
      setError('图像绘制失败')
      endMeasure()
    }
  }, [zoom])

  // 加载图像（带性能监控和内存管理）
  useEffect(() => {
    if (!imageUrl) {
      clearCanvas()
      setImageDimensions(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const endMeasure = performanceMonitor.startMeasurement('image-load', {
      imageUrl: imageUrl.substring(0, 50) + '...', // 截取URL避免过长
    })

    setIsLoading(true)
    setError(null)

    // 创建图像对象
    const img = new Image()
    const loadStartTime = performance.now()
    
    img.onload = () => {
      try {
        const loadEndTime = performance.now()
        const loadDuration = loadEndTime - loadStartTime
        
        // 设置图像尺寸信息
        const dimensions: ImageDimensions = {
          width: img.width,
          height: img.height
        }
        setImageDimensions(dimensions)
        
        // 通知父组件
        onImageLoad?.(dimensions)
        
        // 绘制图像
        drawImage(img, canvas)
        
        setIsLoading(false)
        
        // 记录加载完成
        const measurement = endMeasure()
        
        console.log(`图像加载成功: ${img.width}x${img.height}, 加载时间: ${loadDuration.toFixed(2)}ms, 总时间: ${measurement.duration.toFixed(2)}ms`)
        
        // 如果加载时间过长，发出警告
        if (process.env.NODE_ENV === 'development' && loadDuration > 1000) {
          console.warn(`[ImageCanvas] 图像加载时间过长: ${loadDuration.toFixed(2)}ms`)
        }
        
      } catch (err) {
        console.error('Image processing error:', err)
        setError('图像处理失败')
        setIsLoading(false)
        endMeasure()
      }
    }

    img.onerror = (err) => {
      console.error('Failed to load image:', imageUrl, err)
      setError('图像加载失败')
      setIsLoading(false)
      endMeasure()
    }

    // 设置跨域属性（如果需要）
    img.crossOrigin = 'anonymous'
    img.src = imageUrl

    // 清理函数
    return () => {
      img.onload = null
      img.onerror = null
      // 如果还在加载中，记录取消
      if (isLoading) {
        console.log('[ImageCanvas] 图像加载被取消')
        endMeasure()
      }
    }
  }, [imageUrl, drawImage, onImageLoad, clearCanvas, isLoading])

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      const canvas = canvasRef.current
      if (canvas) {
        memoryManager.clearCanvasContext(canvas)
        console.log(`[ImageCanvas] Canvas上下文已清理: ${title}`)
      }
    }
  }, [title])

  // 重置缩放
  const handleResetZoom = () => {
    setZoom(1)
  }

  // 下载图像
  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else if (canvasRef.current) {
      try {
        const canvas = canvasRef.current
        const link = document.createElement('a')
        link.download = `${title}-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch (err) {
        console.error('Failed to download image:', err)
      }
    }
  }

  // 全屏查看
  const handleFullscreen = () => {
    const canvas = canvasRef.current
    if (canvas && canvas.requestFullscreen) {
      canvas.requestFullscreen()
    }
  }

  return (
    <div className="flex-1 bg-[#2a2d3a] rounded-lg p-4 flex flex-col">
      {/* 标题和控制区 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300 truncate">
          {title}
          {imageDimensions && (
            <span className="ml-2 text-xs text-gray-400">
              {imageDimensions.width}×{imageDimensions.height}
            </span>
          )}
        </h3>
        
        {/* 控制按钮 */}
        {enableControls && imageUrl && !isLoading && !error && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetZoom}
              disabled={zoom === 1}
              className="p-1 rounded hover:bg-[#4a4d5a] text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="重置缩放"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleFullscreen}
              className="p-1 rounded hover:bg-[#4a4d5a] text-gray-400 hover:text-gray-200 transition-colors"
              title="全屏查看"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-1 rounded hover:bg-[#4a4d5a] text-gray-400 hover:text-gray-200 transition-colors"
              title="下载图像"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      {/* Canvas容器 */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-full object-contain bg-[#1a1b23] rounded border-2 border-gray-600 transition-all duration-200"
          style={{
            imageRendering: 'pixelated', // CSS像素化渲染
            cursor: enableControls && imageUrl ? 'pointer' : 'default'
          }}
        />
        
        {/* 加载状态 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b23] bg-opacity-80 rounded">
            <div className="text-center text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#06b6d4] border-t-transparent mx-auto mb-2" />
              <div className="text-sm">加载中...</div>
            </div>
          </div>
        )}
        
        {/* 处理中状态 */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b23] bg-opacity-90 rounded">
            <div className="text-center text-gray-300">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8b5cf6] border-t-transparent mx-auto mb-2" />
              <div className="text-sm">处理中...</div>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-red-400">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <div className="text-sm">{error}</div>
            </div>
          </div>
        )}
        
        {/* 占位符显示 */}
        {!imageUrl && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-3xl mb-2">{placeholder.icon}</div>
              <div className="text-sm">{placeholder.text}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* 图像信息 */}
      {imageDimensions && !error && (
        <div className="mt-3 text-xs text-gray-400 space-y-1">
          <div>尺寸: {imageDimensions.width} × {imageDimensions.height} 像素</div>
          {imageDimensions.fileSize && (
            <div>大小: {(imageDimensions.fileSize / 1024).toFixed(2)} KB</div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageCanvas

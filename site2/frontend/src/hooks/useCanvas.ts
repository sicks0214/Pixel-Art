/**
 * Canvas操作自定义Hook
 */

import { useRef, useCallback, useState, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useImageStore } from '@/store/imageStore'
import { useAppStore } from '@/store/appStore'
import type {
  TextElement
} from '@/types/editor'
import type { ImageData } from '@/types/image'

interface UseCanvasOptions {
  onCanvasReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void
  onElementClick?: (element: TextElement) => void
  onCanvasClick?: (x: number, y: number) => void
  onError?: (error: Error) => void
}

interface UseCanvasReturn {
  // Canvas引用
  canvasRef: React.RefObject<HTMLCanvasElement>
  
  // 状态
  isReady: boolean
  isDrawing: boolean
  error: string | null
  
  // Canvas操作
  redraw: () => void
  clear: () => void
  exportAsImage: (format?: 'png' | 'jpeg' | 'webp') => string
  exportAsBlob: (format?: 'png' | 'jpeg' | 'webp', quality?: number) => Promise<Blob | null>
  
  // 坐标转换
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number }
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number }
  
  // 元素操作
  getElementAt: (x: number, y: number) => TextElement | null
  drawText: (element: TextElement) => void
  drawImage: (imageData: ImageData) => void
  
  // 实用方法
  fitToContainer: () => void
  centerCanvas: () => void
  resetView: () => void
}

export const useCanvas = (options: UseCanvasOptions = {}): UseCanvasReturn => {
  const {
    onCanvasReady,
    onElementClick,
    onCanvasClick,
    onError,
  } = options

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  // 状态
  const [isReady, setIsReady] = useState(false)
  const [isDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store
  const { 
    textElements, 
    zoom, 
    selectedElementId,
    setSelectedElementId 
  } = useEditorStore()
  
  const { image } = useImageStore()
  const { addError } = useAppStore()

  /**
   * 处理错误
   */
  const handleError = useCallback((err: Error) => {
    const errorMessage = err.message || 'Canvas操作失败'
    setError(errorMessage)
    addError(errorMessage, 'error')
    onError?.(err)
    console.error('❌ Canvas错误:', err)
  }, [addError, onError])

  /**
   * 初始化Canvas
   */
  const initCanvas = useCallback(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('无法获取Canvas 2D上下文')
      }

      contextRef.current = ctx

      // 设置Canvas尺寸
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // 设置渲染质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      setIsReady(true)
      onCanvasReady?.(canvas, ctx)

      console.log('✅ Canvas初始化完成')
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Canvas初始化失败'))
    }
  }, [onCanvasReady, handleError])

  /**
   * 重绘Canvas
   */
  const redraw = useCallback(() => {
    try {
      const canvas = canvasRef.current
      const ctx = contextRef.current
      
      if (!canvas || !ctx) return

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 保存当前状态
      ctx.save()

      // 应用缩放
      ctx.scale(zoom, zoom)

      // 绘制背景图片
      if (image) {
        drawImage(image)
      }

      // 绘制所有文字元素
      textElements.forEach(element => {
        if (element.visible !== false) {
          drawText(element)
        }
      })

      // 恢复状态
      ctx.restore()

      // 绘制选择框
      if (selectedElementId) {
        const selectedElement = textElements.find(el => el.id === selectedElementId)
        if (selectedElement) {
          drawSelection(selectedElement)
        }
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('重绘失败'))
    }
  }, [zoom, image, textElements, selectedElementId, handleError])

  /**
   * 绘制图片
   */
  const drawImage = useCallback((imageData: ImageData) => {
    try {
      const ctx = contextRef.current
      const canvas = canvasRef.current
      if (!ctx || !canvas || !imageData.url) return

      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width / zoom, canvas.height / zoom)
      }
      img.onerror = () => {
        handleError(new Error('图片加载失败'))
      }
      img.src = imageData.url
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('绘制图片失败'))
    }
  }, [zoom, handleError])

  /**
   * 绘制文字
   */
  const drawText = useCallback((element: TextElement) => {
    try {
      const ctx = contextRef.current
      if (!ctx) return

      ctx.save()

      // 设置字体样式
      ctx.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize}px ${element.fontFamily || 'Arial'}`
      ctx.fillStyle = element.color
      ctx.textAlign = element.textAlign || 'left'
      ctx.globalAlpha = element.opacity || 1

      // 应用旋转
      if (element.rotation) {
        ctx.translate(element.x, element.y)
        ctx.rotate((element.rotation * Math.PI) / 180)
        ctx.translate(-element.x, -element.y)
      }

      // 绘制阴影
      if (element.shadow) {
        ctx.shadowColor = element.shadow.color
        ctx.shadowBlur = element.shadow.blur
        ctx.shadowOffsetX = element.shadow.offsetX
        ctx.shadowOffsetY = element.shadow.offsetY
      }

      // 绘制描边
      if (element.strokeColor && element.strokeWidth) {
        ctx.strokeStyle = element.strokeColor
        ctx.lineWidth = element.strokeWidth
        ctx.strokeText(element.text, element.x, element.y)
      }

      // 绘制文字
      ctx.fillText(element.text, element.x, element.y)

      ctx.restore()
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('绘制文字失败'))
    }
  }, [handleError])

  /**
   * 绘制选择框
   */
  const drawSelection = useCallback((element: TextElement) => {
    try {
      const ctx = contextRef.current
      if (!ctx) return

      ctx.save()

      // 计算文字边界
      ctx.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize}px ${element.fontFamily || 'Arial'}`
      const metrics = ctx.measureText(element.text)
      const textWidth = metrics.width
      const textHeight = element.fontSize

      // 绘制选择框
      ctx.strokeStyle = '#007bff'
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([5 / zoom, 5 / zoom])
      ctx.strokeRect(
        element.x - 5,
        element.y - textHeight - 5,
        textWidth + 10,
        textHeight + 10
      )

      ctx.restore()
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('绘制选择框失败'))
    }
  }, [zoom, handleError])

  /**
   * 屏幕坐标转Canvas坐标
   */
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (screenX - rect.left) / zoom,
      y: (screenY - rect.top) / zoom,
    }
  }, [zoom])

  /**
   * Canvas坐标转屏幕坐标
   */
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * zoom,
      y: canvasY * zoom,
    }
  }, [zoom])

  /**
   * 获取指定位置的元素
   */
  const getElementAt = useCallback((x: number, y: number): TextElement | null => {
    try {
      const ctx = contextRef.current
      if (!ctx) return null

      // 从顶层开始查找（z-index最大的）
      const sortedElements = [...textElements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))

      for (const element of sortedElements) {
        if (!element.visible) continue

        // 计算文字边界
        ctx.font = `${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'} ${element.fontSize}px ${element.fontFamily || 'Arial'}`
        const metrics = ctx.measureText(element.text)
        const textWidth = metrics.width
        const textHeight = element.fontSize

        // 检查点击是否在元素范围内
        if (
          x >= element.x &&
          x <= element.x + textWidth &&
          y >= element.y - textHeight &&
          y <= element.y
        ) {
          return element
        }
      }

      return null
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('获取元素失败'))
      return null
    }
  }, [textElements, handleError])

  /**
   * 清空Canvas
   */
  const clear = useCallback(() => {
    const ctx = contextRef.current
    if (!ctx) return

    ctx.clearRect(0, 0, canvasRef.current?.width || 0, canvasRef.current?.height || 0)
  }, [])

  /**
   * 导出为图片
   */
  const exportAsImage = useCallback((format: 'png' | 'jpeg' | 'webp' = 'png'): string => {
    const canvas = canvasRef.current
    if (!canvas) return ''

    return canvas.toDataURL(`image/${format}`)
  }, [])

  /**
   * 导出为Blob
   */
  const exportAsBlob = useCallback((
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.92
  ): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current
      if (!canvas) {
        resolve(null)
        return
      }

      canvas.toBlob(resolve, `image/${format}`, quality)
    })
  }, [])

  /**
   * 适应容器
   */
  const fitToContainer = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const container = canvas.parentElement
    if (!container) return

    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.width = container.offsetWidth
    canvas.height = container.offsetHeight

    redraw()
  }, [redraw])

  /**
   * 居中Canvas
   */
  const centerCanvas = useCallback(() => {
    // 这里可以实现将Canvas内容居中的逻辑
    redraw()
  }, [redraw])

  /**
   * 重置视图
   */
  const resetView = useCallback(() => {
    fitToContainer()
    centerCanvas()
  }, [fitToContainer, centerCanvas])

  // Canvas点击事件处理
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    const { x, y } = screenToCanvas(event.clientX, event.clientY)
    
    // 查找点击的元素
    const clickedElement = getElementAt(x, y)
    
    if (clickedElement) {
      setSelectedElementId(clickedElement.id)
      onElementClick?.(clickedElement)
    } else {
      setSelectedElementId(null)
      onCanvasClick?.(x, y)
    }
  }, [screenToCanvas, getElementAt, setSelectedElementId, onElementClick, onCanvasClick])

  // 初始化效果
  useEffect(() => {
    initCanvas()
  }, [initCanvas])

  // 重绘效果
  useEffect(() => {
    if (isReady) {
      redraw()
    }
  }, [isReady, redraw, textElements, image, zoom, selectedElementId])

  // 事件监听器
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
    }
  }, [handleCanvasClick])

  return {
    canvasRef,
    isReady,
    isDrawing,
    error,
    redraw,
    clear,
    exportAsImage,
    exportAsBlob,
    screenToCanvas,
    canvasToScreen,
    getElementAt,
    drawText,
    drawImage,
    fitToContainer,
    centerCanvas,
    resetView,
  }
}

export type { UseCanvasReturn } 
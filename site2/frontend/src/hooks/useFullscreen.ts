import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * 全屏模式Hook
 * 提供全屏进入、退出和状态管理功能
 */
export function useFullscreen(defaultElement?: HTMLElement | null) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const elementRef = useRef<HTMLElement | null>(defaultElement || null)

  // 检查浏览器支持
  useEffect(() => {
    setIsSupported(
      !!(document.fullscreenEnabled ||
         (document as any).webkitFullscreenEnabled ||
         (document as any).mozFullScreenEnabled ||
         (document as any).msFullscreenEnabled)
    )
  }, [])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement

      setIsFullscreen(!!fullscreenElement)
      
      if (!fullscreenElement) {
        console.log('[Fullscreen] 已退出全屏模式')
      } else {
        console.log('[Fullscreen] 已进入全屏模式')
      }
    }

    const handleFullscreenError = (event: Event) => {
      console.error('[Fullscreen] 全屏操作失败:', event)
      setError('全屏操作失败，请检查浏览器权限设置')
      setTimeout(() => setError(null), 3000)
    }

    // 添加事件监听器
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    document.addEventListener('fullscreenerror', handleFullscreenError)
    document.addEventListener('webkitfullscreenerror', handleFullscreenError)
    document.addEventListener('mozfullscreenerror', handleFullscreenError)
    document.addEventListener('MSFullscreenError', handleFullscreenError)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)

      document.removeEventListener('fullscreenerror', handleFullscreenError)
      document.removeEventListener('webkitfullscreenerror', handleFullscreenError)
      document.removeEventListener('mozfullscreenerror', handleFullscreenError)
      document.removeEventListener('MSFullscreenError', handleFullscreenError)
    }
  }, [])

  // 进入全屏
  const enterFullscreen = useCallback(async (element?: HTMLElement | null) => {
    if (!isSupported) {
      setError('当前浏览器不支持全屏模式')
      return false
    }

    const targetElement = element || elementRef.current || document.documentElement

    try {
      if (targetElement.requestFullscreen) {
        await targetElement.requestFullscreen()
      } else if ((targetElement as any).webkitRequestFullscreen) {
        await (targetElement as any).webkitRequestFullscreen()
      } else if ((targetElement as any).mozRequestFullScreen) {
        await (targetElement as any).mozRequestFullScreen()
      } else if ((targetElement as any).msRequestFullscreen) {
        await (targetElement as any).msRequestFullscreen()
      } else {
        throw new Error('不支持的全屏API')
      }

      setError(null)
      return true
    } catch (err) {
      console.error('[Fullscreen] 进入全屏失败:', err)
      setError('无法进入全屏模式，请检查浏览器设置')
      return false
    }
  }, [isSupported])

  // 退出全屏
  const exitFullscreen = useCallback(async () => {
    if (!isFullscreen) return true

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      } else {
        throw new Error('不支持的退出全屏API')
      }

      setError(null)
      return true
    } catch (err) {
      console.error('[Fullscreen] 退出全屏失败:', err)
      setError('无法退出全屏模式')
      return false
    }
  }, [isFullscreen])

  // 切换全屏状态
  const toggleFullscreen = useCallback(async (element?: HTMLElement | null) => {
    if (isFullscreen) {
      return await exitFullscreen()
    } else {
      return await enterFullscreen(element)
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  // 设置目标元素
  const setElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element
  }, [])

  return {
    isFullscreen,
    isSupported,
    error,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    setElement
  }
}

/**
 * 全屏预览Hook
 * 专门用于图像预览的全屏功能
 */
export function useFullscreenPreview() {
  const fullscreen = useFullscreen()
  const [previewElement, setPreviewElement] = useState<HTMLElement | null>(null)

  // 进入预览全屏
  const enterPreview = useCallback(async (element: HTMLElement) => {
    setPreviewElement(element)
    
    // 添加全屏样式
    element.style.position = 'fixed'
    element.style.top = '0'
    element.style.left = '0'
    element.style.width = '100vw'
    element.style.height = '100vh'
    element.style.zIndex = '9999'
    element.style.backgroundColor = '#000'
    element.style.display = 'flex'
    element.style.alignItems = 'center'
    element.style.justifyContent = 'center'

    return await fullscreen.enterFullscreen(element)
  }, [fullscreen])

  // 退出预览全屏
  const exitPreview = useCallback(async () => {
    const success = await fullscreen.exitFullscreen()
    
    if (success && previewElement) {
      // 清除全屏样式
      previewElement.style.position = ''
      previewElement.style.top = ''
      previewElement.style.left = ''
      previewElement.style.width = ''
      previewElement.style.height = ''
      previewElement.style.zIndex = ''
      previewElement.style.backgroundColor = ''
      previewElement.style.display = ''
      previewElement.style.alignItems = ''
      previewElement.style.justifyContent = ''
      
      setPreviewElement(null)
    }
    
    return success
  }, [fullscreen, previewElement])

  return {
    ...fullscreen,
    enterPreview,
    exitPreview,
    previewElement
  }
}

/**
 * 画中画模式Hook
 * 提供画中画功能（仅支持video元素）
 */
export function usePictureInPicture() {
  const [isPiPSupported, setIsPiPSupported] = useState(false)
  const [isPiPActive, setIsPiPActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsPiPSupported('pictureInPictureEnabled' in document)
  }, [])

  const enterPiP = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!isPiPSupported) {
      setError('当前浏览器不支持画中画模式')
      return false
    }

    try {
      await videoElement.requestPictureInPicture()
      setIsPiPActive(true)
      setError(null)
      return true
    } catch (err) {
      console.error('[PiP] 进入画中画失败:', err)
      setError('无法进入画中画模式')
      return false
    }
  }, [isPiPSupported])

  const exitPiP = useCallback(async () => {
    if (!document.pictureInPictureElement) {
      return true
    }

    try {
      await document.exitPictureInPicture()
      setIsPiPActive(false)
      setError(null)
      return true
    } catch (err) {
      console.error('[PiP] 退出画中画失败:', err)
      setError('无法退出画中画模式')
      return false
    }
  }, [])

  useEffect(() => {
    const handleEnterPiP = () => setIsPiPActive(true)
    const handleLeavePiP = () => setIsPiPActive(false)

    document.addEventListener('enterpictureinpicture', handleEnterPiP)
    document.addEventListener('leavepictureinpicture', handleLeavePiP)

    return () => {
      document.removeEventListener('enterpictureinpicture', handleEnterPiP)
      document.removeEventListener('leavepictureinpicture', handleLeavePiP)
    }
  }, [])

  return {
    isPiPSupported,
    isPiPActive,
    error,
    enterPiP,
    exitPiP
  }
}

export default useFullscreen

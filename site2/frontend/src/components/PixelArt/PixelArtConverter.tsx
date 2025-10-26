import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/hooks/useToast'
import { usePixelArtShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useFullscreen } from '@/hooks/useFullscreen'
import { performanceMonitor } from '@/utils/performanceMonitor'
import { memoryManager } from '@/utils/memoryManager'
import { usePixelArtStore } from '@/store/pixelArtStore'
import { ToastContainer } from './UI/Toast'
import ShortcutHelp from './UI/ShortcutHelp'
import ErrorBoundary from './UI/ErrorBoundary'
import ControlPanel from './ControlPanel'
import PreviewArea from './PreviewArea'
import InfoPanel from './InfoPanel'

/**
 * 像素画转换器主容器组件
 * 基于截图精确复刻界面，实现完整的像素画转换功能
 * 集成性能监控和内存管理
 */
const PixelArtConverter: React.FC = () => {
  const { t } = useTranslation()
  const { toasts, dismissToast, showSuccess, showInfo } = useToast()
  const { startRender, endRender } = performanceMonitor.usePerformanceMonitor('PixelArtConverter')
  
  // 状态管理 (COLOR02分离式架构)
  const { 
    fileState,
    uploadState,
    conversionState,
    resultState,
    globalError,
    setSelectedFile,
    resetAll
  } = usePixelArtStore()

  // 组件状态
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 全屏功能
  const { 
    isFullscreen, 
    toggleFullscreen, 
    isSupported: isFullscreenSupported,
    error: fullscreenError 
  } = useFullscreen()

  // 快捷键处理函数
  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleConvert = async () => {
    if (!fileState.selectedFile || uploadState.isUploading || conversionState.isConverting) return
    
    // 这里触发转换逻辑，实际实现在ControlPanel中
    const convertButton = document.querySelector('[data-testid="convert-button"]') as HTMLButtonElement
    convertButton?.click()
    
    showInfo('快捷键转换：Ctrl + Enter')
  }

  const handleDownload = () => {
    if (!resultState.pixelArtImage || uploadState.isUploading || conversionState.isConverting) return
    
    // 这里触发下载逻辑，实际实现在ControlPanel中
    const downloadButton = document.querySelector('[data-testid="download-button"]') as HTMLButtonElement
    downloadButton?.click()
    
    showInfo('快捷键下载：Ctrl + S')
  }

  const handleReset = () => {
    resetAll()
    showSuccess('设置已重置')
  }

  const handleToggleFullscreen = () => {
    toggleFullscreen(containerRef.current)
    if (fullscreenError) {
      showInfo(fullscreenError)
    }
  }

  const handleShowHelp = () => {
    setShowShortcutHelp(true)
  }

  const handleEscape = () => {
    if (showShortcutHelp) {
      setShowShortcutHelp(false)
    } else if (uploadState.isUploading || conversionState.isConverting) {
      showInfo('正在处理中，无法取消')
    }
  }

  // 注册快捷键
  usePixelArtShortcuts({
    onSelectFile: handleSelectFile,
    onConvert: handleConvert,
    onDownload: handleDownload,
    onReset: handleReset,
    onToggleFullscreen: handleToggleFullscreen,
    onShowHelp: handleShowHelp,
    onEscape: handleEscape,
    enabled: !showShortcutHelp // 帮助面板打开时禁用其他快捷键
  })

  // 文件选择处理
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // 组件挂载时的初始化
  useEffect(() => {
    console.log('[PixelArt] 组件初始化')
    
    // 开发环境下启用性能监控
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.startFPSMonitor()
      performanceMonitor.startLongTaskMonitor()
      
      // 定期输出性能报告
      const reportInterval = memoryManager.createManagedInterval(() => {
        performanceMonitor.logPerformanceReport()
        memoryManager.logMemoryStats()
      }, 30000) // 每30秒输出一次
      
      return () => {
        performanceMonitor.stopFPSMonitor()
        performanceMonitor.stopLongTaskMonitor()
        memoryManager.clearManagedInterval(reportInterval)
      }
    }
  }, [])

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      console.log('[PixelArt] 组件清理')
      
      // 执行内存清理
      memoryManager.performFullCleanup()
      
      // 清理性能数据（保留统计）
      if (process.env.NODE_ENV === 'development') {
        console.log('[PixelArt] 最终性能报告：')
        performanceMonitor.logPerformanceReport()
      }
    }
  }, [])

  // 渲染性能监控
  startRender()

  const content = (
    <div 
      ref={containerRef}
      className={`
        min-h-screen bg-[#1a1b23] text-white relative
        ${isFullscreen ? 'p-0' : ''}
      `}
      style={{ willChange: 'transform' }}
    >
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 页面标题 */}
      {!isFullscreen && (
        <div className="text-center py-8">
          <h1 className="text-2xl font-semibold text-white">
            {t('colorcraft.pixelArt.title', 'Conversor de Imagens para Pixel Art - Wplace')}
          </h1>
          
          {/* 快捷键提示 */}
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setShowShortcutHelp(true)}
              className="text-xs text-gray-400 hover:text-[#06b6d4] transition-colors flex items-center gap-1"
            >
              <span>🔥</span>
              <span>按 F1 查看快捷键</span>
            </button>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div className={`max-w-7xl mx-auto px-4 pb-8 ${isFullscreen ? 'max-w-none h-screen' : ''}`}>
        <div className={`flex gap-6 ${isFullscreen ? 'h-full' : 'h-[calc(100vh-200px)]'}`}>
          {/* 左侧控制面板 */}
          <div className={`${isFullscreen ? 'w-64' : 'w-80'} flex-shrink-0 ${isFullscreen ? 'bg-[#2a2d3a] rounded-lg' : ''}`}>
            <ControlPanel />
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 flex flex-col">
            {/* 预览区域 */}
            <div className="flex-1 mb-6">
              <PreviewArea />
            </div>

            {/* 底部信息面板 */}
            <div className={`${isFullscreen ? 'h-32' : 'h-48'} flex-shrink-0`}>
              <InfoPanel />
            </div>
          </div>
        </div>
      </div>

      {/* 全屏模式指示器 */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-40 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>全屏模式 - 按 F11 退出</span>
          </div>
        </div>
      )}

      {/* Toast通知容器 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 快捷键帮助面板 */}
      <ShortcutHelp
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
      />

      {/* 开发环境下的性能指示器 */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceIndicator />
      )}
    </div>
  )

  // 渲染完成监控
  useEffect(() => {
    endRender()
  })

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[PixelArtConverter] 渲染错误:', error, errorInfo)
        
        // 记录错误到性能监控
        performanceMonitor.startMeasurement('error-boundary-triggered', {
          errorMessage: error.message,
          componentStack: errorInfo.componentStack?.substring(0, 200)
        })()
        
        // 清理资源
        memoryManager.performFullCleanup()
      }}
    >
      {content}
    </ErrorBoundary>
  )
}

/**
 * 开发环境性能指示器（优化版本）
 */
const PerformanceIndicator: React.FC = React.memo(() => {
  const [stats, setStats] = React.useState<{
    fps: number
    memory: string
    longTasks: number
  }>({ fps: 0, memory: '0MB', longTasks: 0 })
  
  // 防抖更新状态，避免频繁重渲染
  const [isUpdating, setIsUpdating] = React.useState(false)

  useEffect(() => {
    let animationFrameId: number | undefined
    
    const updateStats = () => {
      // 避免在更新过程中重复调用
      if (isUpdating) return
      
      setIsUpdating(true)
      
      const fpsStats = performanceMonitor.getFPSStats()
      const memoryUsage = performanceMonitor.getMemoryUsage()
      const longTasksStats = performanceMonitor.getPerformanceStats('long-task')
      
      const newStats = {
        fps: Math.round(fpsStats?.current || 0),
        memory: memoryUsage?.usedMB || '0MB',
        longTasks: longTasksStats?.count || 0
      }
      
      // 只在数据实际变化时更新，减少不必要的渲染
      setStats(prevStats => {
        if (
          prevStats.fps !== newStats.fps ||
          prevStats.memory !== newStats.memory ||
          prevStats.longTasks !== newStats.longTasks
        ) {
          return newStats
        }
        return prevStats
      })
      
      setIsUpdating(false)
    }

    // 降低更新频率：从每秒到每3秒，减少DOM更新
    const interval = setInterval(updateStats, 3000)
    updateStats()

    return () => {
      clearInterval(interval)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isUpdating])

  // 条件渲染：只在开发环境显示，且性能数据有意义时才显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div 
      className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50 transition-opacity duration-300"
      style={{ willChange: 'opacity' }} // GPU加速优化
    >
      <div>FPS: {stats.fps}</div>
      <div>Memory: {stats.memory}</div>
      {stats.longTasks > 0 && (
        <div className="text-orange-400">Long Tasks: {stats.longTasks}</div>
      )}
    </div>
  )
})

export default PixelArtConverter

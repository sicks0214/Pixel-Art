import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { usePixelArtStore, INTERPOLATION_OPTIONS, COLOR_MODE_OPTIONS } from '@/store/pixelArtStore'
import { useToast } from '@/hooks/useToast'
import RangeSlider from './RangeSlider'
import DropdownSelect from './DropdownSelect'
import ActionButtons from './ActionButtons'
import ErrorDisplay from '../UI/ErrorDisplay'

/**
 * 控制面板组件（优化版本）
 * 基于截图界面精确复刻，支持参数调整和转换操作
 * 优化：添加memo和状态选择器，减少不必要的重渲染
 */
const ControlPanel: React.FC = memo(() => {
  const { t } = useTranslation()
  
  // 优化状态访问：仅选择需要的状态，减少重渲染
  const {
    fileState,
    parameterState,
    conversionState,
    resultState,
    globalError,
    // Actions
    setSelectedFile,
    updateParameterState,
    startConversion,
    setGlobalError,
    resetAll
  } = usePixelArtStore(state => ({
    fileState: state.fileState,
    parameterState: state.parameterState,
    conversionState: state.conversionState,
    resultState: state.resultState,
    globalError: state.globalError,
    setSelectedFile: state.setSelectedFile,
    updateParameterState: state.updateParameterState,
    startConversion: state.startConversion,
    setGlobalError: state.setGlobalError,
    resetAll: state.resetAll
  }))
  
  const { showSuccess, showError } = useToast()
  
  // 使用useMemo缓存复杂计算，避免每次渲染都重新计算
  const isConverting = useMemo(() => conversionState.isConverting, [conversionState.isConverting])
  const hasFile = useMemo(() => !!fileState.selectedFile, [fileState.selectedFile])
  const hasResult = useMemo(() => !!resultState.pixelArtImage, [resultState.pixelArtImage])

  // ============= 文件管理（简化版） =============
  
  const handleFileRemove = () => {
    setSelectedFile(null)
    setGlobalError(null)
    console.log('[ControlPanel] 文件已移除')
  }

  // ============= 转换处理（COLOR02模式） =============
  
  const handleConvert = async () => {
    if (!fileState.selectedFile) {
      const error = '请先选择一个图片文件'
      setGlobalError({
        code: 'NO_FILE',
        message: error,
        timestamp: new Date()
      })
      showError(error)
      return
    }
    
    console.log('[ControlPanel] COLOR02模式开始转换:', {
      fileName: fileState.fileName,
      params: parameterState
    })
    
    try {
      // ⚡ COLOR02模式：直接调用store的转换方法
      await startConversion()
      
      // 转换成功处理
      if (resultState.pixelArtImage) {
        const processingTime = (resultState.processingTime / 1000).toFixed(1)
        showSuccess(
          `转换完成！处理时间 ${processingTime}s，生成了${resultState.extractedColors.length}种颜色`,
          '下载图片',
          () => handleDownload()
        )
        
        console.log('[ControlPanel] ✅ 转换成功完成')
      }
      
    } catch (error) {
      console.error('[ControlPanel] 转换失败:', error)
      const errorMsg = error instanceof Error ? error.message : '转换失败，请重试'
      
      showError(errorMsg, '重试', () => {
        setGlobalError(null)
        handleConvert()
      })
    }
  }

  // ============= 下载处理 =============
  
  const handleDownload = () => {
    if (!resultState.pixelArtImage) {
      const errorMsg = '请先转换图片'
      setGlobalError({
        code: 'NO_RESULT',
        message: errorMsg,
        timestamp: new Date()
      })
      showError(errorMsg)
      return
    }
    
    try {
      const link = document.createElement('a')
      link.download = `pixel-art-${fileState.fileName || 'image'}-${Date.now()}.png`
      link.href = resultState.pixelArtImage
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.log('[ControlPanel] 开始下载像素画')
      showSuccess('下载开始！像素画文件已保存到下载文件夹')
      
    } catch (error) {
      console.error('[ControlPanel] 下载失败:', error)
      const errorMsg = '下载失败，请重试'
      showError(errorMsg, '重试', () => handleDownload())
    }
  }

  // ============= 错误处理 =============
  
  const handleRetryConvert = () => {
    setGlobalError(null)
    handleConvert()
  }

  const handleDismissError = () => {
    setGlobalError(null)
  }

  // ============= 渲染助手（分离式） =============
  
  const getCurrentError = useMemo(() => {
    if (globalError) return globalError.message
    if (conversionState.error) return conversionState.error
    return null
  }, [globalError, conversionState.error])

  const getCurrentProgress = useMemo(() => {
    return conversionState.isConverting ? conversionState.progress : 0
  }, [conversionState.isConverting, conversionState.progress])

  return (
    <div className="bg-[#2a2d3a] rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-lg font-medium text-white mb-6">
        {t('colorcraft.pixelArt.options', '选项')}
      </h2>
      
      <div className="flex-1 overflow-y-auto">
        {/* 文件状态显示（简化版，主要上传在预览区域） */}
        {hasFile && (
          <div className="mb-6 p-3 bg-[#1a1b23] rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {fileState.fileName}
                </div>
                {fileState.fileDimensions && (
                  <div className="text-xs text-gray-400">
                    {fileState.fileDimensions.width} × {fileState.fileDimensions.height} 像素
                  </div>
                )}
              </div>
              <button
                onClick={handleFileRemove}
                className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                title="移除文件"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {conversionState.isConverting && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>转换中</span>
                  <span>{conversionState.progress}%</span>
                </div>
                <div className="bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-cyan-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${conversionState.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 调整大小因子 */}
        <RangeSlider
          label={t('colorcraft.pixelArt.resizeFactor', '调整大小因子')}
          value={parameterState.resizeFactor}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={(value) => updateParameterState({ resizeFactor: value })}
          disabled={isConverting}
          showTooltip={true}
          description="控制输出图像相对于原图的大小"
          helpText="较小的值会创建更粗糙的像素画效果，较大的值保留更多细节"
        />

        {/* 插值方法 */}
        <DropdownSelect
          label={t('colorcraft.pixelArt.interpolation', '插值方法')}
          options={INTERPOLATION_OPTIONS}
          value={parameterState.interpolation}
          onChange={(value) => updateParameterState({ interpolation: value })}
          disabled={isConverting}
        />

        {/* 颜色模式 */}
        <DropdownSelect
          label={t('colorcraft.pixelArt.colorMode', '颜色模式')}
          options={COLOR_MODE_OPTIONS}
          value={parameterState.colorMode}
          onChange={(value) => updateParameterState({ colorMode: value })}
          disabled={isConverting}
        />

        {/* 抖动比例 */}
        <RangeSlider
          label={t('colorcraft.pixelArt.ditheringRatio', '抖动比例')}
          value={parameterState.ditheringRatio}
          min={0.1}
          max={3.0}
          step={0.1}
          unit="x"
          onChange={(value) => updateParameterState({ ditheringRatio: value })}
          disabled={isConverting}
          showTooltip={true}
          formatValue={(value) => value.toFixed(1) + 'x'}
          description="控制颜色抖动的强度"
          helpText="较高的值会产生更多颜色混合效果，较低的值保持更纯净的像素块"
        />

        {/* 错误显示（分离式） */}
        {getCurrentError && (
          <ErrorDisplay
            error={getCurrentError}
            onRetry={handleRetryConvert}
            onDismiss={handleDismissError}
            compact={true}
          />
        )}

        {/* 转换状态显示（COLOR02风格） */}
        {isConverting && (
          <div className="mt-4 p-3 bg-[#4a4d5a] rounded-lg">
            <div className="text-sm text-gray-300 mb-2">
              转换状态: {conversionState.currentStep === 'preparing' ? '准备中' :
                        conversionState.currentStep === 'processing' ? '处理中' :
                        conversionState.currentStep === 'finishing' ? '完成中' :
                        '转换中'}
            </div>
            {conversionState.estimatedTime && (
              <div className="text-xs text-gray-400">
                预计剩余时间: {Math.max(0, conversionState.estimatedTime - (Date.now() - (conversionState.startTime || 0)))}ms
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮（COLOR02风格） */}
      <div className="mt-6">
        <ActionButtons
          isProcessing={isConverting}
          hasResult={hasResult}
          processingProgress={getCurrentProgress}
          onConvert={handleConvert}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
})

export default ControlPanel

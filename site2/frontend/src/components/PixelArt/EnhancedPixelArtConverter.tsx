import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  useFrontendPixelArtStore, 
  useProcessingState, 
  useFileState, 
  useResultState, 
  useParametersState,
  usePreviewState
} from '@/store/frontendPixelArtStore'
import { STYLE_PRESETS, StylePreset } from '@/utils/pixelArtProcessor'
import { 
  Upload, Download, Play, RotateCcw, Zap, Clock, Settings, Eye, 
  Sparkles, Palette, Sun, Contrast, Droplets, Sliders, Lightbulb
} from 'lucide-react'

/**
 * 🚀 增强版前端像素画转换器 - 超越竞争对手！
 * ✨ 实时预览 + 预设风格 + 高级调节 + 智能建议
 */
const EnhancedPixelArtConverter: React.FC = () => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  
  // 状态管理
  const {
    setSelectedFile, clearFile, updateParameters, applyStylePreset,
    startProcessing, downloadResult, resetAll, setError,
    togglePreview, suggestOptimalParameters
  } = useFrontendPixelArtStore()
  
  const { isProcessing, progress, currentStep, isSupported } = useProcessingState()
  const { selectedFile, fileName, fileDimensions, originalImageUrl } = useFileState()
  const { result, hasResult } = useResultState()
  const { parameters } = useParametersState()
  const { previewResult, isPreviewEnabled, hasPreview } = usePreviewState()
  
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 预设风格选项
  const styleOptions = [
    { value: 'custom' as StylePreset, label: '自定义', description: '手动调整参数' },
    { value: 'classic-8bit' as StylePreset, label: '经典8位', description: '怀旧游戏风格' },
    { value: '16bit-console' as StylePreset, label: '16位主机', description: '更丰富色彩' },
    { value: 'gameboy-green' as StylePreset, label: 'Game Boy', description: '经典绿色单色' },
    { value: 'cyberpunk' as StylePreset, label: '赛博朋克', description: '霓虹色彩' },
  ]

  // 文件选择处理
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0]
      
      if (!file.type.startsWith('image/')) {
        setError('请选择有效的图片文件')
        return
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('图片文件过大，请选择小于10MB的文件')
        return
      }
      
      setSelectedFile(file)
    }
  }, [setSelectedFile, setError])

  // 更新预览Canvas显示
  useEffect(() => {
    if (previewResult?.canvas && previewCanvasRef.current) {
      const displayCtx = previewCanvasRef.current.getContext('2d')!
      const targetCanvas = previewCanvasRef.current
      const sourceCanvas = previewResult.canvas
      
      targetCanvas.width = sourceCanvas.width
      targetCanvas.height = sourceCanvas.height
      
      displayCtx.imageSmoothingEnabled = false
      displayCtx.drawImage(sourceCanvas, 0, 0)
    }
  }, [previewResult?.canvas])

  // 更新结果Canvas显示
  useEffect(() => {
    if (result.canvas && canvasRef.current) {
      const displayCtx = canvasRef.current.getContext('2d')!
      const targetCanvas = canvasRef.current
      const sourceCanvas = result.canvas
      
      const maxDisplaySize = 400
      const scale = Math.min(maxDisplaySize / sourceCanvas.width, maxDisplaySize / sourceCanvas.height)
      
      targetCanvas.width = sourceCanvas.width * scale
      targetCanvas.height = sourceCanvas.height * scale
      
      displayCtx.imageSmoothingEnabled = false
      displayCtx.drawImage(
        sourceCanvas,
        0, 0, sourceCanvas.width, sourceCanvas.height,
        0, 0, targetCanvas.width, targetCanvas.height
      )
    }
  }, [result.canvas])

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-[#1a1b23] text-white flex items-center justify-center">
        <div className="text-center p-8 bg-red-500/20 rounded-lg border border-red-400/50">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">浏览器不支持</h2>
          <p className="text-gray-300">您的浏览器不支持Canvas图像处理功能</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1b23] text-white">
      {/* 增强版标题栏 */}
      <div className="border-b border-gray-700 bg-[#0f1015] p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                增强版像素画转换器
                <span className="text-xs bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-2 py-1 rounded-full">
                  PRO
                </span>
              </h1>
              <p className="text-sm text-gray-400">🚀 实时预览 + 预设风格 + 高级调节 + 智能建议</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              {showAdvanced ? '简单模式' : '高级模式'}
            </button>
            
            <button
              onClick={resetAll}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* 左侧：控制面板 */}
          <div className="xl:col-span-1">
            <div className="bg-[#25262b] rounded-lg border border-gray-600 p-6 sticky top-6">
              
              {/* 🆕 实时预览窗口 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    实时预览
                  </h3>
                  <button
                    onClick={() => togglePreview(!isPreviewEnabled)}
                    className={`
                      px-2 py-1 text-xs rounded transition-colors
                      ${isPreviewEnabled 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-600 text-gray-400'
                      }
                    `}
                  >
                    {isPreviewEnabled ? '已启用' : '已禁用'}
                  </button>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-3 min-h-[150px] flex items-center justify-center">
                  {hasPreview ? (
                    <div className="text-center">
                      <canvas 
                        ref={previewCanvasRef}
                        className="max-w-full max-h-[140px] rounded border border-gray-600"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        预览时间: {(previewResult!.processingTime).toFixed(1)}ms ⚡
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm">生成预览中...</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">选择图片查看预览</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 文件上传 */}
              <div 
                className={`
                  border-2 border-dashed rounded-lg p-6 mb-6 text-center cursor-pointer transition-all
                  ${selectedFile 
                    ? 'border-green-400 bg-green-500/10' 
                    : 'border-gray-500 hover:border-cyan-400 hover:bg-cyan-500/5'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div>
                    <div className="text-4xl mb-2">✅</div>
                    <p className="text-green-400 font-medium">{fileName}</p>
                    {fileDimensions && (
                      <p className="text-sm text-gray-400">
                        {fileDimensions.width} × {fileDimensions.height} 像素
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearFile()
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        移除
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          suggestOptimalParameters()
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        智能建议
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-300 mb-1">选择或拖拽图片</p>
                    <p className="text-xs text-gray-600">支持 PNG、JPEG，最大 10MB</p>
                  </div>
                )}
              </div>

              {/* 🆕 预设风格选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  预设风格
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {styleOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => applyStylePreset(option.value)}
                      className={`
                        w-full p-3 rounded-lg text-left border transition-all
                        ${parameters.style === option.value
                          ? 'border-cyan-400 bg-cyan-500/10'
                          : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                        }
                      `}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 基础参数 */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    尺寸缩放: {parameters.resizeFactor}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={parameters.resizeFactor}
                    onChange={(e) => updateParameters({ resizeFactor: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">插值方法</label>
                  <select
                    value={parameters.interpolation}
                    onChange={(e) => updateParameters({ interpolation: e.target.value as 'nearest' | 'bilinear' })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="nearest">最近邻 (像素化)</option>
                    <option value="bilinear">双线性 (平滑)</option>
                  </select>
                </div>
              </div>

              {/* 🆕 高级参数 */}
              {showAdvanced && (
                <div className="pt-6 border-t border-gray-600 space-y-4 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sliders className="w-4 h-4" />
                    <span className="text-sm font-medium">高级调节</span>
                  </div>

                  {/* 亮度 */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      亮度: {parameters.brightness > 0 ? '+' : ''}{parameters.brightness}
                    </label>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="5"
                      value={parameters.brightness}
                      onChange={(e) => updateParameters({ brightness: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* 对比度 */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Contrast className="w-4 h-4" />
                      对比度: {parameters.contrast.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={parameters.contrast}
                      onChange={(e) => updateParameters({ contrast: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* 饱和度 */}
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <Droplets className="w-4 h-4" />
                      饱和度: {parameters.saturation.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2.0"
                      step="0.1"
                      value={parameters.saturation}
                      onChange={(e) => updateParameters({ saturation: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* 颜色模式 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">颜色模式</label>
                    <select
                      value={parameters.colorMode}
                      onChange={(e) => updateParameters({ colorMode: e.target.value as 'no-dither' | 'ordered-dither' })}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="no-dither">纯色块</option>
                      <option value="ordered-dither">有序抖动</option>
                    </select>
                  </div>

                  {/* 最大颜色数 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      最大颜色数: {parameters.maxColors}
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="64"
                      step="4"
                      value={parameters.maxColors}
                      onChange={(e) => updateParameters({ maxColors: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-3">
                <button
                  onClick={startProcessing}
                  disabled={!selectedFile || isProcessing}
                  className={`
                    w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all
                    ${!selectedFile || isProcessing
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      开始转换
                    </>
                  )}
                </button>

                {hasResult && (
                  <button
                    onClick={downloadResult}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载结果
                  </button>
                )}
              </div>

              {/* 处理进度 */}
              {isProcessing && (
                <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/50">
                  <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    {currentStep}
                  </div>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：图像预览 - 优化布局：原图小框，结果大框 */}
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 items-start">
              
              {/* 原图预览（小框） */}
              <div className="bg-[#25262b] rounded-lg border border-gray-600 p-3">
                <h3 className="text-lg font-medium mb-4">原图预览</h3>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                  {originalImageUrl ? (
                    <div className="text-center">
                      <img 
                        src={originalImageUrl} 
                        alt="原图"
                        className="max-w-full max-h-[200px] object-contain rounded"
                      />
                      {fileDimensions && (
                        <p className="text-sm text-gray-400 mt-2">
                          {fileDimensions.width} × {fileDimensions.height} 像素
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📷</div>
                      <p>选择图片后显示预览</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 像素画结果（大框） */}
              <div className="bg-[#25262b] rounded-lg border border-gray-600 p-4">
                <h3 className="text-lg font-medium mb-4">像素画结果</h3>
                <div className="bg-gray-800 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                  {hasResult ? (
                    <div className="text-center">
                      <canvas 
                        ref={canvasRef}
                        className="max-w-full max-h-[300px] rounded border border-gray-600"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      {result.canvasInfo && (
                        <div className="text-sm text-gray-400 mt-2 space-y-1">
                          <p>{result.canvasInfo.width} × {result.canvasInfo.height} 像素</p>
                          <p>处理时间: {(result.processingTime / 1000).toFixed(1)}s ⚡</p>
                          <p>提取颜色: {result.extractedColors.length} 种</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">🎨</div>
                      <p>转换完成后显示结果</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 颜色板 */}
            {hasResult && result.extractedColors.length > 0 && (
              <div className="mt-4 bg-[#25262b] rounded-lg border border-gray-600 p-4">
                <h3 className="text-lg font-medium mb-4">提取的颜色板</h3>
                <div className="flex flex-wrap gap-2">
                  {result.extractedColors.map((color, index) => (
                    <div 
                      key={index}
                      className="flex flex-col items-center group"
                    >
                      <div 
                        className="w-12 h-12 rounded border border-gray-500 cursor-pointer hover:scale-110 transition-all group-hover:shadow-lg"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => navigator.clipboard?.writeText(color)}
                      />
                      <span className="text-xs text-gray-400 mt-1 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {color}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">💡 点击颜色可复制色值</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 增强版样式 */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #0e1117;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          border-radius: 50%;
          border: 2px solid #0e1117;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}

export default EnhancedPixelArtConverter 
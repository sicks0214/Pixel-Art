import React, { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Image, X, Zap, Package } from 'lucide-react'
import { optimizedUploadService, DetailedProgress, UploadStage } from '../../../services/optimizedUpload'

interface EmbeddedFileUploaderProps {
  onFileSelect: (file: File) => void
  onUploadComplete?: (result: { imageId: string; fileName: string; dimensions: { width: number; height: number } }) => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

/**
 * 嵌入式文件上传器 - 用于预览区域内
 * COLOR02风格：简洁、直观、立即响应
 */
const EmbeddedFileUploader: React.FC<EmbeddedFileUploaderProps> = ({
  onFileSelect,
  onUploadComplete,
  isUploading = false,
  uploadProgress = 0,
  className = ''
}) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  
  // 优化上传状态
  const [detailedProgress, setDetailedProgress] = useState<DetailedProgress | null>(null)
  const [isOptimizedUploading, setIsOptimizedUploading] = useState(false)

  // ============= 文件验证（COLOR02风格） =============
  
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: '只支持PNG、JPG、WEBP格式的图片'
      }
    }

    // 检查文件大小（最大20MB）
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: '文件大小不能超过20MB'
      }
    }

    return { valid: true }
  }

  // ============= 事件处理 =============
  
  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    console.log('[EmbeddedFileUploader] 🚀 开始优化上传:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      type: file.type
    })

    try {
      // 立即调用onFileSelect进行预览
      onFileSelect(file)
      
      // 启动优化上传流程
      setIsOptimizedUploading(true)
      setDetailedProgress({
        stage: 'analyzing',
        stageProgress: 0,
        overallProgress: 0,
        message: '分析文件...'
      })

      const result = await optimizedUploadService.uploadWithOptimizations(
        file,
        {
          enableCompression: true,
          enableChunking: true,
          compressionQuality: 0.85,
          maxDimensions: 1920,
          chunkSize: 1024 * 1024,
          concurrency: 3
        },
        (progress) => {
          setDetailedProgress(progress)
          console.log(`[EmbeddedFileUploader] 进度更新: ${progress.stage} ${progress.overallProgress}%`)
        }
      )

      console.log('[EmbeddedFileUploader] ✅ 优化上传完成:', {
        imageId: result.imageId,
        优化效果: `压缩${result.optimization.compressionRatio.toFixed(1)}x，${result.optimization.chunksUsed}个分片`,
        上传速度: `${(result.performance.averageUploadSpeed / 1024 / 1024).toFixed(2)}MB/s`
      })

      // 通知上传完成
      if (onUploadComplete) {
        onUploadComplete({
          imageId: result.imageId,
          fileName: result.fileName,
          dimensions: result.processedFile.dimensions
        })
      }

    } catch (error) {
      console.error('[EmbeddedFileUploader] ❌ 优化上传失败:', error)
      
      setDetailedProgress({
        stage: 'analyzing',
        stageProgress: 0,
        overallProgress: 0,
        message: `上传失败: ${error instanceof Error ? error.message : '未知错误'}`
      })
      
      // 3秒后清除错误状态
      setTimeout(() => {
        setDetailedProgress(null)
      }, 3000)
      
    } finally {
      setIsOptimizedUploading(false)
    }
  }, [onFileSelect, onUploadComplete])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleClick = () => {
    if (!isUploading && !isOptimizedUploading) {
      fileInputRef.current?.click()
    }
  }

  // ============= 拖拽处理 =============
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(prev => prev - 1)
    if (dragCounter <= 1) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    setDragCounter(0)

    if (isUploading || isOptimizedUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  return (
    <div 
      className={`
        relative h-full w-full flex items-center justify-center
        border-2 border-dashed border-gray-500 rounded-lg
        transition-all duration-200 cursor-pointer
        ${isDragOver && !isUploading && !isOptimizedUploading ? 'border-cyan-400 bg-cyan-900/20' : 'hover:border-gray-400 hover:bg-gray-800/30'}
        ${(isUploading || isOptimizedUploading) ? 'cursor-not-allowed opacity-60' : ''}
        ${className}
      `}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={isUploading}
      />

      {/* 上传区域内容 */}
      <div className="text-center p-8">
        {(isUploading || isOptimizedUploading) ? (
          /* 优化上传状态 */
          <div className="text-gray-300">
            {/* 动态图标和标题 */}
            <div className="mb-4">
              {detailedProgress?.stage === 'analyzing' && (
                <div className="text-blue-400">
                  <Image className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <div className="text-lg font-medium">分析图片...</div>
                </div>
              )}
              
              {detailedProgress?.stage === 'compressing' && (
                <div className="text-yellow-400">
                  <Package className="w-12 h-12 mx-auto mb-2 animate-bounce" />
                  <div className="text-lg font-medium">智能压缩中...</div>
                </div>
              )}
              
              {detailedProgress?.stage === 'uploading' && (
                <div className="text-cyan-400">
                  <Zap className="w-12 h-12 mx-auto mb-2 animate-spin" />
                  <div className="text-lg font-medium">高速上传中...</div>
                </div>
              )}
              
              {detailedProgress?.stage === 'finalizing' && (
                <div className="text-green-400">
                  <Upload className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <div className="text-lg font-medium">完成处理...</div>
                </div>
              )}
              
              {detailedProgress?.stage === 'completed' && (
                <div className="text-green-400">
                  <Image className="w-12 h-12 mx-auto mb-2" />
                  <div className="text-lg font-medium">上传完成！</div>
                </div>
              )}
            </div>

            {/* 进度信息 */}
            {detailedProgress && (
              <div className="space-y-3">
                {/* 阶段进度消息 */}
                <div className="text-sm text-gray-400 mb-2">
                  {detailedProgress.message}
                </div>

                {/* 总体进度条 */}
                <div className="w-64 mx-auto">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>总体进度</span>
                    <span>{Math.round(detailedProgress.overallProgress)}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${detailedProgress.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* 压缩信息 */}
                {detailedProgress.compressionInfo && (
                  <div className="text-xs text-yellow-400 space-y-1">
                    <div>原始: {(detailedProgress.compressionInfo.originalSize / 1024 / 1024).toFixed(2)}MB</div>
                    <div>压缩后: {(detailedProgress.compressionInfo.compressedSize / 1024 / 1024).toFixed(2)}MB</div>
                    <div>压缩比: {detailedProgress.compressionInfo.compressionRatio.toFixed(1)}x</div>
                  </div>
                )}

                {/* 上传速度和分片信息 */}
                {detailedProgress.speed && (
                  <div className="text-xs text-cyan-400 space-y-1">
                    <div>上传速度: {(detailedProgress.speed / 1024 / 1024).toFixed(1)}MB/s</div>
                    {detailedProgress.chunkInfo && (
                      <div>分片进度: {detailedProgress.chunkInfo.currentChunk}/{detailedProgress.chunkInfo.totalChunks}</div>
                    )}
                    {detailedProgress.estimatedTimeRemaining && (
                      <div>预计剩余: {Math.round(detailedProgress.estimatedTimeRemaining / 1000)}秒</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 兼容性：显示基础进度（如果没有详细进度） */}
            {!detailedProgress && isUploading && (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-cyan-400 border-t-transparent mx-auto" />
                <div className="text-lg font-medium">上传中...</div>
                <div className="text-sm text-gray-400">{uploadProgress}%</div>
                
                <div className="w-48 mx-auto">
                  <div className="bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 默认上传状态 */
          <div className="text-gray-300">
            <div className="mb-4">
              {isDragOver ? (
                <div className="text-cyan-400">
                  <Upload className="w-16 h-16 mx-auto mb-2" />
                  <div className="text-xl font-medium">松开以上传</div>
                </div>
              ) : (
                <div>
                  <Image className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                  <div className="text-xl font-medium mb-2">选择文件或拖拽到此处</div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>支持PNG、JPG、WEBP格式</div>
                    <div>最大20MB</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              点击选择文件
            </div>
          </div>
        )}
      </div>

      {/* 拖拽覆盖层 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-cyan-400/10 border-2 border-cyan-400 rounded-lg flex items-center justify-center">
          <div className="text-cyan-400 text-center">
            <Upload className="w-12 h-12 mx-auto mb-2" />
            <div className="text-lg font-medium">松开以上传文件</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmbeddedFileUploader 
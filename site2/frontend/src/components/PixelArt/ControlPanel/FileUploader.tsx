import React, { useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, File, X, CheckCircle } from 'lucide-react'

interface FileUploaderProps {
  selectedFileName?: string
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  isUploading?: boolean
}

/**
 * 文件上传组件 - COLOR02风格纯上传模式
 * 专注于文件选择和验证，立即预览
 */
const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFileName,
  onFileSelect,
  onFileRemove,
  isUploading = false
}) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  // ============= 文件验证（COLOR02简化版） =============
  
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: t('colorcraft.pixelArt.formatNotSupported', '只支持PNG、JPG、WEBP格式的图片')
      }
    }

    // 检查文件大小（最大20MB，COLOR02风格更宽松）
    const maxSize = 20 * 1024 * 1024
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: t('colorcraft.pixelArt.fileTooLarge', '文件大小不能超过20MB')
      }
    }

    return { valid: true }
  }

  // ============= 文件处理（COLOR02风格） =============
  
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file)
    if (validation.valid) {
      console.log('[FileUploader] COLOR02模式文件选择:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        type: file.type
      })
      
      // ⚡ COLOR02模式：立即调用，无预处理
      onFileSelect(file)
      
      console.log('[FileUploader] ✅ 文件选择完成，立即可用')
    } else {
      alert(validation.error)
    }
  }, [onFileSelect])

  // ============= 事件处理 =============
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    if (isUploading) return
    fileInputRef.current?.click()
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

    if (isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      handleFileSelect(file)
    }
  }

  // ============= 渲染助手 =============
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="mb-6">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {/* 拖拽上传区域（COLOR02风格） */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-4 transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-[#06b6d4] bg-[#06b6d4]/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onClick={handleButtonClick}
      >
        <div className="text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#06b6d4] border-t-transparent" />
              <span className="text-sm text-gray-300">上传中...</span>
            </div>
          ) : selectedFileName ? (
            // ✅ 已选择文件状态（COLOR02风格）
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="mx-auto h-8 w-8 text-green-400" />
              <div className="text-sm text-green-300">
                文件已选择，可开始转换
              </div>
            </div>
          ) : (
            // 📤 待选择状态
            <>
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <div className="text-sm text-gray-300">
                <span className="font-medium text-[#06b6d4]">
                  {t('colorcraft.pixelArt.selectFile', '选择文件')}
                </span>
                <span className="ml-1">或拖拽到此处</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                支持PNG、JPG、WEBP格式，最大20MB
              </div>
            </>
          )}
        </div>
      </div>

      {/* 已选择的文件信息（COLOR02风格） */}
      {selectedFileName && (
        <div className="mt-3 bg-[#4a4d5a] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <File className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">
                  {selectedFileName}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  ✅ 已准备，可开始转换
                </div>
              </div>
            </div>
            
            {onFileRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFileRemove()
                }}
                className="ml-2 p-1 rounded hover:bg-[#5a5d6a] text-gray-400 hover:text-gray-200 transition-colors"
                title="移除文件"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader

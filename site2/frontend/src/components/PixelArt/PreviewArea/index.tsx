import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { usePixelArtStore } from '@/store/pixelArtStore'
import ImageCanvas from './ImageCanvas'
import EmbeddedFileUploader from './EmbeddedFileUploader'

/**
 * 预览区域组件 - COLOR02风格分离式预览
 * 基于分离状态精确显示原图和转换结果
 */
const PreviewArea: React.FC = () => {
  const { t } = useTranslation()
  
  // ============= COLOR02风格分离状态访问 =============
  const {
    // 文件状态
    fileState,
    // 上传状态
    uploadState,
    // 转换状态
    conversionState,
    // 结果状态
    resultState,
    
    // 操作方法
    setSelectedFile,
    uploadImage,
    updateFileState,
    setResultState
  } = usePixelArtStore()

  // ============= 文件选择处理（嵌入式上传） =============
  
  const handleFileSelect = useCallback(async (file: File) => {
    console.log('[PreviewArea] 嵌入式文件选择:', file.name)
    
    // 步骤1：立即设置文件，创建预览（COLOR02风格）
    setSelectedFile(file)
    
    // 步骤2：异步上传处理
    try {
      await uploadImage(file)
      console.log('[PreviewArea] ✅ 嵌入式上传完成')
    } catch (error) {
      console.error('[PreviewArea] 嵌入式上传失败:', error)
    }
  }, [setSelectedFile, uploadImage])

  // ============= 图像加载处理（COLOR02风格） =============
  
  const handleOriginalImageLoad = useCallback((dimensions: { width: number; height: number }) => {
    console.log('[PreviewArea] 原图加载完成:', dimensions)
    
    // ⚡ COLOR02模式：立即更新文件状态
    updateFileState({
      fileDimensions: {
        width: dimensions.width,
        height: dimensions.height
      }
    })
  }, [updateFileState])

  const handlePixelArtImageLoad = useCallback((dimensions: { width: number; height: number }) => {
    console.log('[PreviewArea] 像素画结果加载完成:', dimensions)
    
    // ⚡ COLOR02模式：更新结果状态
    setResultState({
      canvasInfo: {
        width: dimensions.width,
        height: dimensions.height,
        coloredPixels: resultState.canvasInfo.coloredPixels // 保持现有值
      }
    })
  }, [setResultState, resultState.canvasInfo.coloredPixels])

  // ============= 下载处理（COLOR02风格） =============
  
  const handlePixelArtDownload = useCallback(() => {
    if (resultState.pixelArtImage) {
      try {
        const link = document.createElement('a')
        link.download = `pixel-art-${fileState.fileName || 'image'}-${Date.now()}.png`
        link.href = resultState.pixelArtImage
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        console.log('[PreviewArea] 像素画下载开始')
      } catch (err) {
        console.error('[PreviewArea] 下载像素画失败:', err)
      }
    }
  }, [resultState.pixelArtImage, fileState.fileName])

  // ============= 渲染助手（状态感知） =============
  
  const getOriginalImageTitle = () => {
    if (fileState.fileName) {
      const dimensions = fileState.fileDimensions
      const dimensionText = dimensions ? ` (${dimensions.width}×${dimensions.height})` : ''
      return `原图 - ${fileState.fileName}${dimensionText}`
    }
    return t('colorcraft.pixelArt.selectOrDragImage', '选择图片开始转换')
  }

  const getPixelArtTitle = () => {
    if (resultState.pixelArtImage && resultState.canvasInfo.width > 0) {
      return `像素画结果 (${resultState.canvasInfo.width}×${resultState.canvasInfo.height})`
    }
    return t('colorcraft.pixelArt.pixelArtResult', '像素画结果')
  }

  const getPixelArtPlaceholder = () => {
    if (conversionState.isConverting) {
      const stepText = conversionState.currentStep === 'preparing' ? '准备中' :
                      conversionState.currentStep === 'processing' ? '处理中' :
                      conversionState.currentStep === 'finishing' ? '完成中' :
                      '转换中'
      return {
        icon: '🎨',
        text: `${stepText} ${conversionState.progress}%`
      }
    }
    
    if (uploadState.isUploading) {
      return {
        icon: '📤',
        text: `上传中 ${uploadState.progress}%`
      }
    }
    
    if (!fileState.selectedFile) {
      return {
        icon: '🎨',
        text: t('colorcraft.pixelArt.selectImageFirst', '请先选择图片文件')
      }
    }
    
    return {
      icon: '🎨',
      text: t('colorcraft.pixelArt.convertAfterSelect', '点击转换按钮开始处理')
    }
  }

  return (
    <div className="flex gap-6 h-full items-start">
      {/* 原图预览（小框 - COLOR02风格，嵌入上传功能） */}
      <div className="w-52 flex-shrink-0 bg-[#2a2d3a] rounded-lg p-4 flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4">
          {getOriginalImageTitle()}
        </h3>
        
        {/* 条件渲染：上传框或图片预览 */}
        {!fileState.selectedFile ? (
          /* 嵌入式上传框 */
          <EmbeddedFileUploader
            onFileSelect={handleFileSelect}
            onUploadComplete={(result) => {
              console.log('[PreviewArea] 优化上传完成:', result)
              // 更新文件状态
              updateFileState({
                imageId: result.imageId,
                fileDimensions: result.dimensions
              })
            }}
            isUploading={uploadState.isUploading}
            uploadProgress={uploadState.progress}
            className="flex-1"
          />
        ) : (
          /* 原图预览 */
          <ImageCanvas
            imageUrl={fileState.originalImageUrl}
            title=""
            placeholder={{
              icon: '📷',
              text: t('colorcraft.pixelArt.noImageSelected', '请选择图片文件')
            }}
            onImageLoad={handleOriginalImageLoad}
            enableControls={false}
          />
        )}
      </div>

      {/* 像素画结果预览（大框 - COLOR02风格） */}
      <div className="flex-1 bg-[#2a2d3a] rounded-lg p-4 flex flex-col">
        <h3 className="text-lg font-medium text-white mb-4">
          {getPixelArtTitle()}
        </h3>
        
        <ImageCanvas
          imageUrl={resultState.pixelArtImage}
          title=""
          placeholder={getPixelArtPlaceholder()}
          isProcessing={conversionState.isConverting || uploadState.isUploading}
          enableControls={true}
          onImageLoad={handlePixelArtImageLoad}
          onDownload={handlePixelArtDownload}
        />
      </div>
    </div>
  )
}

export default PreviewArea

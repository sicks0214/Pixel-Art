import React from 'react'
import { useTranslation } from 'react-i18next'

interface CanvasInfo {
  width: number
  height: number
  coloredPixels: number
}

interface ImageStatsProps {
  canvasInfo: CanvasInfo
}

/**
 * 图像统计信息组件
 * 显示画布宽度、高度、彩色像素数
 */
const ImageStats: React.FC<ImageStatsProps> = ({ canvasInfo }) => {
  const { t } = useTranslation()

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          {t('colorcraft.pixelArt.canvasWidth', '画布宽度')}：
        </span>
        <span className="text-white text-sm font-medium">
          {canvasInfo.width > 0 ? `${formatNumber(canvasInfo.width)}像素` : '--像素'}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          {t('colorcraft.pixelArt.canvasHeight', '画布高度')}：
        </span>
        <span className="text-white text-sm font-medium">
          {canvasInfo.height > 0 ? `${formatNumber(canvasInfo.height)}像素` : '--像素'}
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-gray-300 text-sm">
          {t('colorcraft.pixelArt.coloredPixels', '彩色像素')}：
        </span>
        <span className="text-white text-sm font-medium">
          {canvasInfo.coloredPixels > 0 ? formatNumber(canvasInfo.coloredPixels) : '--'}
        </span>
      </div>
    </div>
  )
}

export default ImageStats

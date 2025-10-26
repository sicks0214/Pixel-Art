import React from 'react'
import { useTranslation } from 'react-i18next'
import { usePixelArtStore } from '@/store/pixelArtStore'
import ImageStats from './ImageStats'
import ColorPalette from './ColorPalette'

/**
 * 信息面板组件
 * 显示画布信息和提取的颜色调色板
 */
const InfoPanel: React.FC = () => {
  const { t } = useTranslation()
  
  // 状态管理 (COLOR02分离式架构)
  const {
    resultState
  } = usePixelArtStore()

  return (
    <div className="flex gap-6 h-full">
      {/* 左侧信息面板 */}
      <div className="w-80 bg-[#2a2d3a] rounded-lg p-4 flex-shrink-0">
        <h3 className="text-lg font-medium text-white mb-4">
          {t('colorcraft.pixelArt.info', '信息')}
        </h3>
        
        <ImageStats canvasInfo={resultState.canvasInfo} />
        
        {/* 处理时间显示（如果有的话） */}
        {resultState.pixelArtImage && (
          <div className="mt-4 pt-4 border-t border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">转换状态：</span>
              <span className="text-green-400 text-sm font-medium">✓ 完成</span>
            </div>
          </div>
        )}
      </div>

      {/* 右侧颜色面板 */}
      <div className="flex-1 bg-[#2a2d3a] rounded-lg p-4 min-w-0">
        <ColorPalette colors={resultState.extractedColors} />
      </div>
    </div>
  )
}

export default InfoPanel

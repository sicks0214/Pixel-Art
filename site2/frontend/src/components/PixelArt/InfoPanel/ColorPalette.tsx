import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ColorPaletteProps {
  colors: string[]
}

/**
 * 颜色调色板展示组件
 * 按照截图样式显示提取的颜色方块
 */
const ColorPalette: React.FC<ColorPaletteProps> = ({ colors }) => {
  const { t } = useTranslation()
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  // 复制颜色值到剪贴板
  const copyToClipboard = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color)
      setCopiedColor(color)
      setTimeout(() => setCopiedColor(null), 2000)
    } catch (err) {
      console.error('Failed to copy color:', err)
    }
  }

  if (colors.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        转换后的颜色调色板将在此显示
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-300">
          使用的颜色
        </h4>
        <span className="text-xs text-gray-400">
          共{colors.length}种颜色
        </span>
      </div>
      
      {/* 颜色方块网格 */}
      <div className="grid grid-cols-12 gap-2 max-h-32 overflow-y-auto">
        {colors.map((color, index) => (
          <div
            key={`${color}-${index}`}
            className="relative group"
          >
            <button
              onClick={() => copyToClipboard(color)}
              className="w-full aspect-square rounded border border-gray-600 hover:border-gray-400 
                         transition-all duration-200 hover:scale-110 cursor-pointer
                         flex items-center justify-center text-xs font-mono"
              style={{ backgroundColor: color }}
              title={`${color} - 点击复制`}
            >
              {/* 对于深色，显示白色文字；对于浅色，显示黑色文字 */}
              <span
                className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold
                           ${isDarkColor(color) ? 'text-white' : 'text-black'}`}
                style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
              >
                {color.substring(1, 4).toUpperCase()}
              </span>
            </button>
            
            {/* 复制成功提示 */}
            {copiedColor === color && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                             bg-[#10b981] text-white text-xs px-2 py-1 rounded
                             whitespace-nowrap z-10">
                已复制!
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 使用说明 */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        点击颜色方块可复制颜色值
      </div>
    </div>
  )
}

// 判断颜色是否为深色的辅助函数
function isDarkColor(hexColor: string): boolean {
  // 去掉#号
  const hex = hexColor.replace('#', '')
  
  // 转换为RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // 计算亮度 (使用相对亮度公式)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // 亮度小于128认为是深色
  return brightness < 128
}

export default ColorPalette

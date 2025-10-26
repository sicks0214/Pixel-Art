import React, { useState, useEffect } from 'react'
import { X, Keyboard, Command } from 'lucide-react'
import { generateShortcutHelpData, type ShortcutHelpData } from '@/hooks/useKeyboardShortcuts'

interface ShortcutHelpProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 快捷键帮助面板组件
 * 显示所有可用的键盘快捷键
 */
const ShortcutHelp: React.FC<ShortcutHelpProps> = ({
  isOpen,
  onClose
}) => {
  const [helpData, setHelpData] = useState<ShortcutHelpData[]>([])

  useEffect(() => {
    if (isOpen) {
      setHelpData(generateShortcutHelpData())
    }
  }, [isOpen])

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 帮助面板 */}
      <div className="relative bg-[#2a2d3a] rounded-xl border border-gray-600 shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#06b6d4]/10 rounded-lg">
              <Keyboard className="w-5 h-5 text-[#06b6d4]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">键盘快捷键</h2>
              <p className="text-sm text-gray-400">提高您的工作效率</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="space-y-8">
            {helpData.map((category, index) => (
              <div key={index}>
                {/* 分类标题 */}
                <h3 className="text-sm font-semibold text-[#06b6d4] mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#06b6d4] rounded-full" />
                  {category.category}
                </h3>

                {/* 快捷键列表 */}
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, shortcutIndex) => (
                    <div 
                      key={shortcutIndex}
                      className="flex items-center justify-between p-3 bg-[#1a1b23] rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      {/* 快捷键组合 */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {shortcut.keys.split(' + ').map((key, keyIndex) => (
                            <React.Fragment key={keyIndex}>
                              {keyIndex > 0 && (
                                <span className="text-gray-500 text-xs">+</span>
                              )}
                              <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono text-gray-300 shadow-sm">
                                {key === 'Ctrl' && navigator.platform.includes('Mac') ? 
                                  <Command className="w-3 h-3 inline" /> : 
                                  key
                                }
                              </kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* 功能描述 */}
                      <div className="text-sm text-gray-300">
                        {shortcut.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 额外提示 */}
          <div className="mt-8 p-4 bg-[#06b6d4]/10 border border-[#06b6d4]/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-[#06b6d4]/20 rounded">
                <Command className="w-4 h-4 text-[#06b6d4]" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white mb-1">快捷键提示</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• 在输入框获得焦点时，某些快捷键可能不可用</li>
                  <li>• Mac 用户：Ctrl 键对应 ⌘ (Command) 键</li>
                  <li>• 按下 F1 可随时打开此帮助面板</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-600 bg-[#1a1b23]">
          <div className="text-xs text-gray-400">
            按 ESC 键或点击外部区域关闭
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#06b6d4] hover:bg-[#0891b2] text-white text-sm font-medium rounded-lg transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShortcutHelp

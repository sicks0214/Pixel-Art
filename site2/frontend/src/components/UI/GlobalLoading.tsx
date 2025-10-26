/**
 * 全局加载状态组件
 */

import React from 'react'

export interface GlobalLoadingProps {
  isVisible: boolean
  message?: string
  progress?: number
  type?: 'spinner' | 'pulse' | 'dots'
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({
  isVisible,
  message = '正在处理...',
  progress,
  type = 'spinner'
}) => {
  if (!isVisible) return null

  const renderLoader = () => {
    switch (type) {
      case 'pulse':
        return (
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )
      
      default: // spinner
        return (
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        {/* 加载动画 */}
        <div className="flex flex-col items-center">
          {renderLoader()}
          
          {/* 消息 */}
          <p className="mt-4 text-gray-700 text-center font-medium">
            {message}
          </p>
          
          {/* 进度条 */}
          {typeof progress === 'number' && (
            <div className="w-full mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
          
          {/* AI生成特殊提示 */}
          {message.includes('AI') && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>🤖 AI正在为您生成独特的调色板</p>
              <p>这可能需要2-3分钟，请耐心等待</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalLoading

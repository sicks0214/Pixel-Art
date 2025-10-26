import React from 'react'
import { AlertCircle, RefreshCcw, X } from 'lucide-react'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  retryLabel?: string
  showDismiss?: boolean
  compact?: boolean
}

/**
 * 错误显示组件
 * 支持重试和关闭功能
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryLabel = '重试',
  showDismiss = true,
  compact = false
}) => {
  if (!error) return null

  const isNetworkError = error.includes('网络') || error.includes('超时') || error.includes('连接')
  const isValidationError = error.includes('格式') || error.includes('大小') || error.includes('选择')

  return (
    <div className={`
      bg-red-500/10 border border-red-500/30 rounded-lg p-4 
      ${compact ? 'text-sm' : ''}
    `}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`flex-shrink-0 text-red-400 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
        
        <div className="flex-1 min-w-0">
          <div className={`text-red-300 font-medium ${compact ? 'text-sm' : ''}`}>
            {isNetworkError && '网络错误'}
            {isValidationError && '输入错误'}
            {!isNetworkError && !isValidationError && '处理失败'}
          </div>
          
          <div className={`text-red-300/80 mt-1 break-words ${compact ? 'text-xs' : 'text-sm'}`}>
            {error}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`
                  inline-flex items-center gap-1 px-3 py-1.5 
                  bg-red-500 hover:bg-red-600 text-white rounded 
                  font-medium transition-colors
                  ${compact ? 'text-xs' : 'text-sm'}
                `}
              >
                <RefreshCcw className="w-3 h-3" />
                {retryLabel}
              </button>
            )}
            
            {showDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className={`
                  inline-flex items-center px-2 py-1.5 
                  text-red-300 hover:text-red-200 
                  hover:bg-red-500/20 rounded transition-colors
                  ${compact ? 'text-xs' : 'text-sm'}
                `}
              >
                关闭
              </button>
            )}
          </div>

          {/* 错误类型建议 */}
          {isNetworkError && (
            <div className="mt-2 text-xs text-red-300/60">
              💡 请检查网络连接或稍后重试
            </div>
          )}
          
          {isValidationError && (
            <div className="mt-2 text-xs text-red-300/60">
              💡 请检查文件格式和大小是否符合要求
            </div>
          )}
        </div>

        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorDisplay

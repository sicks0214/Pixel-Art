import React from 'react'
import { CheckCircle, AlertCircle, Clock, Upload, Download, Loader2 } from 'lucide-react'

type StatusType = 'idle' | 'uploading' | 'processing' | 'success' | 'error' | 'downloading'

interface StatusIndicatorProps {
  status: StatusType
  progress?: number
  message?: string
  showIcon?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 状态指示器组件
 * 显示各种处理状态的可视化反馈
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  progress = 0,
  message,
  showIcon = true,
  showProgress = true,
  size = 'md',
  className = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
        return {
          icon: Clock,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          defaultMessage: '等待中'
        }
      case 'uploading':
        return {
          icon: Upload,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/20',
          defaultMessage: '上传中...'
        }
      case 'processing':
        return {
          icon: Loader2,
          color: 'text-purple-400',
          bgColor: 'bg-purple-400/10',
          borderColor: 'border-purple-400/20',
          defaultMessage: '处理中...',
          animated: true
        }
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/20',
          defaultMessage: '完成'
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          defaultMessage: '出错了'
        }
      case 'downloading':
        return {
          icon: Download,
          color: 'text-cyan-400',
          bgColor: 'bg-cyan-400/10',
          borderColor: 'border-cyan-400/20',
          defaultMessage: '下载中...'
        }
      default:
        return {
          icon: Clock,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          defaultMessage: '未知状态'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      progress: 'h-1'
    },
    md: {
      container: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      progress: 'h-2'
    },
    lg: {
      container: 'px-4 py-3 text-base',
      icon: 'w-5 h-5',
      progress: 'h-3'
    }
  }

  const currentSize = sizeClasses[size]
  const displayMessage = message || config.defaultMessage
  const showProgressBar = showProgress && (status === 'uploading' || status === 'processing' || status === 'downloading') && progress > 0

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-lg border
      ${config.bgColor} ${config.borderColor} ${currentSize.container}
      transition-all duration-200
      ${className}
    `}>
      {/* 状态图标 */}
      {showIcon && (
        <Icon 
          className={`
            ${config.color} ${currentSize.icon}
            ${config.animated ? 'animate-spin' : ''}
            transition-colors duration-200
          `}
        />
      )}

      {/* 状态消息 */}
      <div className="flex flex-col">
        <span className={`font-medium ${config.color}`}>
          {displayMessage}
        </span>
        
        {/* 进度条 */}
        {showProgressBar && (
          <div className="mt-1">
            <div className={`
              w-full bg-gray-600 rounded-full overflow-hidden
              ${currentSize.progress}
            `}>
              <div
                className={`
                  ${currentSize.progress} transition-all duration-300 ease-out
                  bg-gradient-to-r from-current to-current opacity-60
                  ${config.color}
                `}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            
            {/* 进度百分比 */}
            <div className="text-xs opacity-70 mt-0.5">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>

      {/* 成功状态的额外效果 */}
      {status === 'success' && (
        <div className="absolute inset-0 rounded-lg animate-ping opacity-25 bg-green-400" />
      )}

      {/* 错误状态的额外效果 */}
      {status === 'error' && (
        <div className="absolute inset-0 rounded-lg animate-pulse opacity-25 bg-red-400" />
      )}
    </div>
  )
}

// 预设的状态指示器组合
export const UploadStatus: React.FC<{ progress: number }> = ({ progress }) => (
  <StatusIndicator 
    status="uploading" 
    progress={progress} 
    message={`上传中 ${Math.round(progress)}%`} 
  />
)

export const ProcessingStatus: React.FC<{ progress: number }> = ({ progress }) => (
  <StatusIndicator 
    status="processing" 
    progress={progress} 
    message={`处理中 ${Math.round(progress)}%`} 
  />
)

export const SuccessStatus: React.FC<{ message?: string }> = ({ message }) => (
  <StatusIndicator 
    status="success" 
    message={message || '转换完成'}
    showProgress={false}
  />
)

export const ErrorStatus: React.FC<{ message?: string }> = ({ message }) => (
  <StatusIndicator 
    status="error" 
    message={message || '处理失败'}
    showProgress={false}
  />
)

export default StatusIndicator

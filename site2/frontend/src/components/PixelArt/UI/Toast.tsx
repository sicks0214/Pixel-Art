import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, X, RefreshCcw } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
  actionLabel?: string
  onAction?: () => void
}

/**
 * Toast通知组件
 * 支持成功、错误、信息、警告类型
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
  actionLabel,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  const handleAction = () => {
    if (onAction) {
      onAction()
      handleClose()
    }
  }

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info':
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-300'
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-300'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300'
    }
  }

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isExiting 
          ? 'translate-x-full opacity-0' 
          : 'translate-x-0 opacity-100'
        }
      `}
    >
      <div
        className={`
          p-4 rounded-lg border backdrop-blur-sm shadow-lg
          ${getColorClasses()}
        `}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {message}
            </p>
            
            {actionLabel && onAction && (
              <button
                onClick={handleAction}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium underline hover:no-underline transition-colors"
              >
                {type === 'error' && <RefreshCcw className="w-3 h-3" />}
                {actionLabel}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast容器组件
interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    type: ToastType
    actionLabel?: string
    onAction?: () => void
  }>
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          onClose={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

export default Toast

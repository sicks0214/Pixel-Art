/**
 * Toast通知组件
 */

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id?: string
  type: ToastType
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  autoClose?: boolean
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  autoClose = true
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  // 图标映射
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }

  // 样式映射
  const styleMap = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700'
    }
  }

  const Icon = iconMap[type]
  const styles = styleMap[type]

  // 自动关闭逻辑
  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // 动画持续时间
  }

  if (!isVisible) return null

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={`
        p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${styles.bg}
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${styles.icon}`} />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-semibold ${styles.title} mb-1`}>
                {title}
              </h3>
            )}
            <p className={`text-sm ${styles.message}`}>
              {message}
            </p>
          </div>

          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleClose}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                hover:bg-black hover:bg-opacity-10 transition-colors
                ${styles.icon}
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Toast容器组件
export interface ToastContainerProps {
  toasts: ToastProps[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          {...toast}
          onClose={() => onRemove(toast.id || String(index))}
        />
      ))}
    </div>
  )
}

// Toast Hook
let toastId = 0
const toastCallbacks: ((toasts: ToastProps[]) => void)[] = []
let currentToasts: ToastProps[] = []

const notifyCallbacks = () => {
  toastCallbacks.forEach(callback => callback([...currentToasts]))
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    toastCallbacks.push(setToasts)
    setToasts([...currentToasts])

    return () => {
      const index = toastCallbacks.indexOf(setToasts)
      if (index > -1) {
        toastCallbacks.splice(index, 1)
      }
    }
  }, [])

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const newToast = { ...toast, id: String(++toastId) }
    currentToasts.push(newToast)
    notifyCallbacks()
  }

  const removeToast = (id: string) => {
    currentToasts = currentToasts.filter(toast => toast.id !== id)
    notifyCallbacks()
  }

  const clearToasts = () => {
    currentToasts = []
    notifyCallbacks()
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    // 便捷方法
    success: (message: string, title?: string) => addToast({ type: 'success', message, title }),
    error: (message: string, title?: string) => addToast({ type: 'error', message, title }),
    warning: (message: string, title?: string) => addToast({ type: 'warning', message, title }),
    info: (message: string, title?: string) => addToast({ type: 'info', message, title })
  }
}

export default Toast

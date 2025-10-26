import { useState, useCallback } from 'react'
import { ToastType } from '@/components/PixelArt/UI/Toast'

interface ToastItem {
  id: string
  message: string
  type: ToastType
  actionLabel?: string
  onAction?: () => void
}

/**
 * Toast管理Hook
 * 提供显示和管理Toast通知的功能
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // 添加Toast
  const showToast = useCallback((
    message: string, 
    type: ToastType = 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastItem = {
      id,
      message,
      type,
      actionLabel,
      onAction
    }

    setToasts(prev => [...prev, newToast])
    
    // 自动移除 (Toast组件会处理，这里作为备用)
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 6000)

    return id
  }, [])

  // 移除Toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // 清除所有Toast
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // 便捷方法
  const showSuccess = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    return showToast(message, 'success', actionLabel, onAction)
  }, [showToast])

  const showError = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    return showToast(message, 'error', actionLabel, onAction)
  }, [showToast])

  const showWarning = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    return showToast(message, 'warning', actionLabel, onAction)
  }, [showToast])

  const showInfo = useCallback((message: string, actionLabel?: string, onAction?: () => void) => {
    return showToast(message, 'info', actionLabel, onAction)
  }, [showToast])

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissToast,
    clearToasts
  }
}

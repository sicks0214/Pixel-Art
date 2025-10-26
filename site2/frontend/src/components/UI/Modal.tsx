/**
 * 通用模态框组件
 */

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

export interface ModalProps {
  // 基本属性
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  
  // 样式配置
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centered?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscKey?: boolean
  
  // 头部配置
  showCloseButton?: boolean
  headerActions?: React.ReactNode
  
  // 底部配置
  footer?: React.ReactNode
  showFooter?: boolean
  
  // 样式类
  className?: string
  overlayClassName?: string
  contentClassName?: string
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  centered = true,
  closeOnOverlayClick = true,
  closeOnEscKey = true,
  showCloseButton = true,
  headerActions,
  footer,
  showFooter = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
}) => {
  // 尺寸样式
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  // ESC键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEscKey) return

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [isOpen, closeOnEscKey, onClose])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 处理覆盖层点击
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景覆盖层 */}
      <div
        className={`
          fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300
          ${overlayClassName}
        `}
        onClick={handleOverlayClick}
      />

      {/* 模态框容器 */}
      <div
        className={`
          fixed inset-0 z-10 overflow-y-auto
          ${centered ? 'flex items-center justify-center p-4' : 'p-4 pt-16'}
        `}
      >
        <div
          className={`
            relative bg-white rounded-lg shadow-xl transform transition-all duration-300
            ${sizeClasses[size]} w-full
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          {(title || showCloseButton || headerActions) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                )}
                {headerActions}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="关闭"
                />
              )}
            </div>
          )}

          {/* 内容区域 */}
          <div className={`p-6 ${contentClassName}`}>
            {children}
          </div>

          {/* 底部 */}
          {showFooter && footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal 
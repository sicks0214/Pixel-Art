import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto'

interface TooltipProps {
  content: ReactNode
  position?: TooltipPosition
  delay?: number
  disabled?: boolean
  className?: string
  children: ReactNode
  maxWidth?: number
}

/**
 * 工具提示组件
 * 支持多种位置、延迟显示、自动定位
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'auto',
  delay = 500,
  disabled = false,
  className = '',
  children,
  maxWidth = 200
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>(position)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 计算最佳位置
  const calculatePosition = (targetRect: DOMRect): { position: TooltipPosition; style: React.CSSProperties } => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const tooltipElement = tooltipRef.current
    
    if (!tooltipElement) {
      return { position: 'top', style: {} }
    }

    const tooltipRect = tooltipElement.getBoundingClientRect()
    const spacing = 8 // 间距

    let finalPosition = position
    let style: React.CSSProperties = {}

    // 如果是自动定位，计算最佳位置
    if (position === 'auto') {
      const spaceTop = targetRect.top
      const spaceBottom = viewportHeight - targetRect.bottom
      const spaceLeft = targetRect.left
      const spaceRight = viewportWidth - targetRect.right

      // 优先显示在上方，其次下方
      if (spaceTop >= tooltipRect.height + spacing) {
        finalPosition = 'top'
      } else if (spaceBottom >= tooltipRect.height + spacing) {
        finalPosition = 'bottom'
      } else if (spaceRight >= tooltipRect.width + spacing) {
        finalPosition = 'right'
      } else if (spaceLeft >= tooltipRect.width + spacing) {
        finalPosition = 'left'
      } else {
        finalPosition = 'top' // 默认位置
      }
    } else {
      finalPosition = position
    }

    // 计算具体位置
    switch (finalPosition) {
      case 'top':
        style = {
          left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          top: targetRect.top - tooltipRect.height - spacing
        }
        break
      case 'bottom':
        style = {
          left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          top: targetRect.bottom + spacing
        }
        break
      case 'left':
        style = {
          left: targetRect.left - tooltipRect.width - spacing,
          top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        }
        break
      case 'right':
        style = {
          left: targetRect.right + spacing,
          top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        }
        break
    }

    // 确保工具提示在视口内
    style.left = Math.max(8, Math.min(style.left!, viewportWidth - tooltipRect.width - 8))
    style.top = Math.max(8, Math.min(style.top!, viewportHeight - tooltipRect.height - 8))

    return { position: finalPosition, style }
  }

  // 显示工具提示
  const showTooltip = () => {
    if (disabled || !content) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      
      // 下一帧计算位置
      requestAnimationFrame(() => {
        const triggerElement = triggerRef.current
        if (triggerElement) {
          const rect = triggerElement.getBoundingClientRect()
          const { position: calcPosition, style } = calculatePosition(rect)
          setTooltipPosition(calcPosition)
          setTooltipStyle(style)
        }
      })
    }, delay)
  }

  // 隐藏工具提示
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // 渲染工具提示内容
  const renderTooltip = () => {
    if (!isVisible || !content) return null

    const arrowClass = {
      top: 'border-t-0 border-b-4 border-l-4 border-r-4 border-l-transparent border-r-transparent border-b-gray-800 top-full left-1/2 transform -translate-x-1/2',
      bottom: 'border-b-0 border-t-4 border-l-4 border-r-4 border-l-transparent border-r-transparent border-t-gray-800 bottom-full left-1/2 transform -translate-x-1/2',
      left: 'border-l-0 border-r-4 border-t-4 border-b-4 border-t-transparent border-b-transparent border-r-gray-800 left-full top-1/2 transform -translate-y-1/2',
      right: 'border-r-0 border-l-4 border-t-4 border-b-4 border-t-transparent border-b-transparent border-l-gray-800 right-full top-1/2 transform -translate-y-1/2'
    }

    return createPortal(
      <div
        ref={tooltipRef}
        className={`
          fixed z-[9999] pointer-events-none
          bg-gray-800 text-white text-xs rounded px-2 py-1.5
          shadow-lg border border-gray-700
          animate-in fade-in-0 zoom-in-95 duration-200
          ${className}
        `}
        style={{
          ...tooltipStyle,
          maxWidth: `${maxWidth}px`
        }}
      >
        {content}
        
        {/* 箭头 */}
        <div
          className={`absolute w-0 h-0 ${arrowClass[tooltipPosition]}`}
        />
      </div>,
      document.body
    )
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {renderTooltip()}
    </>
  )
}

export default Tooltip

/**
 * 通用加载组件
 */

import React from 'react'

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars'

export interface LoadingProps {
  size?: LoadingSize
  variant?: LoadingVariant
  color?: string
  text?: string
  overlay?: boolean
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  color = 'text-purple-600',
  text,
  overlay = false,
  className = '',
}) => {
  // 尺寸样式
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  // 文字尺寸
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  // 渲染旋转加载器
  const renderSpinner = () => (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${color}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  // 渲染点状加载器
  const renderDots = () => {
    const dotSize = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
    }

    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`
              ${dotSize[size]} 
              ${color.replace('text-', 'bg-')} 
              rounded-full animate-pulse
            `}
            style={{
              animationDelay: `${index * 0.3}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    )
  }

  // 渲染脉冲加载器
  const renderPulse = () => (
    <div
      className={`
        ${sizeClasses[size]} 
        ${color.replace('text-', 'bg-')} 
        rounded-full animate-pulse
      `}
    />
  )

  // 渲染条状加载器
  const renderBars = () => {
    const barWidth = {
      xs: 'w-0.5',
      sm: 'w-0.5',
      md: 'w-1',
      lg: 'w-1.5',
      xl: 'w-2',
    }

    const barHeight = {
      xs: 'h-4',
      sm: 'h-6',
      md: 'h-8',
      lg: 'h-12',
      xl: 'h-16',
    }

    return (
      <div className="flex items-end space-x-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`
              ${barWidth[size]} 
              ${barHeight[size]} 
              ${color.replace('text-', 'bg-')} 
              animate-pulse
            `}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationDuration: '1.2s',
              transform: `scaleY(${0.4 + Math.random() * 0.6})`,
            }}
          />
        ))}
      </div>
    )
  }

  // 选择加载器变体
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      case 'bars':
        return renderBars()
      case 'spinner':
      default:
        return renderSpinner()
    }
  }

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {renderLoader()}
      {text && (
        <p className={`${textSizeClasses[size]} ${color} text-center`}>
          {text}
        </p>
      )}
    </div>
  )

  // 如果需要覆盖层
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          {content}
        </div>
      </div>
    )
  }

  return content
}

export default Loading 
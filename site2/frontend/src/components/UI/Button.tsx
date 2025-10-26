/**
 * 通用按钮组件
 */

import React from 'react'
import { LucideIcon } from 'lucide-react'

// 按钮变体
export type ButtonVariant = 
  | 'primary'     // 主要按钮（紫色）
  | 'secondary'   // 次要按钮（灰色）
  | 'success'     // 成功按钮（绿色）
  | 'danger'      // 危险按钮（红色）
  | 'warning'     // 警告按钮（黄色）
  | 'info'        // 信息按钮（蓝色）
  | 'outline'     // 边框按钮
  | 'ghost'       // 幽灵按钮
  | 'link'        // 链接按钮

// 按钮尺寸
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  children?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  // 基础样式
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'active:scale-95',
    'select-none',
  ]

  // 变体样式
  const variantClasses = {
    primary: [
      'bg-purple-600',
      'text-white',
      'hover:bg-purple-700',
      'focus:ring-purple-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    secondary: [
      'bg-gray-600',
      'text-white',
      'hover:bg-gray-700',
      'focus:ring-gray-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    success: [
      'bg-green-600',
      'text-white',
      'hover:bg-green-700',
      'focus:ring-green-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'focus:ring-red-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    warning: [
      'bg-yellow-600',
      'text-white',
      'hover:bg-yellow-700',
      'focus:ring-yellow-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    info: [
      'bg-blue-600',
      'text-white',
      'hover:bg-blue-700',
      'focus:ring-blue-500',
      'shadow-md',
      'hover:shadow-lg',
    ],
    outline: [
      'border-2',
      'border-purple-600',
      'text-purple-600',
      'bg-transparent',
      'hover:bg-purple-600',
      'hover:text-white',
      'focus:ring-purple-500',
    ],
    ghost: [
      'text-gray-700',
      'bg-transparent',
      'hover:bg-gray-100',
      'focus:ring-gray-500',
    ],
    link: [
      'text-purple-600',
      'bg-transparent',
      'hover:text-purple-700',
      'hover:underline',
      'focus:ring-purple-500',
      'shadow-none',
    ],
  }

  // 尺寸样式
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs', 'min-h-[24px]'],
    sm: ['px-3', 'py-1.5', 'text-sm', 'min-h-[32px]'],
    md: ['px-4', 'py-2', 'text-sm', 'min-h-[40px]'],
    lg: ['px-6', 'py-3', 'text-base', 'min-h-[48px]'],
    xl: ['px-8', 'py-4', 'text-lg', 'min-h-[56px]'],
  }

  // 只有图标时的特殊尺寸（正方形）
  const iconOnlySizeClasses = {
    xs: ['p-1', 'w-6', 'h-6'],
    sm: ['p-1.5', 'w-8', 'h-8'],
    md: ['p-2', 'w-10', 'h-10'],
    lg: ['p-3', 'w-12', 'h-12'],
    xl: ['p-4', 'w-14', 'h-14'],
  }

  // 图标尺寸
  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  }

  // 禁用状态样式
  const disabledClasses = [
    'opacity-50',
    'cursor-not-allowed',
    'pointer-events-none',
  ]

  // 加载状态样式
  const loadingClasses = [
    'opacity-75',
    'cursor-wait',
  ]

  // 全宽样式
  const fullWidthClasses = ['w-full']

  // 判断是否只有图标
  const isIconOnly = (Icon || loading) && !children

  // 组合所有样式
  const finalClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...(isIconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]),
    ...(disabled || loading ? disabledClasses : []),
    ...(loading ? loadingClasses : []),
    ...(fullWidth ? fullWidthClasses : []),
    className,
  ].join(' ')

  // 图标大小
  const iconSize = iconSizes[size]

  // 渲染加载图标
  const renderLoadingIcon = () => (
    <svg
      className="animate-spin"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        strokeOpacity="0.75"
      />
    </svg>
  )

  // 渲染图标
  const renderIcon = () => {
    if (loading) {
      return renderLoadingIcon()
    }
    
    if (Icon) {
      return <Icon size={iconSize} />
    }
    
    return null
  }

  // 图标间距
  const iconSpacing = {
    xs: 'gap-1',
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2',
    xl: 'gap-2.5',
  }

  return (
    <button
      className={`${finalClasses} ${(Icon || loading) && children ? iconSpacing[size] : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* 左侧图标或单独图标 */}
      {(Icon || loading) && (iconPosition === 'left' || isIconOnly) && renderIcon()}
      
      {/* 按钮文本 */}
      {children && (
        <span className={loading ? 'opacity-75' : ''}>
          {children}
        </span>
      )}
      
      {/* 右侧图标 */}
      {Icon && !loading && iconPosition === 'right' && children && renderIcon()}
    </button>
  )
}

export default Button 
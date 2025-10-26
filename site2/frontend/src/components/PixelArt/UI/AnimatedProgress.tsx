import React, { useEffect, useState } from 'react'

interface AnimatedProgressProps {
  progress: number
  duration?: number
  easing?: 'linear' | 'ease-out' | 'ease-in-out'
  showPercentage?: boolean
  color?: string
  backgroundColor?: string
  height?: number
  className?: string
}

/**
 * 动画进度条组件
 * 支持平滑动画和自定义样式
 */
const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  duration = 300,
  easing = 'ease-out',
  showPercentage = true,
  color = '#06b6d4',
  backgroundColor = '#4a4d5a',
  height = 8,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const targetProgress = Math.max(0, Math.min(100, progress))
    
    if (animatedProgress !== targetProgress) {
      setIsAnimating(true)
      
      // 使用requestAnimationFrame实现平滑动画
      const startTime = performance.now()
      const startProgress = animatedProgress
      const progressDiff = targetProgress - startProgress
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progressRatio = Math.min(elapsed / duration, 1)
        
        // 应用缓动函数
        let easedRatio: number
        switch (easing) {
          case 'ease-out':
            easedRatio = 1 - Math.pow(1 - progressRatio, 2)
            break
          case 'ease-in-out':
            easedRatio = progressRatio < 0.5
              ? 2 * progressRatio * progressRatio
              : 1 - Math.pow(-2 * progressRatio + 2, 2) / 2
            break
          case 'linear':
          default:
            easedRatio = progressRatio
            break
        }
        
        const currentProgress = startProgress + progressDiff * easedRatio
        setAnimatedProgress(currentProgress)
        
        if (progressRatio < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(animate)
    }
  }, [progress, animatedProgress, duration, easing])

  const progressWidth = `${animatedProgress}%`

  return (
    <div className={`relative ${className}`}>
      {/* 进度条容器 */}
      <div 
        className="relative rounded-full overflow-hidden"
        style={{ 
          height: `${height}px`,
          backgroundColor
        }}
      >
        {/* 进度条填充 */}
        <div
          className="h-full rounded-full transition-all duration-75 ease-out"
          style={{
            width: progressWidth,
            backgroundColor: color,
            boxShadow: isAnimating ? `0 0 8px ${color}40` : 'none'
          }}
        />
        
        {/* 动画光效 */}
        {isAnimating && (
          <div
            className="absolute top-0 right-0 h-full w-8 opacity-60 animate-pulse"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              transform: 'translateX(8px)'
            }}
          />
        )}
      </div>

      {/* 百分比显示 */}
      {showPercentage && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div
            className={`
              text-xs font-medium px-2 py-1 rounded backdrop-blur-sm
              transition-all duration-200
              ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}40`
            }}
          >
            {Math.round(animatedProgress)}%
          </div>
          
          {/* 小箭头 */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `4px solid ${color}40`
            }}
          />
        </div>
      )}
    </div>
  )
}

export default AnimatedProgress

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useDebounceCallback } from '@/hooks/useDebounce'
import Tooltip from '../UI/Tooltip'

interface RangeSliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  disabled?: boolean
  showTooltip?: boolean
  formatValue?: (value: number) => string
  description?: string
  helpText?: string
}

/**
 * 滑块组件
 * 支持实时反馈、键盘操作和防抖处理
 */
const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  showTooltip = false,
  formatValue,
  description,
  helpText
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltipState, setShowTooltipState] = useState(false)
  const sliderRef = useRef<HTMLInputElement>(null)

  // 防抖的onChange回调
  const debouncedOnChange = useDebounceCallback(onChange, 300)

  // 同步外部value到本地状态
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // 处理滑块值变化
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value)
    setLocalValue(newValue)
    
    // 立即更新本地状态，防抖更新外部状态
    debouncedOnChange(newValue)
  }, [debouncedOnChange])

  // 处理鼠标按下
  const handleMouseDown = () => {
    setIsDragging(true)
    if (showTooltip) {
      setShowTooltipState(true)
    }
  }

  // 处理鼠标抬起
  const handleMouseUp = () => {
    setIsDragging(false)
    setShowTooltipState(false)
    // 确保最终值被应用
    onChange(localValue)
  }

  // 处理键盘操作
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    let newValue = localValue
    const stepSize = step || 1
    const largeStep = (max - min) / 10 // 10%步长用于Page Up/Down

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault()
        newValue = Math.max(min, localValue - stepSize)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault()
        newValue = Math.min(max, localValue + stepSize)
        break
      case 'PageDown':
        event.preventDefault()
        newValue = Math.max(min, localValue - largeStep)
        break
      case 'PageUp':
        event.preventDefault()
        newValue = Math.min(max, localValue + largeStep)
        break
      case 'Home':
        event.preventDefault()
        newValue = min
        break
      case 'End':
        event.preventDefault()
        newValue = max
        break
      default:
        return
    }

    setLocalValue(newValue)
    onChange(newValue)
  }

  // 格式化显示值
  const displayValue = formatValue ? formatValue(localValue) : `${localValue}${unit}`

  // 计算滑块进度百分比
  const progress = ((localValue - min) / (max - min)) * 100

  return (
    <div className="mb-6">
      {/* 标签和数值 */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <label 
            htmlFor={`slider-${label}`}
            className="text-gray-300 text-sm font-medium"
          >
            {label}
          </label>
          {(description || helpText) && (
            <Tooltip
              content={
                <div className="space-y-1">
                  {description && <div className="font-medium">{description}</div>}
                  {helpText && <div className="text-xs opacity-80">{helpText}</div>}
                </div>
              }
              position="top"
              maxWidth={250}
            >
              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center cursor-help hover:bg-gray-500 transition-colors">
                <span className="text-xs text-gray-300">?</span>
              </div>
            </Tooltip>
          )}
        </div>
        <span className={`text-sm font-medium ${isDragging ? 'text-[#06b6d4] scale-105' : 'text-white'} transition-all duration-200`}>
          {displayValue}
        </span>
      </div>
      
      {/* 滑块容器 */}
      <div className="relative">
        {/* 自定义滑轨背景 */}
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-[#4a4d5a] rounded-lg transform -translate-y-1/2" />
        
        {/* 进度条 */}
        <div 
          className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] rounded-lg transform -translate-y-1/2 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
        
        {/* 滑块输入 */}
        <input
          ref={sliderRef}
          id={`slider-${label}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`
            relative w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer z-10
            focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-opacity-50
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#06b6d4]
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150
            hover:[&::-webkit-slider-thumb]:scale-110 
            active:[&::-webkit-slider-thumb]:scale-95
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full 
            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#06b6d4]
            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:box-shadow-lg
          `}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={localValue}
          aria-valuetext={displayValue}
        />

        {/* 工具提示 */}
        {showTooltipState && showTooltip && (
          <div 
            className="absolute top-0 transform -translate-y-full -translate-x-1/2 mb-2 z-20"
            style={{ left: `${progress}%` }}
          >
            <div className="bg-[#1a1b23] text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-600">
              {displayValue}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#1a1b23]" />
            </div>
          </div>
        )}
      </div>

      {/* 刻度标记（可选） */}
      {(max - min) <= 20 && step === 1 && (
        <div className="flex justify-between mt-1 px-2.5">
          {Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => {
            const tickValue = min + i * step
            const isActive = Math.abs(tickValue - localValue) < step / 2
            return (
              <div 
                key={i}
                className={`h-1 w-0.5 ${isActive ? 'bg-[#06b6d4]' : 'bg-gray-600'} transition-colors`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RangeSlider

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface DropdownSelectProps {
  label: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * 下拉选择组件
 * 按照截图样式实现，支持选项展开和选择
 */
const DropdownSelect: React.FC<DropdownSelectProps> = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  placeholder = '请选择'
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 监听isOpen变化，重置高亮索引
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex(opt => opt.value === value)
      setHighlightedIndex(currentIndex)
    } else {
      setHighlightedIndex(-1)
    }
  }, [isOpen, options, value])

  const selectedOption = options.find(option => option.value === value)

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return
    onChange(optionValue)
    setIsOpen(false)
    setHighlightedIndex(-1)
    buttonRef.current?.focus()
  }

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value)
          setIsOpen(false)
          setHighlightedIndex(-1)
        } else {
          setIsOpen(!isOpen)
        }
        break
      
      case 'Escape':
        event.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        buttonRef.current?.focus()
        break
      
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          )
        }
        break
      
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          )
        }
        break
      
      case 'Home':
        if (isOpen) {
          event.preventDefault()
          setHighlightedIndex(0)
        }
        break
      
      case 'End':
        if (isOpen) {
          event.preventDefault()
          setHighlightedIndex(options.length - 1)
        }
        break
      
      // 字母键快速选择
      default:
        if (isOpen && event.key.length === 1) {
          event.preventDefault()
          const char = event.key.toLowerCase()
          const index = options.findIndex(option => 
            option.label.toLowerCase().startsWith(char)
          )
          if (index >= 0) {
            setHighlightedIndex(index)
          }
        }
        break
    }
  }

  const handleMouseEnter = (index: number) => {
    if (!disabled) {
      setHighlightedIndex(index)
    }
  }

  return (
    <div className="mb-6" ref={dropdownRef}>
      {/* 标签 */}
      <label 
        htmlFor={`dropdown-${label}`}
        className={`block text-sm font-medium mb-3 ${disabled ? 'text-gray-500' : 'text-gray-300'}`}
      >
        {label}
      </label>
      
      {/* 下拉框触发器 */}
      <div className="relative">
        <button
          ref={buttonRef}
          id={`dropdown-${label}`}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`dropdown-${label}-label`}
          className={`
            w-full px-4 py-3 rounded-lg text-left text-sm flex items-center justify-between
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#06b6d4] focus:ring-opacity-50
            ${disabled 
              ? 'bg-[#3a3d4a] text-gray-500 cursor-not-allowed opacity-50' 
              : 'bg-[#4a4d5a] hover:bg-[#5a5d6a] text-white cursor-pointer'
            }
            ${isOpen && !disabled ? 'ring-2 ring-[#06b6d4] ring-opacity-50' : ''}
          `}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown 
            className={`w-4 h-4 transition-all duration-200 flex-shrink-0 ml-2
                       ${isOpen ? 'rotate-180' : ''}
                       ${disabled ? 'text-gray-500' : 'text-gray-300'}`}
          />
        </button>
        
        {/* 下拉选项 */}
        {isOpen && !disabled && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-[#4a4d5a] rounded-lg shadow-xl z-50 
                       border border-[#5a5d6a] max-h-48 overflow-y-auto py-1"
            role="listbox"
            aria-labelledby={`dropdown-${label}-label`}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleOptionClick(option.value)}
                onMouseEnter={() => handleMouseEnter(index)}
                className={`
                  w-full text-left px-4 py-3 text-sm transition-all duration-150
                  ${option.value === value 
                    ? 'bg-[#1e40af] text-white font-medium' 
                    : 'text-gray-200 hover:bg-[#5a5d6a]'
                  }
                  ${index === highlightedIndex && option.value !== value 
                    ? 'bg-[#5a5d6a] text-white' 
                    : ''
                  }
                  focus:outline-none focus:bg-[#5a5d6a] focus:text-white
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{option.label}</span>
                  {option.value === value && (
                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading状态指示器（可选） */}
        {disabled && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  )
}

export default DropdownSelect

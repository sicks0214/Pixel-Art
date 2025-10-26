import React, { useState } from 'react'
import { useLanguage, useLocaleConfig } from '../core/LanguageProvider'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'select'
  size?: 'sm' | 'md' | 'lg'
  showFlags?: boolean
  showNativeNames?: boolean
  className?: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  size = 'md',
  showFlags = true,
  showNativeNames = true,
  className = ''
}) => {
  const { currentLocale, supportedLocales, changeLocale, isLoading } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLocaleChange = async (locale: string) => {
    if (locale === currentLocale || isLoading) return
    
    try {
      await changeLocale(locale)
      setIsOpen(false)
    } catch (error) {
      console.error('语言切换失败:', error)
    }
  }

  const renderLanguageOption = (locale: string) => {
    const config = useLocaleConfig(locale)
    if (!config) return null

    const isActive = locale === currentLocale
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg'
    }

    return (
      <button
        key={locale}
        onClick={() => handleLocaleChange(locale)}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 w-full text-left
          ${sizeClasses[size]}
          ${isActive 
            ? 'bg-blue-100 text-blue-900 font-medium' 
            : 'hover:bg-gray-100 text-gray-700'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
      >
        {showFlags && config.flag && (
          <span className="text-lg">{config.flag}</span>
        )}
        <div className="flex flex-col">
          <span className="font-medium">{config.name}</span>
          {showNativeNames && config.nativeName !== config.name && (
            <span className="text-xs text-gray-500">{config.nativeName}</span>
          )}
        </div>
        {isActive && (
          <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    )
  }

  const renderDropdown = () => {
    const currentConfig = useLocaleConfig(currentLocale)
    
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md
            bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            transition-colors duration-200
          `}
        >
          {showFlags && currentConfig?.flag && (
            <span className="text-lg">{currentConfig.flag}</span>
          )}
          <span className="font-medium">
            {currentConfig?.nativeName || currentConfig?.name || currentLocale}
          </span>
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-20">
              <div className="py-1">
                {supportedLocales.map(renderLanguageOption)}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderButtons = () => {
    return (
      <div className={`flex space-x-1 ${className}`}>
        {supportedLocales.map((locale) => {
          const config = useLocaleConfig(locale)
          if (!config) return null

          const isActive = locale === currentLocale
          const sizeClasses = {
            sm: 'px-2 py-1 text-xs',
            md: 'px-3 py-2 text-sm',
            lg: 'px-4 py-3 text-base'
          }

          return (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              disabled={isLoading}
              className={`
                flex items-center space-x-1 rounded-md border transition-colors duration-200
                ${sizeClasses[size]}
                ${isActive 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {showFlags && config.flag && (
                <span className="text-sm">{config.flag}</span>
              )}
              <span className="font-medium">
                {showNativeNames ? config.nativeName : config.name}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  const renderSelect = () => {
    return (
      <select
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        disabled={isLoading}
        className={`
          px-3 py-2 border border-gray-300 rounded-md bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {supportedLocales.map((locale) => {
          const config = useLocaleConfig(locale)
          if (!config) return null

          return (
            <option key={locale} value={locale}>
              {showFlags && config.flag ? `${config.flag} ` : ''}
              {showNativeNames ? config.nativeName : config.name}
            </option>
          )
        })}
      </select>
    )
  }

  switch (variant) {
    case 'buttons':
      return renderButtons()
    case 'select':
      return renderSelect()
    case 'dropdown':
    default:
      return renderDropdown()
  }
}

export default LanguageSwitcher 
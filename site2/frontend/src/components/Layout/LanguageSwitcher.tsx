import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Globe } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[1]

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    setIsOpen(false)
    
    // 保存语言偏好到本地存储
    localStorage.setItem('preferredLanguage', languageCode)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center space-x-3 transition-colors ${
                    i18n.language === language.code ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {i18n.language === language.code && (
                    <span className="ml-auto text-emerald-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher 
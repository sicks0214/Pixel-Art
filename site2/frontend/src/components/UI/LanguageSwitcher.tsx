/**
 * 语言切换器组件
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation()

  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ]

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title={t('common.language')}
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{t('common.language')}</span>
      </button>
      
      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-2 min-w-[160px] max-h-64 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`
                w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-3
                ${i18n.language === lang.code ? 'bg-purple-50 text-purple-600' : 'text-gray-700'}
              `}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LanguageSwitcher 
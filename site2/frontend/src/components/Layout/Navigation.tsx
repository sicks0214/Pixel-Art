import React from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const Navigation: React.FC = () => {
  const { t } = useTranslation()

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 左侧品牌 */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎯</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Pixel Art Converter</span>
            </div>
            

          </div>

          {/* 右侧操作 */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
      

    </nav>
  )
}

export default Navigation 
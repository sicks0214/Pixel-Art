/**
 * 应用头部导航组件
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Palette, Sparkles, Menu, Crown } from 'lucide-react'
import Button from '@/components/UI/Button'
import LanguageSwitcher from '@/components/UI/LanguageSwitcher'

const Header: React.FC = () => {
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { 
      path: '/workspace', 
      label: t('nav.workspace'), 
      icon: Palette,
      badge: t('common.free'),
      badgeColor: 'green'
    },
    { 
      path: '/advanced', 
      label: t('nav.advanced'), 
      icon: Sparkles,
      badge: t('common.paid'),
      badgeColor: 'orange'
    },
  ]

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex-shrink-0">
      <div className="px-4 py-3 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Logo and Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 text-gray-900 hover:text-purple-600 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">{t('nav.title')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon, badge, badgeColor }) => {
              const isActive = location.pathname === path
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  
                  {badge && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full font-medium
                      ${badgeColor === 'green' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                      }
                    `}>
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 
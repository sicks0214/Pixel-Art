import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { i18nManager, LocaleConfig } from './I18nManager'

interface LanguageContextType {
  currentLocale: string
  supportedLocales: string[]
  changeLocale: (locale: string) => Promise<void>
  getLocaleConfig: (locale: string) => LocaleConfig | undefined
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation()
  const [currentLocale, setCurrentLocale] = useState(i18nManager.getCurrentLocale())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 初始化时加载用户偏好的语言
    const preferredLocale = i18nManager.loadLocalePreference()
    if (preferredLocale !== currentLocale) {
      changeLocale(preferredLocale)
    }

    // 监听语言切换事件
    const handleLocaleChange = (event: CustomEvent) => {
      setCurrentLocale(event.detail.locale)
    }

    window.addEventListener('localeChanged', handleLocaleChange as EventListener)

    return () => {
      window.removeEventListener('localeChanged', handleLocaleChange as EventListener)
    }
  }, [])

  const changeLocale = async (locale: string): Promise<void> => {
    try {
      setIsLoading(true)
      await i18nManager.changeLocale(locale)
      setCurrentLocale(locale)
    } catch (error) {
      console.error('语言切换失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLocaleConfig = (locale: string): LocaleConfig | undefined => {
    return i18nManager.getLocaleConfig(locale)
  }

  const value: LanguageContextType = {
    currentLocale,
    supportedLocales: i18nManager.getSupportedLocales(),
    changeLocale,
    getLocaleConfig,
    isLoading
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// 自定义Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// 语言切换Hook
export const useLocaleChange = () => {
  const { changeLocale, isLoading } = useLanguage()

  const switchLocale = async (locale: string) => {
    try {
      await changeLocale(locale)
      return { success: true }
    } catch (error) {
      console.error('语言切换失败:', error)
      return { success: false, error }
    }
  }

  return {
    switchLocale,
    isLoading
  }
}

// 语言配置Hook
export const useLocaleConfig = (locale: string) => {
  const { getLocaleConfig } = useLanguage()
  return getLocaleConfig(locale)
}

// 当前语言Hook
export const useCurrentLocale = () => {
  const { currentLocale, getLocaleConfig } = useLanguage()
  return {
    locale: currentLocale,
    config: getLocaleConfig(currentLocale)
  }
} 
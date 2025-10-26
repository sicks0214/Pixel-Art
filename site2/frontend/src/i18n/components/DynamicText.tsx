import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../core/LanguageProvider'

interface DynamicTextProps {
  i18nKey: string
  fallback?: string
  values?: Record<string, any>
  namespace?: string
  className?: string
  as?: keyof JSX.IntrinsicElements
  showMissingWarning?: boolean
}

const DynamicText: React.FC<DynamicTextProps> = ({
  i18nKey,
  fallback,
  values,
  namespace,
  className = '',
  as: Component = 'span',
  showMissingWarning = false
}) => {
  const { t, i18n } = useTranslation(namespace)
  const { currentLocale } = useLanguage()
  const [text, setText] = useState<string>('')
  const [isMissing, setIsMissing] = useState<boolean>(false)

  useEffect(() => {
    const updateText = () => {
      const translatedText = t(i18nKey, values)
      const exists = i18n.exists(i18nKey, { ns: namespace })
      
      setText(translatedText)
      setIsMissing(!exists)
    }

    updateText()

    // 监听语言切换事件
    const handleLanguageChange = () => {
      updateText()
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [i18nKey, currentLocale, t, i18n, namespace, values])

  const displayText = isMissing && fallback ? fallback : text

  if (isMissing && showMissingWarning) {
    console.warn(`Missing translation: ${i18nKey} (${currentLocale})`)
  }

  return (
    <Component 
      className={`${isMissing ? 'text-red-500' : ''} ${className}`}
      title={isMissing ? `Missing translation: ${i18nKey}` : undefined}
    >
      {displayText}
    </Component>
  )
}

export default DynamicText 
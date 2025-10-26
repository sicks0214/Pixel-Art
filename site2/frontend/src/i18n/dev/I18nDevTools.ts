/**
 * 多语言开发工具
 * 用于开发时自动检测和提示多语言功能，避免硬编码
 */

import i18n from 'i18next'

export interface I18nDevToolsConfig {
  enableDevMode: boolean
  showMissingWarnings: boolean
  autoDetectHardcoded: boolean
  highlightMissingKeys: boolean
}

export class I18nDevTools {
  private config: I18nDevToolsConfig
  private missingKeys: Set<string> = new Set()
  private hardcodedTexts: Set<string> = new Set()

  constructor(config: Partial<I18nDevToolsConfig> = {}) {
    this.config = {
      enableDevMode: process.env.NODE_ENV === 'development',
      showMissingWarnings: true,
      autoDetectHardcoded: true,
      highlightMissingKeys: true,
      ...config
    }

    if (this.config.enableDevMode) {
      this.initDevTools()
    }
  }

  /**
   * 初始化开发工具
   */
  private initDevTools() {
    // 监听翻译缺失
    i18n.on('missingKey', (lngs, namespace, key, res) => {
      this.handleMissingKey(key, lngs[0])
    })

    // 监听语言切换
    i18n.on('languageChanged', (lng) => {
      this.handleLanguageChanged(lng)
    })

    // 开发时快速切换语言
    this.setupQuickLanguageSwitch()
  }

  /**
   * 处理缺失的翻译键
   */
  private handleMissingKey(key: string, language: string) {
    if (!this.config.showMissingWarnings) return

    this.missingKeys.add(key)
    
    console.warn(`🌍 [I18n] 缺失翻译键: "${key}" (语言: ${language})`)
    
    if (this.config.highlightMissingKeys) {
      this.highlightMissingKey(key)
    }
  }

  /**
   * 处理语言切换
   */
  private handleLanguageChanged(language: string) {
    console.log(`🌍 [I18n] 语言已切换到: ${language}`)
    
    // 检查新语言中的缺失键
    this.checkMissingKeysInLanguage(language)
  }

  /**
   * 检查指定语言中的缺失键
   */
  private checkMissingKeysInLanguage(language: string) {
    const currentKeys = this.getCurrentTranslationKeys()
    const missingKeys = currentKeys.filter(key => !this.hasTranslation(key, language))
    
    if (missingKeys.length > 0) {
      console.warn(`🌍 [I18n] 语言 ${language} 中缺失以下翻译键:`, missingKeys)
    }
  }

  /**
   * 高亮缺失的翻译键
   */
  private highlightMissingKey(key: string) {
    // 在开发环境中高亮显示缺失的翻译键
    const elements = document.querySelectorAll(`[data-i18n-key="${key}"]`)
    elements.forEach(element => {
      element.classList.add('i18n-missing-key')
      element.setAttribute('title', `缺失翻译键: ${key}`)
    })
  }

  /**
   * 设置快速语言切换
   */
  private setupQuickLanguageSwitch() {
    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + L 切换语言
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault()
        this.quickLanguageSwitch()
      }
    })
  }

  /**
   * 快速语言切换
   */
  private quickLanguageSwitch() {
    const languages = ['zh', 'en', 'ko', 'ja', 'fr', 'ru', 'de']
    const currentIndex = languages.indexOf(i18n.language)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLanguage = languages[nextIndex]
    
    i18n.changeLanguage(nextLanguage)
    console.log(`🌍 [I18n] 快速切换到: ${nextLanguage}`)
  }

  /**
   * 检测硬编码文本
   */
  public detectHardcodedText(text: string): boolean {
    if (!this.config.autoDetectHardcoded) return false

    // 简单的硬编码文本检测规则
    const isHardcoded = this.isChineseText(text) || this.isEnglishText(text)
    
    if (isHardcoded) {
      this.hardcodedTexts.add(text)
      console.warn(`🌍 [I18n] 检测到可能的硬编码文本: "${text}"`)
      return true
    }
    
    return false
  }

  /**
   * 检测中文文本
   */
  private isChineseText(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text) && text.length > 1
  }

  /**
   * 检测英文文本
   */
  private isEnglishText(text: string): boolean {
    return /^[a-zA-Z\s]+$/.test(text) && text.length > 2
  }

  /**
   * 获取当前翻译键
   */
  private getCurrentTranslationKeys(): string[] {
    const keys: string[] = []
    
    // 从DOM中提取翻译键
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
      const key = element.getAttribute('data-i18n-key')
      if (key) keys.push(key)
    })
    
    return keys
  }

  /**
   * 检查是否有指定语言的翻译
   */
  private hasTranslation(key: string, language: string): boolean {
    try {
      const translation = i18n.t(key, { lng: language })
      return translation !== key
    } catch {
      return false
    }
  }

  /**
   * 获取缺失的翻译键
   */
  public getMissingKeys(): string[] {
    return Array.from(this.missingKeys)
  }

  /**
   * 获取硬编码文本
   */
  public getHardcodedTexts(): string[] {
    return Array.from(this.hardcodedTexts)
  }

  /**
   * 生成翻译键建议
   */
  public generateTranslationKey(text: string): string {
    // 简单的翻译键生成规则
    const cleanText = text.replace(/[^\w\s]/g, '').trim()
    const words = cleanText.split(/\s+/)
    
    if (words.length === 1) {
      return words[0].toLowerCase()
    } else {
      return words.map(word => word.toLowerCase()).join('.')
    }
  }

  /**
   * 导出翻译数据
   */
  public exportTranslationData(): any {
    return {
      missingKeys: this.getMissingKeys(),
      hardcodedTexts: this.getHardcodedTexts(),
      currentLanguage: i18n.language,
      supportedLanguages: i18n.languages,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 清理开发工具
   */
  public cleanup() {
    this.missingKeys.clear()
    this.hardcodedTexts.clear()
    
    // 移除高亮样式
    document.querySelectorAll('.i18n-missing-key').forEach(element => {
      element.classList.remove('i18n-missing-key')
    })
  }
}

// 创建全局实例
export const i18nDevTools = new I18nDevTools()

// 开发时自动检测硬编码文本的Hook
export const useI18nDevTools = () => {
  const detectHardcoded = (text: string) => {
    return i18nDevTools.detectHardcodedText(text)
  }

  const generateKey = (text: string) => {
    return i18nDevTools.generateTranslationKey(text)
  }

  const getMissingKeys = () => {
    return i18nDevTools.getMissingKeys()
  }

  const exportData = () => {
    return i18nDevTools.exportTranslationData()
  }

  return {
    detectHardcoded,
    generateKey,
    getMissingKeys,
    exportData
  }
}

export default i18nDevTools 
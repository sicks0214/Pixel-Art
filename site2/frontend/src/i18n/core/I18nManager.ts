import i18next, { i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export interface LocaleConfig {
  code: string
  name: string
  nativeName: string
  flag?: string
  direction: 'ltr' | 'rtl'
}

export interface TranslationNamespace {
  name: string
  path: string
  lazy?: boolean
}

export interface I18nConfig {
  defaultLocale: string
  fallbackLocale: string
  supportedLocales: string[]
  namespaces: TranslationNamespace[]
  detection: {
    order: string[]
    caches: string[]
  }
}

export class I18nManager {
  private i18n: i18n
  private currentLocale: string
  private fallbackLocale: string
  private supportedLocales: string[]
  private loadedLocales: Set<string> = new Set()
  private loadedNamespaces: Map<string, Set<string>> = new Map()
  private config: I18nConfig

  constructor(config: I18nConfig) {
    this.config = config
    this.currentLocale = config.defaultLocale
    this.fallbackLocale = config.fallbackLocale
    this.supportedLocales = config.supportedLocales

    this.initializeI18n()
  }

  // 初始化i18n
  private async initializeI18n(): Promise<void> {
    await i18next
      .use(initReactI18next)
      .use(LanguageDetector)
      .init({
        debug: process.env.NODE_ENV === 'development',
        fallbackLng: this.fallbackLocale,
        supportedLngs: this.supportedLocales,
        detection: this.config.detection,
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      })

    this.i18n = i18next

    // 加载默认语言包
    await this.loadLocale(this.currentLocale)
  }

  // 动态加载语言包
  async loadLocale(locale: string): Promise<void> {
    try {
      if (this.loadedLocales.has(locale)) {
        return
      }

      // 加载所有命名空间的语言包
      const loadPromises = this.config.namespaces.map(namespace =>
        this.loadNamespace(locale, namespace.name)
      )

      await Promise.all(loadPromises)
      this.loadedLocales.add(locale)

      console.log(`语言包加载成功: ${locale}`)
    } catch (error) {
      console.error(`语言包加载失败: ${locale}`, error)
      throw error
    }
  }

  // 加载命名空间
  private async loadNamespace(locale: string, namespace: string): Promise<void> {
    try {
      const key = `${locale}-${namespace}`
      if (this.isNamespaceLoaded(locale, namespace)) {
        return
      }

      // 动态导入语言包
      const translations = await this.importTranslations(locale, namespace)
      
      // 添加到i18next
      this.i18n.addResourceBundle(locale, namespace, translations, true, true)

      // 标记为已加载
      this.markNamespaceLoaded(locale, namespace)

      console.log(`命名空间加载成功: ${locale}/${namespace}`)
    } catch (error) {
      console.error(`命名空间加载失败: ${locale}/${namespace}`, error)
      throw error
    }
  }

  // 动态导入翻译文件
  private async importTranslations(locale: string, namespace: string): Promise<any> {
    try {
      // 尝试加载语言包文件
      const module = await import(`../locales/${locale}/${namespace}.json`)
      return module.default || module
    } catch (error) {
      // 如果加载失败，尝试加载回退语言
      if (locale !== this.fallbackLocale) {
        console.warn(`回退到默认语言: ${locale}/${namespace} -> ${this.fallbackLocale}/${namespace}`)
        return this.importTranslations(this.fallbackLocale, namespace)
      }
      throw error
    }
  }

  // 切换语言
  async changeLocale(locale: string): Promise<void> {
    try {
      if (!this.supportedLocales.includes(locale)) {
        throw new Error(`不支持的语言: ${locale}`)
      }

      // 加载语言包
      await this.loadLocale(locale)

      // 切换语言
      await this.i18n.changeLanguage(locale)
      this.currentLocale = locale

      // 保存到本地存储
      this.saveLocalePreference(locale)

      // 触发语言切换事件
      this.triggerLocaleChangeEvent(locale)

      console.log(`语言切换成功: ${locale}`)
    } catch (error) {
      console.error(`语言切换失败: ${locale}`, error)
      throw error
    }
  }

  // 获取当前语言
  getCurrentLocale(): string {
    return this.currentLocale
  }

  // 获取支持的语言列表
  getSupportedLocales(): string[] {
    return this.supportedLocales
  }

  // 获取语言配置
  getLocaleConfig(locale: string): LocaleConfig | undefined {
    const configs: Record<string, LocaleConfig> = {
      'zh': {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳',
        direction: 'ltr'
      },
      'en': {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        direction: 'ltr'
      },
      'ko': {
        code: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        flag: '🇰🇷',
        direction: 'ltr'
      },
      'ja': {
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        flag: '🇯🇵',
        direction: 'ltr'
      },
      'fr': {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷',
        direction: 'ltr'
      },
      'ru': {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        direction: 'ltr'
      },
      'de': {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        flag: '🇩🇪',
        direction: 'ltr'
      }
    }

    return configs[locale]
  }

  // 检查命名空间是否已加载
  private isNamespaceLoaded(locale: string, namespace: string): boolean {
    const key = `${locale}-${namespace}`
    return this.loadedNamespaces.has(key)
  }

  // 标记命名空间已加载
  private markNamespaceLoaded(locale: string, namespace: string): void {
    const key = `${locale}-${namespace}`
    this.loadedNamespaces.set(key, new Set())
  }

  // 保存语言偏好
  private saveLocalePreference(locale: string): void {
    try {
      localStorage.setItem('preferredLocale', locale)
    } catch (error) {
      console.error('保存语言偏好失败:', error)
    }
  }

  // 加载语言偏好
  loadLocalePreference(): string {
    try {
      const saved = localStorage.getItem('preferredLocale')
      if (saved && this.supportedLocales.includes(saved)) {
        return saved
      }
    } catch (error) {
      console.error('加载语言偏好失败:', error)
    }
    return this.currentLocale
  }

  // 触发语言切换事件
  private triggerLocaleChangeEvent(locale: string): void {
    const event = new CustomEvent('localeChanged', {
      detail: { locale }
    })
    window.dispatchEvent(event)
  }

  // 获取翻译
  t(key: string, options?: any): string {
    return this.i18n.t(key, options)
  }

  // 检查翻译是否存在
  exists(key: string): boolean {
    return this.i18n.exists(key)
  }

  // 获取缺失的翻译
  getMissingTranslations(): string[] {
    const missing: string[] = []
    const keys = this.getAllTranslationKeys()
    
    for (const key of keys) {
      if (!this.exists(key)) {
        missing.push(key)
      }
    }

    return missing
  }

  // 获取所有翻译键
  private getAllTranslationKeys(): string[] {
    const keys: string[] = []
    const resources = this.i18n.store.data

    for (const locale in resources) {
      for (const namespace in resources[locale]) {
        const namespaceData = resources[locale][namespace]
        this.extractKeys(namespaceData, '', keys)
      }
    }

    return keys
  }

  // 提取翻译键
  private extractKeys(obj: any, prefix: string, keys: string[]): void {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.extractKeys(obj[key], fullKey, keys)
      } else {
        keys.push(fullKey)
      }
    }
  }

  // 获取i18n实例
  getI18n(): i18n {
    return this.i18n
  }

  // 重新加载语言包
  async reloadLocale(locale: string): Promise<void> {
    this.loadedLocales.delete(locale)
    this.loadedNamespaces.clear()
    await this.loadLocale(locale)
  }

  // 获取语言包大小
  getLocaleSize(locale: string): number {
    const resources = this.i18n.store.data[locale]
    if (!resources) return 0

    let size = 0
    for (const namespace in resources) {
      size += JSON.stringify(resources[namespace]).length
    }
    return size
  }

  // 清理未使用的语言包
  cleanupUnusedLocales(): void {
    const currentLocale = this.getCurrentLocale()
    const fallbackLocale = this.fallbackLocale

    for (const locale of this.loadedLocales) {
      if (locale !== currentLocale && locale !== fallbackLocale) {
        this.i18n.removeResourceBundle(locale)
        this.loadedLocales.delete(locale)
      }
    }
  }
}

// 创建默认配置
const defaultConfig: I18nConfig = {
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: ['zh', 'en', 'ko', 'ja', 'fr', 'ru', 'de'],
  namespaces: [
    { name: 'common', path: 'common' },
    { name: 'home', path: 'home' },
    { name: 'dashboard', path: 'dashboard' },
    { name: 'user', path: 'user' },
    { name: 'plugins', path: 'plugins' }
  ],
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage']
  }
}

// 创建全局国际化管理器实例
export const i18nManager = new I18nManager(defaultConfig) 
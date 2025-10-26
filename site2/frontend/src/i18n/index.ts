import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zh from './locales/zh.json';
import en from './locales/en.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import de from './locales/de.json';

const resources = {
  zh: {
    translation: zh
  },
  en: {
    translation: en
  },
  ko: {
    translation: ko
  },
  ja: {
    translation: ja
  },
  fr: {
    translation: fr
  },
  ru: {
    translation: ru
  },
  de: {
    translation: de
  }
};

// 获取保存的语言偏好，默认为英文
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('preferredLanguage') || 'en'
  : 'en';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 使用保存的语言偏好，默认英文
    fallbackLng: 'en', // 回退语言改为英文
    debug: false,

    // 语言检测选项
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'preferredLanguage'
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    }
  });

export default i18n; 
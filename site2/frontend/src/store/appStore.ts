/**
 * 应用全局状态管理Store
 */

import { create } from 'zustand'

// 主题类型
export type Theme = 'light' | 'dark' | 'auto'

// 应用状态接口
interface AppState {
  // UI状态
  theme: Theme
  language: string
  loading: boolean
  
  // 用户设置
  autoSave: boolean
  defaultQuality: number
  
  // 错误处理
  errors: Array<{
    id: string
    message: string
    timestamp: number
    type: 'error' | 'warning' | 'info'
  }>
  
  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: string) => void
  setLoading: (loading: boolean) => void
  setAutoSave: (enabled: boolean) => void
  setDefaultQuality: (quality: number) => void
  addError: (message: string, type?: 'error' | 'warning' | 'info') => void
  removeError: (id: string) => void
  clearErrors: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  theme: 'light',
  language: 'zh-CN',
  loading: false,
  autoSave: true,
  defaultQuality: 90,
  errors: [],
  
  // Actions
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setLoading: (loading) => set({ loading }),
  setAutoSave: (autoSave) => set({ autoSave }),
  setDefaultQuality: (quality) => set({ 
    defaultQuality: Math.max(50, Math.min(100, quality))
  }),
  
  addError: (message, type = 'error') => {
    const error = {
      id: `error-${Date.now()}`,
      message,
      type,
      timestamp: Date.now(),
    }
    set((state) => ({
      errors: [...state.errors, error]
    }))
  },
  
  removeError: (id) => set((state) => ({
    errors: state.errors.filter(error => error.id !== id)
  })),
  
  clearErrors: () => set({ errors: [] }),
}))

export type { AppState } 
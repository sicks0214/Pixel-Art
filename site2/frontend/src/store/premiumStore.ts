/**
 * 会员权限和AI试用管理Store - 第三阶段
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// AI功能试用配置
export interface AITrialConfig {
  maxTrials: number
  currentTrials: number
  resetDate?: string // 每日重置的日期
}

// 会员状态
export interface PremiumStatus {
  isPremium: boolean
  membershipType: 'free' | 'basic' | 'pro' | 'lifetime'
  expiryDate?: string
  features: string[]
}

// Store状态接口
interface PremiumState {
  // 会员状态
  premiumStatus: PremiumStatus
  
  // AI试用计数
  aiTrials: {
    cartoonify: AITrialConfig
    backgroundRemoval: AITrialConfig
    styleTransfer: AITrialConfig
    textRecognition: AITrialConfig
  }
  
  // UI状态
  showUpgradeModal: boolean
  showTrialExpiredModal: boolean
  lastTrialFeature: string | null
  
  // Actions
  // 试用相关
  checkTrialAvailable: (feature: string) => boolean
  useAITrial: (feature: string) => boolean
  resetDailyTrials: () => void
  
  // 会员相关
  setPremiumStatus: (status: Partial<PremiumStatus>) => void
  upgradeToPremium: (membershipType: 'basic' | 'pro' | 'lifetime') => void
  
  // UI控制
  showUpgradeDialog: (feature: string) => void
  hideUpgradeDialog: () => void
  showTrialExpired: (feature: string) => void
  hideTrialExpired: () => void
  
  // 权限检查
  hasFeatureAccess: (feature: string) => boolean
  getRemainingTrials: (feature: string) => number
  getFeatureDescription: (feature: string) => string
}

// 默认试用配置
const defaultTrialConfig: AITrialConfig = {
  maxTrials: 3,
  currentTrials: 0,
  resetDate: new Date().toDateString()
}

// 默认会员状态
const defaultPremiumStatus: PremiumStatus = {
  isPremium: false,
  membershipType: 'free',
  features: ['basic_editing', 'stickers', 'bubbles', 'text_tools', 'templates']
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // 初始状态
      premiumStatus: defaultPremiumStatus,
      aiTrials: {
        cartoonify: { ...defaultTrialConfig },
        backgroundRemoval: { ...defaultTrialConfig },
        styleTransfer: { ...defaultTrialConfig },
        textRecognition: { ...defaultTrialConfig }
      },
      showUpgradeModal: false,
      showTrialExpiredModal: false,
      lastTrialFeature: null,

      // 试用相关
      checkTrialAvailable: (feature: string) => {
        const state = get()
        
        // 如果是会员，直接允许
        if (state.premiumStatus.isPremium) {
          return true
        }
        
        // 检查是否需要重置每日试用次数
        const today = new Date().toDateString()
        const trialConfig = state.aiTrials[feature as keyof typeof state.aiTrials]
        
        if (trialConfig && trialConfig.resetDate !== today) {
          // 重置当日试用次数
          set(state => ({
            aiTrials: {
              ...state.aiTrials,
              [feature]: {
                ...trialConfig,
                currentTrials: 0,
                resetDate: today
              }
            }
          }))
          return true
        }
        
        return trialConfig ? trialConfig.currentTrials < trialConfig.maxTrials : false
      },

      useAITrial: (feature: string) => {
        const state = get()
        
        // 会员直接通过
        if (state.premiumStatus.isPremium) {
          console.log('🎖️ 会员用户，AI功能无限制使用:', feature)
          return true
        }
        
        // 检查试用次数
        if (!state.checkTrialAvailable(feature)) {
          console.log('⚠️ AI功能试用次数已用完:', feature)
          state.showTrialExpired(feature)
          return false
        }
        
        // 消耗一次试用
        const trialConfig = state.aiTrials[feature as keyof typeof state.aiTrials]
        if (trialConfig) {
          set(state => ({
            aiTrials: {
              ...state.aiTrials,
              [feature]: {
                ...trialConfig,
                currentTrials: trialConfig.currentTrials + 1
              }
            }
          }))
          
          const remainingTrials = trialConfig.maxTrials - trialConfig.currentTrials - 1
          console.log(`🎯 使用AI功能试用: ${feature}, 剩余次数: ${remainingTrials}`)
          
          // 如果是最后一次试用，提示用户
          if (remainingTrials === 0) {
            setTimeout(() => {
              state.showUpgradeDialog(feature)
            }, 2000) // 处理完成后提示
          }
          
          return true
        }
        
        return false
      },

      resetDailyTrials: () => {
        const today = new Date().toDateString()
        set(state => ({
          aiTrials: {
            cartoonify: { ...defaultTrialConfig, resetDate: today },
            backgroundRemoval: { ...defaultTrialConfig, resetDate: today },
            styleTransfer: { ...defaultTrialConfig, resetDate: today },
            textRecognition: { ...defaultTrialConfig, resetDate: today }
          }
        }))
        console.log('🔄 每日AI试用次数已重置')
      },

      // 会员相关
      setPremiumStatus: (status) => {
        set(state => ({
          premiumStatus: {
            ...state.premiumStatus,
            ...status
          }
        }))
        console.log('👑 会员状态已更新:', status)
      },

      upgradeToPremium: (membershipType) => {
        const features = {
          basic: ['basic_editing', 'stickers', 'bubbles', 'text_tools', 'templates', 'ai_cartoonify', 'ai_background_removal'],
          pro: ['basic_editing', 'stickers', 'bubbles', 'text_tools', 'templates', 'ai_cartoonify', 'ai_background_removal', 'ai_style_transfer', 'ai_text_recognition', 'batch_processing'],
          lifetime: ['basic_editing', 'stickers', 'bubbles', 'text_tools', 'templates', 'ai_cartoonify', 'ai_background_removal', 'ai_style_transfer', 'ai_text_recognition', 'batch_processing', 'premium_templates', 'priority_support']
        }
        
        const expiryDate = membershipType === 'lifetime' ? undefined : 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30天后过期
        
        set(state => ({
          premiumStatus: {
            isPremium: true,
            membershipType,
            expiryDate,
            features: features[membershipType]
          },
          showUpgradeModal: false,
          showTrialExpiredModal: false
        }))
        
        console.log(`🎉 升级为${membershipType}会员成功!`)
      },

      // UI控制
      showUpgradeDialog: (feature) => {
        set({
          showUpgradeModal: true,
          lastTrialFeature: feature
        })
        console.log('💳 显示升级弹窗:', feature)
      },

      hideUpgradeDialog: () => {
        set({
          showUpgradeModal: false,
          lastTrialFeature: null
        })
      },

      showTrialExpired: (feature) => {
        set({
          showTrialExpiredModal: true,
          lastTrialFeature: feature
        })
        console.log('⏰ 显示试用过期弹窗:', feature)
      },

      hideTrialExpired: () => {
        set({
          showTrialExpiredModal: false,
          lastTrialFeature: null
        })
      },

      // 权限检查
      hasFeatureAccess: (feature) => {
        const state = get()
        return state.premiumStatus.features.includes(feature) || 
               state.checkTrialAvailable(feature)
      },

      getRemainingTrials: (feature) => {
        const state = get()
        if (state.premiumStatus.isPremium) return -1 // 无限制
        
        const trialConfig = state.aiTrials[feature as keyof typeof state.aiTrials]
        return trialConfig ? trialConfig.maxTrials - trialConfig.currentTrials : 0
      },

      getFeatureDescription: (feature) => {
        const descriptions = {
          cartoonify: 'AI智能卡通化 - 将真实照片转换为卡通风格',
          backgroundRemoval: 'AI背景移除 - 自动识别并移除图片背景',
          styleTransfer: 'AI风格迁移 - 应用艺术风格到您的图片',
          textRecognition: 'AI文字识别 - 识别图片中的文字并提供编辑'
        }
        return descriptions[feature as keyof typeof descriptions] || feature
      }
    }),
    {
      name: 'premium-storage', // localStorage key
      partialize: (state) => ({
        premiumStatus: state.premiumStatus,
        aiTrials: state.aiTrials
      })
    }
  )
)

// 便捷Hook
export const useAITrial = () => {
  const store = usePremiumStore()
  return {
    checkTrial: store.checkTrialAvailable,
    useTrial: store.useAITrial,
    getRemainingTrials: store.getRemainingTrials,
    isPremium: store.premiumStatus.isPremium
  }
}

export const usePremiumFeatures = () => {
  const store = usePremiumStore()
  return {
    isPremium: store.premiumStatus.isPremium,
    membershipType: store.premiumStatus.membershipType,
    hasFeature: store.hasFeatureAccess,
    showUpgrade: store.showUpgradeDialog
  }
}

export default usePremiumStore 
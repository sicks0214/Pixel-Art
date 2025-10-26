/**
 * 高级功能提供者组件
 * 管理高级功能的状态和权限
 */

import React, { createContext, useContext, useState } from 'react'

interface PremiumContextType {
  isPremium: boolean
  setIsPremium: (value: boolean) => void
  features: {
    advancedGeneration: boolean
    unlimitedSaves: boolean
    exportFormats: boolean
  }
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined)

export const usePremium = () => {
  const context = useContext(PremiumContext)
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider')
  }
  return context
}

interface PremiumProviderProps {
  children: React.ReactNode
}

const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false)

  const features = {
    advancedGeneration: isPremium,
    unlimitedSaves: isPremium,
    exportFormats: true // 导出功能对所有用户开放
  }

  const value: PremiumContextType = {
    isPremium,
    setIsPremium,
    features
  }

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  )
}

export default PremiumProvider 
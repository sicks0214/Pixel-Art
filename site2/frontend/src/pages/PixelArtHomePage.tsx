/**
 * 像素画转换器专用主页
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import Navigation from '@/components/Layout/Navigation'
import Footer from '@/components/Layout/Footer'
import PixelArtConverterUltimate from '@/components/PixelArt/PixelArtConverterUltimate'

const PixelArtHomePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 导航栏 - 简化版 */}
      <Navigation />
      
      {/* 主内容区域 - 像素画转换器 */}
      <div className="flex-1">
        <PixelArtConverterUltimate />
      </div>
      
      {/* 页脚 */}
      <Footer />
    </div>
  )
}

export default PixelArtHomePage

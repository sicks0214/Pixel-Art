/**
 * 像素画转换器专用主页
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import Navigation from '@/components/Layout/Navigation'
import Footer from '@/components/Layout/Footer'
import PixelArtConverterUltimate from '@/components/PixelArt/PixelArtConverterUltimate'
import SEO from '@/components/SEO'

const PixelArtHomePage: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* SEO优化 */}
      <SEO
        title="Pixel Art Converter - Convert Images to Retro Pixel Art"
        description="Convert images to pixel art with 4 pixelation modes, adjustable colors (4-256), and real-time preview. Export PNG/JPG for games and retro art."
        keywords="pixel art, pixel art converter, image to pixel art, retro art, 8-bit art, pixelate image, pixel art generator"
        url="https://pixelartland.cc/"
      />
      
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

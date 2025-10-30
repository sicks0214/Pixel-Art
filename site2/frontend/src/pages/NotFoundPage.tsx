/**
 * 404错误页面
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft, Palette } from 'lucide-react'
import Button from '@/components/UI/Button'
import SEO from '@/components/SEO'

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
      <SEO
        title="404 - Page Not Found | Pixel Art Converter"
        description="The page you're looking for doesn't exist. Return to Pixel Art Converter homepage."
        url="https://pixelartland.cc/"
      />
      <div className="max-w-md w-full text-center">
        {/* 404动画图标 */}
        <div className="mb-8">
          <div className="relative mx-auto w-32 h-32 mb-4">
            {/* 大圆圈 */}
            <div className="absolute inset-0 border-8 border-purple-200 rounded-full animate-pulse"></div>
            
            {/* 内圆圈 */}
            <div className="absolute inset-4 border-4 border-purple-400 rounded-full animate-ping"></div>
            
            {/* 中心图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Palette className="w-12 h-12 text-purple-600 animate-bounce" />
            </div>
          </div>
          
          {/* 404文字 */}
          <div className="text-8xl font-bold text-purple-600 mb-2 opacity-20">
            404
          </div>
        </div>

        {/* 错误信息 */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          页面未找到
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          抱歉，您访问的页面不存在或已被移动。
          <br />
          让我们帮您找到想要的内容吧！
        </p>

        {/* 操作按钮 */}
        <div className="space-y-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={Home}
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            fullWidth
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            返回上页
          </Button>
        </div>

        {/* 建议链接 */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">或者访问以下页面：</p>
          
          <div className="flex flex-col space-y-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
            >
              🎨 AI调色板生成器
            </button>
            <button
              onClick={() => navigate('/color-analysis')}
              className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
            >
              🖼️ 图片颜色分析
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="text-purple-600 hover:text-purple-700 hover:underline transition-colors"
            >
              📞 联系我们
            </button>
          </div>
        </div>

        {/* 装饰元素 */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  )
}

export default NotFoundPage

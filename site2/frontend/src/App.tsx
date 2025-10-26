/**
 * 主应用组件 - 像素画转换器专用版
 */

import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from '@/i18n/core/LanguageProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import PixelArtHomePage from '@/pages/PixelArtHomePage'
import ContactPage from '@/pages/ContactPage'
import TermsOfServicePage from '@/pages/TermsOfServicePage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import DisclaimerPage from '@/pages/DisclaimerPage'
import NotFoundPage from '@/pages/NotFoundPage'

const App: React.FC = () => {
  console.log('🎯 Pixel Art Converter App 启动')
  
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PixelArtHomePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  )
}

export default App 
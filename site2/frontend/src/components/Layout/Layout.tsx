/**
 * 应用布局组件
 */

import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import PremiumProvider from '@/components/Premium/PremiumProvider'

interface LayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  return (
    <PremiumProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && <Sidebar />}
          
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </PremiumProvider>
  )
}

export default Layout 
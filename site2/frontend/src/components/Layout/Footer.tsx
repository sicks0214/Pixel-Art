import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  const { t } = useTranslation()






  return (
    <>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-12">


          <div className="mb-2 text-center">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact & Support</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
              <Link to="/disclaimer" className="hover:text-gray-900 transition-colors">Disclaimer</Link>
            </div>
          </div>

          {/* 底部版权 */}
          <div className="pt-2 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Pixel Art Converter. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Built with React & TypeScript
            </p>
          </div>
        </div>
      </footer>




    </>
  )
}

export default Footer 
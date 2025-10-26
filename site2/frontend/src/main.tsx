import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'

// 开发环境配置验证（开发环境自动运行）
if (import.meta.env.DEV) {
  import('./utils/configValidator')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
) 
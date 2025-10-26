import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

/**
 * 错误边界组件
 * 捕获子组件中的JavaScript错误，并显示友好的错误UI
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: ''
  }

  public static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] 组件错误:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
      errorId: Math.random().toString(36).substr(2, 9)
    })

    // 调用自定义错误处理器
    this.props.onError?.(error, errorInfo)

    // 上报错误到监控服务（如果有的话）
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 这里可以集成错误监控服务，如 Sentry、LogRocket 等
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }

    console.group('[ErrorBoundary] 错误报告')
    console.error('错误信息:', errorReport)
    console.groupEnd()

    // 在开发环境下，可以显示详细的错误信息
    if (process.env.NODE_ENV === 'development') {
      console.table(errorReport)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private copyErrorInfo = () => {
    const { error, errorInfo, errorId } = this.state
    
    const errorText = `
错误ID: ${errorId}
时间: ${new Date().toISOString()}
错误消息: ${error?.message || 'Unknown error'}
错误堆栈: ${error?.stack || 'No stack trace'}
组件堆栈: ${errorInfo?.componentStack || 'No component stack'}
用户代理: ${navigator.userAgent}
页面URL: ${window.location.href}
    `.trim()

    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('错误信息已复制到剪贴板')
      }).catch(() => {
        // Fallback to textarea method
        this.fallbackCopyTextToClipboard(errorText)
      })
    } else {
      this.fallbackCopyTextToClipboard(errorText)
    }
  }

  private fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        alert('错误信息已复制到剪贴板')
      }
    } catch (err) {
      console.error('无法复制错误信息:', err)
    }
    
    document.body.removeChild(textArea)
  }

  public render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-[#1a1b23] text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* 错误卡片 */}
            <div className="bg-[#2a2d3a] rounded-xl border border-red-500/20 p-8 text-center">
              {/* 错误图标 */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
              </div>

              {/* 错误标题 */}
              <h1 className="text-2xl font-semibold text-white mb-4">
                哎呀，出了点问题
              </h1>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                像素画转换器遇到了一个意外错误。不用担心，这种情况很少见。
                您可以尝试重新加载页面，或者联系我们的技术支持。
              </p>

              {/* 错误ID */}
              <div className="bg-[#1a1b23] rounded-lg p-3 mb-6">
                <div className="text-xs text-gray-400 mb-1">错误ID</div>
                <div className="font-mono text-sm text-[#06b6d4]">
                  {this.state.errorId}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#06b6d4] hover:bg-[#0891b2] text-white rounded-lg font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新加载页面
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg font-medium transition-colors"
                >
                  <Home className="w-4 h-4" />
                  返回首页
                </button>
              </div>

              {/* 详细信息 */}
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-4 flex items-center gap-2 justify-center">
                  <Bug className="w-4 h-4" />
                  查看技术详情
                </summary>
                
                <div className="bg-[#1a1b23] rounded-lg p-4 text-sm">
                  <div className="mb-4">
                    <div className="text-red-400 font-medium mb-2">错误消息:</div>
                    <div className="font-mono text-gray-300 bg-red-500/10 p-2 rounded border-l-4 border-red-500">
                      {this.state.error?.message || 'Unknown error'}
                    </div>
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                    <div className="mb-4">
                      <div className="text-orange-400 font-medium mb-2">错误堆栈:</div>
                      <pre className="font-mono text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                    <div className="text-xs text-gray-500">
                      时间: {new Date().toLocaleString()}
                    </div>
                    
                    <button
                      onClick={this.copyErrorInfo}
                      className="text-xs text-[#06b6d4] hover:text-[#0891b2] underline"
                    >
                      复制错误信息
                    </button>
                  </div>
                </div>
              </details>
            </div>

            {/* 帮助信息 */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>
                如果问题持续存在，请联系技术支持并提供上述错误ID
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

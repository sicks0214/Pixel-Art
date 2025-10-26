/**
 * 错误边界组件
 */

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/UI/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 如果有自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              出现了问题
            </h2>
            
            <p className="text-gray-600 mb-6">
              应用遇到了未预期的错误。请尝试刷新页面或联系技术支持。
            </p>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                icon={RefreshCw}
                onClick={this.handleReset}
              >
                重试
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
            </div>

            {/* 开发环境下显示错误详情 */}
            {this.state.error && (
              <details className="mt-6 text-left bg-gray-50 rounded-lg p-4">
                <summary className="font-medium text-red-600 cursor-pointer mb-2">
                  错误详情
                </summary>
                <div className="text-xs text-gray-700 font-mono">
                  <div className="mb-2">
                    <strong>错误:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>堆栈信息:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 
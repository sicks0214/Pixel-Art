import React from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import AnimatedProgress from '../UI/AnimatedProgress'
import StatusIndicator from '../UI/StatusIndicator'
import Tooltip from '../UI/Tooltip'

interface ActionButtonsProps {
  isProcessing: boolean
  hasResult: boolean
  processingProgress?: number
  onConvert: () => void
  onDownload: () => void
}

/**
 * 操作按钮组件
 * 按照截图样式实现紫色转换按钮和绿色下载按钮
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  isProcessing,
  hasResult,
  processingProgress = 0,
  onConvert,
  onDownload
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {/* 转换按钮 - 带动画进度 */}
      <div className="space-y-2">
        <Tooltip 
          content={
            <div className="text-center">
              <div>{isProcessing ? "转换正在进行中，请稍候" : "点击开始转换图片为像素画"}</div>
              {!isProcessing && <div className="text-xs opacity-70 mt-1">快捷键: Ctrl + Enter</div>}
            </div>
          }
          position="top"
        >
          <button
            data-testid="convert-button"
            onClick={onConvert}
            disabled={isProcessing}
            className={`
              w-full py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200
              flex items-center justify-center gap-2 relative overflow-hidden
              ${isProcessing 
                ? 'bg-[#6b5b95] cursor-not-allowed' 
                : 'bg-[#8b5cf6] hover:bg-[#7c3aed] hover:scale-[1.02] active:scale-[0.98]'
              }
              text-white shadow-lg hover:shadow-xl
            `}
          >
            {isProcessing ? (
              <StatusIndicator
                status="processing"
                progress={processingProgress}
                message={processingProgress < 95 ? '上传中' : '处理中'}
                size="sm"
                className="bg-transparent border-none"
              />
            ) : (
              t('colorcraft.pixelArt.convert', '转换')
            )}
          </button>
        </Tooltip>
        
        {/* 动画进度条 */}
        {isProcessing && processingProgress > 0 && (
          <AnimatedProgress
            progress={processingProgress}
            color="#8b5cf6"
            backgroundColor="#4a4d5a"
            height={4}
            showPercentage={false}
            className="opacity-80"
          />
        )}
      </div>

      {/* 下载按钮 - 带状态反馈 */}
      <Tooltip
        content={
          <div className="text-center">
            <div>
              {!hasResult 
                ? "请先转换图片" 
                : isProcessing 
                  ? "转换完成后可下载"
                  : "下载转换后的像素画"
              }
            </div>
            {hasResult && !isProcessing && (
              <div className="text-xs opacity-70 mt-1">快捷键: Ctrl + S</div>
            )}
          </div>
        }
        position="top"
      >
        <button
          data-testid="download-button"
          onClick={onDownload}
          disabled={!hasResult || isProcessing}
          className={`
            w-full py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200
            flex items-center justify-center gap-2 shadow-lg
            ${!hasResult || isProcessing
              ? 'bg-[#6b7280] text-gray-400 cursor-not-allowed opacity-50'
              : 'bg-[#10b981] hover:bg-[#059669] text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl'
            }
          `}
        >
          <Download className={`w-4 h-4 ${hasResult && !isProcessing ? 'animate-bounce' : ''}`} />
          {t('colorcraft.pixelArt.download', '下载像素艺术')}
          {hasResult && !isProcessing && (
            <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
          )}
        </button>
      </Tooltip>

      {/* 状态指示器 */}
      {hasResult && !isProcessing && (
        <div className="flex justify-center">
          <StatusIndicator
            status="success"
            message={t('colorcraft.pixelArt.conversionComplete', '转换完成')}
            size="sm"
            showProgress={false}
            className="animate-in slide-in-from-bottom-2 duration-300"
          />
        </div>
      )}

      {/* 操作提示 */}
      {!hasResult && !isProcessing && (
        <div className="text-center">
          <p className="text-xs text-gray-400 opacity-60">
            选择图片并调整参数后点击转换
          </p>
        </div>
      )}
    </div>
  )
}

export default ActionButtons

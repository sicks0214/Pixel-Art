/**
 * 像素画转换错误处理和日志系统
 * 提供统一的错误处理、日志记录和监控功能
 */

import * as fs from 'fs'
import * as path from 'path'

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  FILE_ERROR = 'FILE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// 日志级别枚举
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// 错误详情接口
export interface ErrorDetails {
  type: ErrorType
  code: string
  message: string
  originalError?: Error
  context?: Record<string, any>
  timestamp?: Date
  userId?: string
  requestId?: string
}

// 日志条目接口
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  component: string
  details?: Record<string, any>
  error?: ErrorDetails
}

/**
 * 像素画专用错误类
 */
export class PixelArtError extends Error {
  public readonly type: ErrorType
  public readonly code: string
  public readonly context: Record<string, any>
  public readonly timestamp: Date
  public readonly originalError?: Error

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'PixelArtError'
    this.type = details.type
    this.code = details.code
    this.context = details.context || {}
    this.timestamp = details.timestamp || new Date()
    this.originalError = details.originalError
  }

  /**
   * 转换为可序列化的对象
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    }
  }
}

/**
 * 错误分析器
 */
export class ErrorAnalyzer {
  /**
   * 分析错误并提供建议
   */
  static analyzeError(error: Error): {
    category: ErrorType
    severity: 'low' | 'medium' | 'high' | 'critical'
    suggestions: string[]
    recoverable: boolean
  } {
    const message = error.message.toLowerCase()
    
    // 内存相关错误
    if (message.includes('memory') || message.includes('heap') || message.includes('allocation')) {
      return {
        category: ErrorType.MEMORY_ERROR,
        severity: 'high',
        suggestions: [
          '启用分块处理模式',
          '减少图像尺寸',
          '降低颜色数量',
          '清理内存缓存'
        ],
        recoverable: true
      }
    }
    
    // 文件相关错误
    if (message.includes('file') || message.includes('buffer') || message.includes('read') || message.includes('write')) {
      return {
        category: ErrorType.FILE_ERROR,
        severity: 'medium',
        suggestions: [
          '检查文件格式是否支持',
          '验证文件完整性',
          '检查文件大小限制',
          '确认文件权限'
        ],
        recoverable: true
      }
    }
    
    // 图像处理错误
    if (message.includes('sharp') || message.includes('resize') || message.includes('quantiz') || message.includes('dither')) {
      return {
        category: ErrorType.PROCESSING_ERROR,
        severity: 'medium',
        suggestions: [
          '尝试不同的插值方法',
          '调整处理参数',
          '使用备用处理算法',
          '检查图像数据完整性'
        ],
        recoverable: true
      }
    }
    
    // 验证错误
    if (message.includes('validation') || message.includes('invalid') || message.includes('parameter')) {
      return {
        category: ErrorType.VALIDATION_ERROR,
        severity: 'low',
        suggestions: [
          '检查输入参数范围',
          '验证必需参数',
          '使用默认参数重试',
          '查看API文档'
        ],
        recoverable: true
      }
    }
    
    // 系统错误
    return {
      category: ErrorType.SYSTEM_ERROR,
      severity: 'high',
      suggestions: [
        '重试操作',
        '检查系统资源',
        '联系技术支持',
        '查看系统日志'
      ],
      recoverable: false
    }
  }

  /**
   * 生成用户友好的错误消息
   */
  static generateUserFriendlyMessage(error: PixelArtError): string {
    const analysis = this.analyzeError(error)
    
    const baseMessages = {
      [ErrorType.VALIDATION_ERROR]: '输入参数有误',
      [ErrorType.PROCESSING_ERROR]: '图像处理失败',
      [ErrorType.MEMORY_ERROR]: '内存不足',
      [ErrorType.FILE_ERROR]: '文件处理失败',
      [ErrorType.NETWORK_ERROR]: '网络连接问题',
      [ErrorType.SYSTEM_ERROR]: '系统错误'
    }
    
    const baseMessage = baseMessages[error.type] || '未知错误'
    const suggestion = analysis.suggestions[0] || '请稍后重试'
    
    return `${baseMessage}，建议：${suggestion}`
  }
}

/**
 * 日志管理器
 */
export class LogManager {
  private static instance: LogManager
  private currentLogLevel: LogLevel = LogLevel.INFO
  private logDirectory: string = 'logs'
  private maxLogFileSize: number = 10 * 1024 * 1024 // 10MB
  private maxLogFiles: number = 5

  private constructor() {
    this.ensureLogDirectory()
  }

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager()
    }
    return LogManager.instance
  }

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level
    this.info('LogManager', `日志级别设置为: ${LogLevel[level]}`)
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true })
    }
  }

  /**
   * 获取日志文件路径
   */
  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0]
    return path.join(this.logDirectory, `pixel-art-${date}.log`)
  }

  /**
   * 写入日志文件
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify({
        timestamp: entry.timestamp.toISOString(),
        level: LogLevel[entry.level],
        component: entry.component,
        message: entry.message,
        details: entry.details,
        error: entry.error
      }) + '\n'
      
      const filePath = this.getLogFilePath()
      
      // 检查文件大小并轮转
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        if (stats.size > this.maxLogFileSize) {
          await this.rotateLogFile(filePath)
        }
      }
      
      fs.appendFileSync(filePath, logLine)
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  /**
   * 轮转日志文件
   */
  private async rotateLogFile(currentPath: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const rotatedPath = currentPath.replace('.log', `-${timestamp}.log`)
      
      fs.renameSync(currentPath, rotatedPath)
      
      // 清理旧日志文件
      await this.cleanOldLogFiles()
    } catch (error) {
      console.error('轮转日志文件失败:', error)
    }
  }

  /**
   * 清理旧日志文件
   */
  private async cleanOldLogFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.logDirectory)
        .filter(file => file.startsWith('pixel-art-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDirectory, file),
          mtime: fs.statSync(path.join(this.logDirectory, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      
      // 保留最新的文件，删除多余的
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles)
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path)
        }
      }
    } catch (error) {
      console.error('清理日志文件失败:', error)
    }
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, component: string, message: string, details?: Record<string, any>, error?: ErrorDetails): void {
    if (level < this.currentLogLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      component,
      details,
      error
    }

    // 控制台输出
    const levelName = LogLevel[level]
    const timestamp = entry.timestamp.toISOString()
    const logMessage = `[${timestamp}] [${levelName}] [${component}] ${message}`
    
    if (level >= LogLevel.ERROR) {
      console.error(logMessage, details, error)
    } else if (level >= LogLevel.WARN) {
      console.warn(logMessage, details)
    } else {
      console.log(logMessage, details)
    }

    // 写入文件（异步）
    this.writeToFile(entry).catch(err => {
      console.error('写入日志失败:', err)
    })
  }

  // 便捷方法
  debug(component: string, message: string, details?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, component, message, details)
  }

  info(component: string, message: string, details?: Record<string, any>): void {
    this.log(LogLevel.INFO, component, message, details)
  }

  warn(component: string, message: string, details?: Record<string, any>): void {
    this.log(LogLevel.WARN, component, message, details)
  }

  error(component: string, message: string, error?: Error | ErrorDetails, details?: Record<string, any>): void {
    let errorDetails: ErrorDetails | undefined
    
    if (error instanceof PixelArtError) {
      errorDetails = {
        type: error.type,
        code: error.code,
        message: error.message,
        context: error.context,
        timestamp: error.timestamp,
        originalError: error.originalError
      }
    } else if (error instanceof Error) {
      const analysis = ErrorAnalyzer.analyzeError(error)
      errorDetails = {
        type: analysis.category,
        code: 'UNKNOWN',
        message: error.message,
        originalError: error,
        timestamp: new Date()
      }
    } else if (error && typeof error === 'object') {
      errorDetails = error as ErrorDetails
    }
    
    this.log(LogLevel.ERROR, component, message, details, errorDetails)
  }

  fatal(component: string, message: string, error?: Error | ErrorDetails, details?: Record<string, any>): void {
    this.error(component, `FATAL: ${message}`, error, details)
  }
}

/**
 * 错误恢复管理器
 */
export class ErrorRecoveryManager {
  private retryAttempts: Map<string, number> = new Map()
  private maxRetries: number = 3
  private backoffMultiplier: number = 2
  private baseDelayMs: number = 1000

  /**
   * 尝试恢复操作
   */
  async attemptRecovery<T>(
    operationId: string,
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    const logger = LogManager.getInstance()
    const attempts = this.retryAttempts.get(operationId) || 0

    try {
      logger.debug('ErrorRecovery', `尝试操作: ${operationId}, 第${attempts + 1}次`)
      const result = await operation()
      
      // 成功后清除重试计数
      this.retryAttempts.delete(operationId)
      return result
      
    } catch (error) {
      logger.error('ErrorRecovery', `操作失败: ${operationId}`, error as Error)
      
      const pixelArtError = error instanceof PixelArtError ? error : new PixelArtError({
        type: ErrorType.PROCESSING_ERROR,
        code: 'RECOVERY_ATTEMPT',
        message: `操作 ${operationId} 失败`,
        originalError: error as Error
      })
      
      const analysis = ErrorAnalyzer.analyzeError(pixelArtError)
      
      if (attempts < this.maxRetries && analysis.recoverable) {
        // 指数退避重试
        const delay = this.baseDelayMs * Math.pow(this.backoffMultiplier, attempts)
        logger.info('ErrorRecovery', `${delay}ms后重试操作: ${operationId}`)
        
        this.retryAttempts.set(operationId, attempts + 1)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.attemptRecovery(operationId, operation, fallbackOperation)
        
      } else if (fallbackOperation) {
        logger.info('ErrorRecovery', `使用备用方案: ${operationId}`)
        
        try {
          const fallbackResult = await fallbackOperation()
          this.retryAttempts.delete(operationId)
          return fallbackResult
        } catch (fallbackError) {
          logger.error('ErrorRecovery', `备用方案失败: ${operationId}`, fallbackError as Error)
          throw new PixelArtError({
            type: ErrorType.SYSTEM_ERROR,
            code: 'RECOVERY_FAILED',
            message: `操作和备用方案都失败: ${operationId}`,
            originalError: fallbackError as Error,
            context: { originalError: pixelArtError.message }
          })
        }
        
      } else {
        logger.fatal('ErrorRecovery', `无法恢复操作: ${operationId}`, pixelArtError)
        this.retryAttempts.delete(operationId)
        throw pixelArtError
      }
    }
  }

  /**
   * 重置特定操作的重试计数
   */
  resetRetryCount(operationId: string): void {
    this.retryAttempts.delete(operationId)
  }

  /**
   * 清除所有重试计数
   */
  clearAllRetries(): void {
    this.retryAttempts.clear()
  }
}

// 导出单例实例
export const logger = LogManager.getInstance()
export const errorRecovery = new ErrorRecoveryManager()

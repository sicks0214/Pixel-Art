/**
 * 像素画转换安全中间件
 * 提供请求限制、安全检查和防护机制
 */

import { Request, Response, NextFunction } from 'express'
import { logger, PixelArtError, ErrorType } from './errorHandler'

// 请求限制配置
interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求次数
  maxFileSize: number // 单个文件最大大小
  maxConcurrentRequests: number // 最大并发请求数
}

// 客户端请求统计
interface ClientStats {
  requests: number[]
  concurrentRequests: number
  totalDataProcessed: number
  firstRequest: number
  lastRequest: number
  blocked: boolean
  blockUntil?: number
}

/**
 * 速率限制和安全检查中间件
 */
export class SecurityMiddleware {
  private clientStats: Map<string, ClientStats> = new Map()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 15 * 60 * 1000, // 15分钟
      maxRequests: config.maxRequests || 50, // 15分钟内最多50次请求
      maxFileSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
      maxConcurrentRequests: config.maxConcurrentRequests || 5 // 同时最多5个请求
    }

    // 定期清理过期的客户端统计
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredStats()
    }, this.config.windowMs)

    logger.info('SecurityMiddleware', '安全中间件初始化', {
      windowMs: this.config.windowMs,
      maxRequests: this.config.maxRequests,
      maxConcurrentRequests: this.config.maxConcurrentRequests
    })
  }

  /**
   * 获取客户端标识
   */
  private getClientId(req: Request): string {
    // 优先使用 X-Forwarded-For，然后是 req.ip
    const forwarded = req.get('X-Forwarded-For')
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    
    // 考虑用户代理以区分不同的客户端
    const userAgent = req.get('User-Agent') || 'unknown'
    const userAgentHash = this.simpleHash(userAgent)
    
    return `${ip}:${userAgentHash}`
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16).substring(0, 8)
  }

  /**
   * 获取或创建客户端统计
   */
  private getClientStats(clientId: string): ClientStats {
    if (!this.clientStats.has(clientId)) {
      this.clientStats.set(clientId, {
        requests: [],
        concurrentRequests: 0,
        totalDataProcessed: 0,
        firstRequest: Date.now(),
        lastRequest: Date.now(),
        blocked: false
      })
    }
    return this.clientStats.get(clientId)!
  }

  /**
   * 速率限制检查
   */
  rateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req)
    const now = Date.now()
    const stats = this.getClientStats(clientId)

    logger.debug('SecurityMiddleware', '检查速率限制', {
      clientId,
      currentRequests: stats.requests.length,
      concurrentRequests: stats.concurrentRequests
    })

    try {
      // 检查是否被阻止
      if (stats.blocked && stats.blockUntil && now < stats.blockUntil) {
        const remainingTime = Math.ceil((stats.blockUntil - now) / 1000)
        
        logger.warn('SecurityMiddleware', '客户端被阻止', {
          clientId,
          remainingTime: `${remainingTime}秒`
        })

        return res.status(429).json({
          success: false,
          error: `请求过于频繁，请在${remainingTime}秒后重试`,
          code: 'RATE_LIMITED',
          retryAfter: remainingTime
        })
      }

      // 清理过期的请求记录
      const windowStart = now - this.config.windowMs
      stats.requests = stats.requests.filter(timestamp => timestamp > windowStart)

      // 检查请求频率
      if (stats.requests.length >= this.config.maxRequests) {
        // 触发速率限制
        stats.blocked = true
        stats.blockUntil = now + this.config.windowMs // 阻止一个时间窗口
        
        logger.warn('SecurityMiddleware', '触发速率限制', {
          clientId,
          requestsInWindow: stats.requests.length,
          maxAllowed: this.config.maxRequests
        })

        return res.status(429).json({
          success: false,
          error: `请求频率过高，已达到限制（${this.config.maxRequests}次/${this.config.windowMs / 1000 / 60}分钟）`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil(this.config.windowMs / 1000)
        })
      }

      // 检查并发请求数
      if (stats.concurrentRequests >= this.config.maxConcurrentRequests) {
        logger.warn('SecurityMiddleware', '并发请求过多', {
          clientId,
          concurrentRequests: stats.concurrentRequests,
          maxAllowed: this.config.maxConcurrentRequests
        })

        return res.status(429).json({
          success: false,
          error: `并发请求过多，最大允许${this.config.maxConcurrentRequests}个并发请求`,
          code: 'CONCURRENT_LIMIT_EXCEEDED'
        })
      }

      // 记录请求
      stats.requests.push(now)
      stats.lastRequest = now
      stats.concurrentRequests++

      // 请求结束时减少并发计数
      const originalSend = res.send
      res.send = function(data) {
        stats.concurrentRequests = Math.max(0, stats.concurrentRequests - 1)
        return originalSend.call(this, data)
      }

      // 如果响应被提前结束也要清理计数
      res.on('close', () => {
        stats.concurrentRequests = Math.max(0, stats.concurrentRequests - 1)
      })

      logger.debug('SecurityMiddleware', '速率限制检查通过', {
        clientId,
        requestsInWindow: stats.requests.length,
        concurrentRequests: stats.concurrentRequests
      })

      next()

    } catch (error) {
      logger.error('SecurityMiddleware', '速率限制中间件错误', error as Error)
      stats.concurrentRequests = Math.max(0, stats.concurrentRequests - 1)
      
      res.status(500).json({
        success: false,
        error: '安全检查失败',
        code: 'SECURITY_CHECK_ERROR'
      })
    }
  }

  /**
   * 文件大小限制检查
   */
  fileSizeLimit = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next()
    }

    const clientId = this.getClientId(req)
    const stats = this.getClientStats(clientId)

    logger.debug('SecurityMiddleware', '检查文件大小', {
      clientId,
      fileSize: req.file.size,
      maxSize: this.config.maxFileSize
    })

    if (req.file.size > this.config.maxFileSize) {
      logger.warn('SecurityMiddleware', '文件大小超限', {
        clientId,
        fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(this.config.maxFileSize / 1024 / 1024)}MB`,
        filename: req.file.originalname
      })

      return res.status(413).json({
        success: false,
        error: `文件大小超过限制（${(this.config.maxFileSize / 1024 / 1024)}MB）`,
        code: 'FILE_TOO_LARGE'
      })
    }

    // 记录处理的数据量
    stats.totalDataProcessed += req.file.size

    // 如果单个客户端处理的数据量过大，可能需要额外限制
    const hourlyDataLimit = 500 * 1024 * 1024 // 1小时内500MB
    const hourStart = Date.now() - (60 * 60 * 1000)
    
    if (stats.firstRequest > hourStart && stats.totalDataProcessed > hourlyDataLimit) {
      logger.warn('SecurityMiddleware', '客户端数据处理量过大', {
        clientId,
        totalProcessed: `${(stats.totalDataProcessed / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(hourlyDataLimit / 1024 / 1024)}MB`
      })

      return res.status(429).json({
        success: false,
        error: '数据处理量超过限制，请稍后重试',
        code: 'DATA_LIMIT_EXCEEDED'
      })
    }

    next()
  }

  /**
   * 可疑请求检测
   */
  suspiciousRequestDetection = (req: Request, res: Response, next: NextFunction) => {
    const clientId = this.getClientId(req)
    const userAgent = req.get('User-Agent') || ''
    const referer = req.get('Referer') || ''

    logger.debug('SecurityMiddleware', '检测可疑请求', {
      clientId,
      userAgent: userAgent.substring(0, 100),
      hasReferer: !!referer
    })

    const suspiciousPatterns = [
      'bot', 'crawler', 'spider', 'scraper',
      'wget', 'curl', 'python', 'perl',
      'scanner', 'vulnerability', 'exploit'
    ]

    const isSuspicious = suspiciousPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern)
    )

    if (isSuspicious) {
      logger.warn('SecurityMiddleware', '检测到可疑请求', {
        clientId,
        userAgent,
        ip: req.ip
      })

      // 对可疑请求应用更严格的限制
      const stats = this.getClientStats(clientId)
      if (stats.requests.length > 5) { // 可疑客户端降低限制
        return res.status(429).json({
          success: false,
          error: '请求被拒绝',
          code: 'SUSPICIOUS_REQUEST'
        })
      }
    }

    // 检查缺少常见浏览器头部的请求
    const hasCommonHeaders = !!(
      req.get('Accept') &&
      req.get('Accept-Language') &&
      req.get('User-Agent')
    )

    if (!hasCommonHeaders) {
      logger.info('SecurityMiddleware', '缺少常见HTTP头部', {
        clientId,
        headers: {
          accept: req.get('Accept'),
          acceptLanguage: req.get('Accept-Language'),
          userAgent: req.get('User-Agent')
        }
      })
    }

    next()
  }

  /**
   * 健康检查豁免中间件
   */
  healthCheckExemption = (req: Request, res: Response, next: NextFunction) => {
    // 健康检查请求豁免安全检查
    if (req.path === '/health' || req.path.endsWith('/health')) {
      return next()
    }

    // 应用安全检查
    this.rateLimiter(req, res, () => {
      this.fileSizeLimit(req, res, () => {
        this.suspiciousRequestDetection(req, res, next)
      })
    })
  }

  /**
   * 清理过期的客户端统计
   */
  private cleanupExpiredStats(): void {
    const now = Date.now()
    const expireTime = this.config.windowMs * 2 // 保留2个时间窗口的数据

    for (const [clientId, stats] of this.clientStats) {
      if (now - stats.lastRequest > expireTime && stats.concurrentRequests === 0) {
        this.clientStats.delete(clientId)
        logger.debug('SecurityMiddleware', '清理过期客户端统计', { clientId })
      }
    }

    logger.debug('SecurityMiddleware', '统计清理完成', {
      activeClients: this.clientStats.size
    })
  }

  /**
   * 获取安全统计信息
   */
  getSecurityStats(): {
    activeClients: number
    totalRequests: number
    blockedClients: number
    averageRequestsPerClient: number
  } {
    let totalRequests = 0
    let blockedClients = 0

    for (const [clientId, stats] of this.clientStats) {
      totalRequests += stats.requests.length
      if (stats.blocked) {
        blockedClients++
      }
    }

    return {
      activeClients: this.clientStats.size,
      totalRequests,
      blockedClients,
      averageRequestsPerClient: this.clientStats.size > 0 
        ? Math.round(totalRequests / this.clientStats.size) 
        : 0
    }
  }

  /**
   * 手动解除客户端阻止
   */
  unblockClient(clientId: string): boolean {
    const stats = this.clientStats.get(clientId)
    if (stats && stats.blocked) {
      stats.blocked = false
      delete stats.blockUntil
      stats.requests = [] // 清空请求历史
      
      logger.info('SecurityMiddleware', '手动解除客户端阻止', { clientId })
      return true
    }
    return false
  }

  /**
   * 销毁安全中间件
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clientStats.clear()
    
    logger.info('SecurityMiddleware', '安全中间件已销毁')
  }
}

// 创建默认的安全中间件实例
export const defaultSecurityMiddleware = new SecurityMiddleware()

/**
 * 综合安全中间件函数
 */
export function pixelArtSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  defaultSecurityMiddleware.healthCheckExemption(req, res, next)
}

/**
 * 请求上下文中间件 - 添加请求ID和时间戳
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
  // 添加请求ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  req.requestId = requestId
  
  // 添加开始时间
  req.startTime = Date.now()
  
  // 设置响应头
  res.set('X-Request-ID', requestId)
  
  logger.debug('RequestContext', '请求开始', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // 拦截响应以记录结束时间
  const originalSend = res.send
  res.send = function(data) {
    const endTime = Date.now()
    const duration = endTime - req.startTime!
    
    logger.info('RequestContext', '请求完成', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: Buffer.isBuffer(data) ? data.length : String(data).length
    })

    return originalSend.call(this, data)
  }

  next()
}

// 扩展Express Request接口
declare global {
  namespace Express {
    interface Request {
      requestId?: string
      startTime?: number
    }
  }
}

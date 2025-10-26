/**
 * 缓存中间件
 * 为像素画转换API提供自动缓存功能
 */

import { Request, Response, NextFunction } from 'express'
import { getPixelArtCacheManager } from '../services/cache/pixelArtCache'
import { logger } from '../services/pixelArt/errorHandler'

// 扩展Request接口以包含缓存信息
declare global {
  namespace Express {
    interface Request {
      cacheKey?: string
      imageHash?: string
      cacheEnabled?: boolean
      cacheHit?: boolean
    }
  }
}

/**
 * 缓存检查中间件
 * 在处理请求前检查缓存
 */
export const cacheCheckMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const cacheManager = getPixelArtCacheManager()
    
    // 检查缓存是否可用
    if (!cacheManager.isAvailable()) {
      req.cacheEnabled = false
      return next()
    }

    // 只对POST /pixel-art/convert请求启用缓存
    if (req.method !== 'POST' || !req.path.includes('pixel-art/convert')) {
      req.cacheEnabled = false
      return next()
    }

    // 检查是否有上传的文件
    if (!req.file || !req.file.buffer) {
      req.cacheEnabled = false
      return next()
    }

    // 生成图像哈希
    req.imageHash = cacheManager.generateImageHash(req.file.buffer)
    
    // 生成缓存键
    const params = {
      resizeFactor: parseFloat(req.body.resizeFactor),
      interpolation: req.body.interpolation,
      colorMode: req.body.colorMode,
      ditheringRatio: parseFloat(req.body.ditheringRatio),
      quality: req.query.quality as string || 'balanced'
    }

    req.cacheKey = cacheManager.generateCacheKey(req.imageHash, params)
    req.cacheEnabled = true

    logger.debug('CacheMiddleware', '缓存键已生成', {
      cacheKey: req.cacheKey,
      imageHash: req.imageHash.substring(0, 8) + '...',
      params
    })

    // 尝试从缓存获取结果
    const cachedResult = await cacheManager.get(req.cacheKey)
    
    if (cachedResult) {
      req.cacheHit = true
      
      logger.info('CacheMiddleware', '缓存命中，直接返回结果', {
        cacheKey: req.cacheKey,
        requestId: req.headers['x-request-id'] || 'unknown'
      })

      // 添加缓存标识头
      res.set('X-Cache-Status', 'HIT')
      res.set('X-Cache-Key', req.cacheKey.substring(0, 16) + '...')

      // 直接返回缓存结果
      return res.status(200).json({
        success: true,
        data: {
          ...cachedResult,
          cached: true,
          cacheHit: true
        }
      })
    }

    req.cacheHit = false
    res.set('X-Cache-Status', 'MISS')
    next()

  } catch (error) {
    logger.error('CacheMiddleware', '缓存检查中间件出错', error as Error)
    
    // 缓存出错时不影响正常流程
    req.cacheEnabled = false
    req.cacheHit = false
    next()
  }
}

/**
 * 缓存存储中间件
 * 在处理完成后存储结果到缓存
 */
export const cacheStoreMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  // 保存原始的res.json方法
  const originalJson = res.json

  // 重写res.json方法以拦截响应
  res.json = function(data: any) {
    // 异步处理缓存存储，不阻塞响应
    if (req.cacheEnabled && req.cacheKey && !req.cacheHit) {
      processCacheStorage(req, data).catch(error => {
        logger.error('CacheMiddleware', '异步缓存存储失败', error)
      })
    }

    // 调用原始的json方法
    return originalJson.call(this, data)
  }

  next()
}

/**
 * 异步处理缓存存储
 */
async function processCacheStorage(req: Request, responseData: any): Promise<void> {
  try {
    // 只缓存成功的响应
    if (!responseData.success || !responseData.data) {
      return
    }

    const cacheManager = getPixelArtCacheManager()
    
    // 检查响应数据大小
    const dataSize = Buffer.byteLength(JSON.stringify(responseData.data), 'utf8')
    const maxSize = cacheManager.getConfig().maxImageSize
    
    if (dataSize > maxSize) {
      logger.warn('CacheMiddleware', '响应数据过大，跳过缓存', {
        cacheKey: req.cacheKey,
        dataSize: `${(dataSize / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${(maxSize / 1024 / 1024).toFixed(2)}MB`
      })
      return
    }

    // 计算TTL（基于处理复杂度）
    const processingTime = responseData.data.processingTime || 0
    const complexity = calculateComplexity(req.body, responseData.data)
    const ttl = calculateTTL(processingTime, complexity)

    // 存储到缓存
    const stored = await cacheManager.set(
      req.cacheKey!,
      responseData.data,
      {
        ttl,
        metadata: {
          imageHash: req.imageHash,
          processingTime,
          complexity,
          createdAt: new Date().toISOString(),
          params: {
            resizeFactor: req.body.resizeFactor,
            interpolation: req.body.interpolation,
            colorMode: req.body.colorMode,
            ditheringRatio: req.body.ditheringRatio,
            quality: req.query.quality
          }
        }
      }
    )

    if (stored) {
      logger.info('CacheMiddleware', '结果已缓存', {
        cacheKey: req.cacheKey,
        ttl: `${ttl}s`,
        dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
        complexity,
        processingTime: `${processingTime}ms`
      })
    }

  } catch (error) {
    logger.error('CacheMiddleware', '缓存存储处理失败', error as Error)
  }
}

/**
 * 计算处理复杂度
 */
function calculateComplexity(params: any, result: any): 'low' | 'medium' | 'high' {
  let score = 0
  
  // 基于参数的复杂度
  if (params.resizeFactor > 50) score += 2
  if (params.interpolation === 'bilinear') score += 1
  if (params.colorMode === 'ordered_dithering_bayer') score += 2
  if (params.ditheringRatio > 2.0) score += 1
  
  // 基于结果的复杂度
  if (result.canvasInfo && result.canvasInfo.width * result.canvasInfo.height > 10000) score += 2
  if (result.extractedColors && result.extractedColors.length > 32) score += 1
  if (result.processingTime > 5000) score += 2
  
  if (score <= 3) return 'low'
  if (score <= 6) return 'medium'
  return 'high'
}

/**
 * 计算TTL（生存时间）
 */
function calculateTTL(processingTime: number, complexity: 'low' | 'medium' | 'high'): number {
  const baseTTL = 3600 // 1小时
  
  // 基于处理时间调整TTL（处理时间越长，缓存时间越长）
  let timeFactor = 1
  if (processingTime > 10000) timeFactor = 2 // 超过10秒
  else if (processingTime > 5000) timeFactor = 1.5 // 超过5秒
  
  // 基于复杂度调整TTL
  const complexityFactor = {
    low: 0.5,    // 简单处理缓存30分钟
    medium: 1,   // 中等处理缓存1小时
    high: 2      // 复杂处理缓存2小时
  }[complexity]
  
  return Math.round(baseTTL * timeFactor * complexityFactor)
}

/**
 * 缓存统计中间件
 * 添加缓存统计信息到响应头
 */
export const cacheStatsMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const cacheManager = getPixelArtCacheManager()
    
    if (cacheManager.isAvailable()) {
      const stats = await cacheManager.getStats()
      
      res.set('X-Cache-Hit-Rate', `${stats.hitRate.toFixed(2)}%`)
      res.set('X-Cache-Total-Keys', stats.totalKeys.toString())
      
      // 如果是健康检查请求，添加详细的缓存信息
      if (req.path.includes('health')) {
        res.locals.cacheStats = stats
      }
    }
    
    next()
  } catch (error) {
    logger.error('CacheMiddleware', '缓存统计中间件出错', error as Error)
    next() // 不影响正常流程
  }
}

/**
 * 缓存清理中间件（管理端点使用）
 */
export const cacheClearMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (req.path !== '/cache/clear' || req.method !== 'POST') {
      return next()
    }

    const cacheManager = getPixelArtCacheManager()
    
    if (!cacheManager.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: '缓存服务不可用'
      })
    }

    const cleared = await cacheManager.clear()
    
    if (cleared) {
      logger.info('CacheMiddleware', '缓存已通过API清空')
      
      res.status(200).json({
        success: true,
        message: '缓存已清空',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(500).json({
        success: false,
        error: '清空缓存失败'
      })
    }

  } catch (error) {
    logger.error('CacheMiddleware', '缓存清理中间件出错', error as Error)
    
    res.status(500).json({
      success: false,
      error: '清空缓存时发生错误'
    })
  }
}

/**
 * 组合缓存中间件
 * 按正确顺序应用所有缓存中间件
 */
export const applyCacheMiddleware = [
  cacheStatsMiddleware,
  cacheCheckMiddleware,
  cacheStoreMiddleware
]


/**
 * 像素画缓存服务
 * 实现智能缓存策略和键管理
 */

import crypto from 'crypto'
import { getRedisClient, isRedisConnected } from './redisClient'
import { logger } from '../pixelArt/errorHandler'

// 缓存配置
interface CacheConfig {
  enabled: boolean
  defaultTTL: number // 默认过期时间（秒）
  maxImageSize: number // 最大缓存图像大小（字节）
  keyPrefix: string
  compressionEnabled: boolean
}

// 缓存项结构
interface CacheItem<T> {
  data: T
  createdAt: number
  expiresAt: number
  size: number
  hits: number
  metadata?: Record<string, any>
}

// 缓存统计
interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  lastResetAt: number
}

/**
 * 像素画缓存管理器
 */
export class PixelArtCacheManager {
  private config: CacheConfig
  private stats: CacheStats
  private isEnabled: boolean

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: process.env.CACHE_ENABLED !== 'false',
      defaultTTL: parseInt(process.env.CACHE_TTL || '3600'), // 1小时
      maxImageSize: parseInt(process.env.CACHE_MAX_IMAGE_SIZE || '5242880'), // 5MB
      keyPrefix: 'pixelart:',
      compressionEnabled: process.env.CACHE_COMPRESSION !== 'false',
      ...config
    }

    this.stats = {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      lastResetAt: Date.now()
    }

    this.isEnabled = this.config.enabled && isRedisConnected()
    
    if (!this.isEnabled) {
      logger.warn('PixelArtCache', '缓存已禁用或Redis未连接')
    } else {
      logger.info('PixelArtCache', '缓存管理器已初始化', {
        ttl: this.config.defaultTTL,
        maxSize: `${(this.config.maxImageSize / 1024 / 1024).toFixed(2)}MB`,
        compression: this.config.compressionEnabled
      })
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(
    imageHash: string,
    params: {
      resizeFactor: number
      interpolation: string
      colorMode: string
      ditheringRatio: number
      quality?: string
    }
  ): string {
    // 创建参数的哈希
    const paramString = [
      imageHash,
      params.resizeFactor,
      params.interpolation,
      params.colorMode,
      params.ditheringRatio,
      params.quality || 'balanced'
    ].join('|')

    const paramHash = crypto
      .createHash('sha256')
      .update(paramString)
      .digest('hex')
      .substring(0, 16)

    return `${this.config.keyPrefix}convert:${paramHash}`
  }

  /**
   * 生成图像哈希
   */
  generateImageHash(imageBuffer: Buffer): string {
    return crypto
      .createHash('md5')
      .update(imageBuffer)
      .digest('hex')
  }

  /**
   * 检查缓存是否可用
   */
  isAvailable(): boolean {
    return this.isEnabled && isRedisConnected()
  }

  /**
   * 获取缓存项
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return null
      }

      const startTime = Date.now()
      const cachedData = await client.get(key)

      if (!cachedData) {
        this.stats.totalMisses++
        this.updateHitRate()
        logger.debug('PixelArtCache', '缓存未命中', { key })
        return null
      }

      // 解析缓存数据
      const cacheItem: CacheItem<T> = JSON.parse(cachedData)
      
      // 检查是否过期
      if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
        logger.debug('PixelArtCache', '缓存已过期', { key, expiresAt: new Date(cacheItem.expiresAt) })
        await this.delete(key)
        this.stats.totalMisses++
        this.updateHitRate()
        return null
      }

      // 更新命中统计
      cacheItem.hits++
      this.stats.totalHits++
      this.updateHitRate()

      const responseTime = Date.now() - startTime
      
      logger.info('PixelArtCache', '缓存命中', {
        key,
        size: `${(cacheItem.size / 1024).toFixed(2)}KB`,
        age: `${Math.round((Date.now() - cacheItem.createdAt) / 1000)}s`,
        hits: cacheItem.hits,
        responseTime: `${responseTime}ms`
      })

      // 异步更新命中计数
      this.updateCacheItemHits(key, cacheItem).catch(error => {
        logger.warn('PixelArtCache', '更新命中计数失败', error)
      })

      return cacheItem.data
    } catch (error) {
      logger.error('PixelArtCache', '获取缓存失败', error as Error, { key })
      this.stats.totalMisses++
      this.updateHitRate()
      return null
    }
  }

  /**
   * 设置缓存项
   */
  async set<T>(
    key: string, 
    data: T, 
    options?: {
      ttl?: number
      metadata?: Record<string, any>
    }
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return false
      }

      const ttl = options?.ttl || this.config.defaultTTL
      const dataString = JSON.stringify(data)
      const size = Buffer.byteLength(dataString, 'utf8')

      // 检查大小限制
      if (size > this.config.maxImageSize) {
        logger.warn('PixelArtCache', '数据过大，跳过缓存', {
          key,
          size: `${(size / 1024 / 1024).toFixed(2)}MB`,
          maxSize: `${(this.config.maxImageSize / 1024 / 1024).toFixed(2)}MB`
        })
        return false
      }

      const now = Date.now()
      const cacheItem: CacheItem<T> = {
        data,
        createdAt: now,
        expiresAt: now + (ttl * 1000),
        size,
        hits: 0,
        metadata: options?.metadata
      }

      const cacheValue = JSON.stringify(cacheItem)
      
      // 设置缓存，使用EX参数设置过期时间
      await client.setEx(key, ttl, cacheValue)

      logger.info('PixelArtCache', '缓存已设置', {
        key,
        size: `${(size / 1024).toFixed(2)}KB`,
        ttl: `${ttl}s`,
        expiresAt: new Date(cacheItem.expiresAt)
      })

      return true
    } catch (error) {
      logger.error('PixelArtCache', '设置缓存失败', error as Error, { key })
      return false
    }
  }

  /**
   * 删除缓存项
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return false
      }

      const result = await client.del(key)
      
      if (result > 0) {
        logger.debug('PixelArtCache', '缓存已删除', { key })
        return true
      }
      
      return false
    } catch (error) {
      logger.error('PixelArtCache', '删除缓存失败', error as Error, { key })
      return false
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return false
      }

      const result = await client.exists(key)
      return result > 0
    } catch (error) {
      logger.error('PixelArtCache', '检查缓存存在性失败', error as Error, { key })
      return false
    }
  }

  /**
   * 更新缓存项命中次数
   */
  private async updateCacheItemHits(key: string, cacheItem: CacheItem<any>): Promise<void> {
    try {
      const client = getRedisClient()
      if (!client) {
        return
      }

      const updatedCacheValue = JSON.stringify(cacheItem)
      const ttl = Math.max(1, Math.round((cacheItem.expiresAt - Date.now()) / 1000))
      
      await client.setEx(key, ttl, updatedCacheValue)
    } catch (error) {
      // 忽略更新命中计数的错误，不影响主要功能
      logger.debug('PixelArtCache', '更新命中计数时出错', error)
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<CacheStats> {
    if (!this.isAvailable()) {
      return this.stats
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return this.stats
      }

      // 获取键数量
      const keys = await client.keys(`${this.config.keyPrefix}*`)
      this.stats.totalKeys = keys.length

      // 获取内存使用情况（模拟）
      this.stats.memoryUsage = keys.length * 1024 // 假设平均每个键1KB

      return {
        ...this.stats,
        hitRate: this.calculateHitRate()
      }
    } catch (error) {
      logger.error('PixelArtCache', '获取缓存统计失败', error as Error)
      return this.stats
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return false
      }

      const keys = await client.keys(`${this.config.keyPrefix}*`)
      
      if (keys.length > 0) {
        await client.del(keys)
        logger.info('PixelArtCache', '缓存已清空', { deletedKeys: keys.length })
      }

      // 重置统计
      this.resetStats()

      return true
    } catch (error) {
      logger.error('PixelArtCache', '清空缓存失败', error as Error)
      return false
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<number> {
    if (!this.isAvailable()) {
      return 0
    }

    try {
      const client = getRedisClient()
      if (!client) {
        return 0
      }

      const keys = await client.keys(`${this.config.keyPrefix}*`)
      let cleanedCount = 0

      for (const key of keys) {
        try {
          const cachedData = await client.get(key)
          if (!cachedData) {
            continue
          }

          const cacheItem: CacheItem<any> = JSON.parse(cachedData)
          
          if (cacheItem.expiresAt && Date.now() > cacheItem.expiresAt) {
            await client.del(key)
            cleanedCount++
          }
        } catch (error) {
          // 忽略单个键的错误
          logger.debug('PixelArtCache', '清理单个缓存键时出错', { key, error })
        }
      }

      if (cleanedCount > 0) {
        logger.info('PixelArtCache', '缓存清理完成', { cleanedKeys: cleanedCount })
      }

      return cleanedCount
    } catch (error) {
      logger.error('PixelArtCache', '缓存清理失败', error as Error)
      return 0
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.calculateHitRate()
  }

  /**
   * 计算命中率
   */
  private calculateHitRate(): number {
    const total = this.stats.totalHits + this.stats.totalMisses
    return total > 0 ? (this.stats.totalHits / total) * 100 : 0
  }

  /**
   * 重置统计
   */
  private resetStats(): void {
    this.stats = {
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      lastResetAt: Date.now()
    }
  }

  /**
   * 获取缓存配置
   */
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  /**
   * 启用缓存
   */
  enable(): void {
    this.isEnabled = true
    this.config.enabled = true
    logger.info('PixelArtCache', '缓存已启用')
  }

  /**
   * 禁用缓存
   */
  disable(): void {
    this.isEnabled = false
    this.config.enabled = false
    logger.info('PixelArtCache', '缓存已禁用')
  }
}

// 全局缓存管理器实例
let pixelArtCacheManager: PixelArtCacheManager | null = null

/**
 * 获取像素画缓存管理器实例
 */
export function getPixelArtCacheManager(): PixelArtCacheManager {
  if (!pixelArtCacheManager) {
    pixelArtCacheManager = new PixelArtCacheManager()
  }
  return pixelArtCacheManager
}

/**
 * 导出缓存管理器类型
 */
export { CacheConfig, CacheItem, CacheStats }


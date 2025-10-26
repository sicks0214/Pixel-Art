/**
 * Redis客户端配置和管理
 * 提供缓存连接、配置和基础操作
 */

import { createClient, RedisClientType } from 'redis'
import { logger } from '../pixelArt/errorHandler'

// Redis配置接口
interface RedisConfig {
  url?: string
  host?: string
  port?: number
  password?: string
  db?: number
  maxRetriesPerRequest?: number
  retryDelayOnFailover?: number
  enableAutoPipelining?: boolean
  connectTimeout?: number
  lazyConnect?: boolean
}

// Redis连接状态
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

/**
 * Redis客户端管理器
 */
export class RedisClientManager {
  private client: RedisClientType | null = null
  private config: RedisConfig
  private connectionStatus: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000 // 1秒

  constructor(config?: RedisConfig) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      connectTimeout: 5000,
      lazyConnect: false,
      ...config
    }
  }

  /**
   * 初始化Redis连接 - 全局修复版本（非阻塞）
   */
  async initialize(): Promise<void> {
    try {
      if (this.client) {
        await this.disconnect()
      }

      this.connectionStatus = 'connecting'
      
      // 检查是否为开发环境，开发环境直接跳过
      const isDevelopment = process.env.NODE_ENV !== 'production' && 
                           !process.env.RAILWAY_ENVIRONMENT_NAME && 
                           !process.env.RAILWAY_PROJECT_ID
      
      if (isDevelopment && !process.env.FORCE_REDIS_IN_DEV) {
        console.log('🛠️  开发环境：跳过Redis连接，使用内存缓存')
        this.connectionStatus = 'disabled'
        return
      }

      logger.info('RedisClient', '正在连接Redis服务器', this.getConnectionInfo())

      // 创建Redis客户端配置
      const clientConfig: any = {
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: Math.min(this.config.connectTimeout, 3000), // 最大3秒超时
          lazyConnect: true, // 延迟连接，避免立即抛出错误
        },
        database: this.config.db,
      }

      if (this.config.password) {
        clientConfig.password = this.config.password
      }

      if (this.config.url) {
        this.client = createClient({ 
          url: this.config.url,
          socket: { connectTimeout: 3000 }
        })
      } else {
        this.client = createClient(clientConfig)
      }

      // 设置事件监听器（在连接前）
      this.setupEventListeners()

      // 尝试连接，但设置严格的超时限制
      const connectTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis连接超时（3秒）')), 3000)
      })
      
      await Promise.race([this.client.connect(), connectTimeout])

      this.connectionStatus = 'connected'
      this.reconnectAttempts = 0

      logger.info('RedisClient', 'Redis连接成功', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db
      })

      // 测试连接
      await this.ping()

    } catch (error) {
      this.connectionStatus = 'error'
      
      // 开发环境：静默处理错误，不重连
      const isDevelopment = process.env.NODE_ENV !== 'production'
      if (isDevelopment) {
        console.log('🛠️  开发环境：Redis连接失败，这是正常的。核心功能不受影响。')
        this.connectionStatus = 'disabled'
        return // 不抛出错误，不重连
      }
      
      logger.error('RedisClient', 'Redis连接失败', error as Error, this.getConnectionInfo())
      
      // 生产环境才尝试重连，但限制重连次数
      if (this.reconnectAttempts < 3) {
        this.scheduleReconnect()
      } else {
        console.log('🛑 Redis重连次数已达上限，停止重连尝试')
        this.connectionStatus = 'disabled'
      }
      
      throw error
    }
  }

  /**
   * 设置事件监听器 - 全局修复版本（开发环境友好）
   */
  private setupEventListeners(): void {
    if (!this.client) return

    const isDevelopment = process.env.NODE_ENV !== 'production'

    this.client.on('connect', () => {
      if (!isDevelopment) {
        logger.info('RedisClient', 'Redis客户端已连接')
      }
      this.connectionStatus = 'connected'
    })

    this.client.on('ready', () => {
      if (!isDevelopment) {
        logger.info('RedisClient', 'Redis客户端就绪')
      }
    })

    this.client.on('error', (error) => {
      if (isDevelopment) {
        // 开发环境：静默处理，避免控制台刷屏
        this.connectionStatus = 'disabled'
        return
      }
      
      logger.error('RedisClient', 'Redis客户端错误', error)
      this.connectionStatus = 'error'
    })

    this.client.on('reconnecting', () => {
      if (isDevelopment) {
        // 开发环境：阻止重连，直接禁用
        this.connectionStatus = 'disabled'
        this.client?.disconnect().catch(() => {})
        return
      }
      
      logger.warn('RedisClient', 'Redis客户端重连中')
      this.connectionStatus = 'reconnecting'
    })

    this.client.on('end', () => {
      if (!isDevelopment) {
        logger.warn('RedisClient', 'Redis连接已关闭')
      }
      this.connectionStatus = 'disconnected'
    })
  }

  /**
   * 安排重连 - 全局修复版本（开发环境禁用）
   */
  private scheduleReconnect(): void {
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    // 开发环境：完全禁用重连
    if (isDevelopment) {
      console.log('🛠️  开发环境：Redis重连已禁用')
      this.connectionStatus = 'disabled'
      return
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('RedisClient', '达到最大重连次数，停止重连')
      this.connectionStatus = 'disabled'
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // 指数退避

    logger.info('RedisClient', `${delay}ms后进行第${this.reconnectAttempts}次重连`)

    setTimeout(async () => {
      try {
        await this.initialize()
      } catch (error) {
        logger.error('RedisClient', '重连失败', error as Error)
      }
    }, delay)
  }

  /**
   * 测试连接
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Redis客户端未初始化')
      }

      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      logger.error('RedisClient', 'Redis ping失败', error as Error)
      return false
    }
  }

  /**
   * 获取Redis客户端
   */
  getClient(): RedisClientType | null {
    return this.client
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.client?.isReady === true
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * 获取连接信息（隐藏密码）
   */
  private getConnectionInfo(): object {
    return {
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
      hasPassword: !!this.config.password
    }
  }

  /**
   * 获取Redis信息
   */
  async getInfo(): Promise<object> {
    try {
      if (!this.client) {
        throw new Error('Redis客户端未初始化')
      }

      const info = await this.client.info()
      return this.parseRedisInfo(info)
    } catch (error) {
      logger.error('RedisClient', '获取Redis信息失败', error as Error)
      return {}
    }
  }

  /**
   * 解析Redis信息
   */
  private parseRedisInfo(infoString: string): object {
    const info: any = {}
    const lines = infoString.split('\r\n')

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':')
        if (key && value) {
          info[key] = value
        }
      }
    }

    return {
      version: info.redis_version,
      mode: info.redis_mode,
      uptime: parseInt(info.uptime_in_seconds),
      connectedClients: parseInt(info.connected_clients),
      usedMemory: info.used_memory_human,
      totalConnectionsReceived: parseInt(info.total_connections_received),
      totalCommandsProcessed: parseInt(info.total_commands_processed),
      keyspaceHits: parseInt(info.keyspace_hits),
      keyspaceMisses: parseInt(info.keyspace_misses)
    }
  }

  /**
   * 关闭连接
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect()
        logger.info('RedisClient', 'Redis连接已关闭')
      } catch (error) {
        logger.error('RedisClient', 'Redis断开连接时出错', error as Error)
      } finally {
        this.client = null
        this.connectionStatus = 'disconnected'
      }
    }
  }
}

// 全局Redis客户端实例
let redisClientManager: RedisClientManager | null = null

/**
 * 获取Redis客户端管理器实例
 */
export function getRedisClientManager(): RedisClientManager {
  if (!redisClientManager) {
    redisClientManager = new RedisClientManager()
  }
  return redisClientManager
}

/**
 * 初始化Redis连接
 */
export async function initializeRedis(config?: RedisConfig): Promise<void> {
  const manager = getRedisClientManager()
  await manager.initialize()
}

/**
 * 获取Redis客户端
 */
export function getRedisClient(): RedisClientType | null {
  return getRedisClientManager().getClient()
}

/**
 * 检查Redis连接状态
 */
export function isRedisConnected(): boolean {
  return getRedisClientManager().isConnected()
}

/**
 * 关闭Redis连接
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClientManager) {
    await redisClientManager.disconnect()
    redisClientManager = null
  }
}


import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'

// 路由导入
import pixelArtRoutes from './routes/pixelArt'

// 缓存相关导入
import { initializeRedis, isRedisConnected, closeRedisConnection } from './services/cache/redisClient'
import { getPixelArtCacheManager } from './services/cache/pixelArtCache'
import { logger } from './services/pixelArt/errorHandler'

// 加载环境变量 - VPS配置
const isProduction = process.env.NODE_ENV === 'production'

if (!isProduction) {
  // 本地开发环境加载.env文件
  dotenv.config({ path: '.env' })
}

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// 简单的内存速率限制器
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15分钟
const RATE_LIMIT_MAX = 100 // 最大请求数

// 速率限制中间件
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown'
  const now = Date.now()
  
  const clientData = requestCounts.get(clientIp)
  
  if (!clientData || now > clientData.resetTime) {
    // 重置或初始化计数器
    requestCounts.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return next()
  }
  
  if (clientData.count >= RATE_LIMIT_MAX) {
    const resetIn = Math.ceil((clientData.resetTime - now) / 1000)
    res.set('Retry-After', resetIn.toString())
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter: resetIn
    })
  }
  
  clientData.count++
  next()
}

// 中间件 - VPS CORS配置
const getAllowedOrigins = (): (string | RegExp)[] => {
  const origins: (string | RegExp)[] = []
  
  // 开发环境
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173')
  }
  
  // ⭐ VPS部署：支持多域名CORS配置（逗号分隔）
  if (process.env.ALLOWED_ORIGINS) {
    const allowedOriginsArray = process.env.ALLOWED_ORIGINS
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0)
    origins.push(...allowedOriginsArray)
    console.log('📍 VPS ALLOWED_ORIGINS:', allowedOriginsArray)
  }
  
  // 自定义前端URL（降级方案）
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }
  
  console.log('🌐 允许的CORS源:', origins)
  return origins
}

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins()
    
    // 允许没有origin的请求（如移动应用）
    if (!origin) return callback(null, true)
    
    // 检查字符串匹配
    if (allowedOrigins.some(allowed => typeof allowed === 'string' && allowed === origin)) {
      return callback(null, true)
    }
    
    // 检查正则表达式匹配
    if (allowedOrigins.some(allowed => allowed instanceof RegExp && allowed.test(origin))) {
      return callback(null, true)
    }
    
    // 开发环境允许所有localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true)
    }
    
    console.warn('⚠️ CORS阻止的源:', origin)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 应用速率限制
app.use('/api/', rateLimitMiddleware)

// 先行健康检查路由（绕过CORS/速率限制）
app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API路由
app.use('/api/color03', pixelArtRoutes)

// 复杂的健康检查已移除，使用上面的简单版本

// ⭐ VPS部署：生产环境静态文件服务
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist')
  
  // 检查前端文件是否存在
  if (require('fs').existsSync(frontendPath)) {
    console.log('📁 静态文件服务: 启用')
    console.log('📂 静态文件路径:', frontendPath)
    
    // 静态文件服务
    app.use(express.static(frontendPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }))
    
    // SPA路由支持（必须放在最后）
    app.get('*', (req, res, next) => {
      // 跳过API路由和健康检查
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next()
      }
      
      // 返回前端入口文件
      res.sendFile(path.join(frontendPath, 'index.html'))
    })
  } else {
    console.warn('⚠️  前端文件不存在:', frontendPath)
    console.warn('⚠️  静态文件服务: 禁用')
  }
} else {
  console.log('📁 开发模式: 静态文件服务禁用（使用独立前端开发服务器）')
}

// 404处理（仅API路由）
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path
  })
})

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  
  // 图像处理错误特殊处理
  if (err.message && (err.message.includes('图像') || err.message.includes('image'))) {
    return res.status(400).json({
      success: false,
      error: '图像处理失败，请检查图像格式和大小',
      timestamp: new Date().toISOString()
    })
  }

  // 数据库错误特殊处理
  if (err.code === 'P2002') { // Prisma unique constraint error
    return res.status(409).json({
      success: false,
      error: '数据冲突',
      timestamp: new Date().toISOString()
    })
  }

  // 数据库连接错误
  if (err.code === 'ECONNREFUSED' && err.message.includes('database')) {
    return res.status(503).json({
      success: false,
      error: '数据库连接失败，请检查数据库配置',
      timestamp: new Date().toISOString()
    })
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  })
})

// 异步初始化函数 - 全局修复版本
async function initializeServices(): Promise<void> {
	try {
		console.log('🔧 开始初始化服务...')
		
		// 检查是否为开发环境
		const isDev = !isProduction
		
		if (isDev) {
			console.log('🛠️  开发环境检测：跳过外部服务依赖')
			console.log('📝 核心功能（像素画转换）将独立运行')
			return // 开发环境快速启动，跳过所有外部依赖
		}
		
		// 只在生产环境或明确启用时初始化Redis
		const enableCache = process.env.ENABLE_REDIS_CACHE === 'true' || 
		                   process.env.CACHE_ENABLED === 'true' || 
		                   isProduction
		
		if (enableCache) {
			console.log('🗄️  尝试初始化Redis缓存...')
			try {
				// 设置超时，防止无限等待
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('Redis连接超时')), 5000)
				})
				
				await Promise.race([initializeRedis(), timeoutPromise])
				
				if (isRedisConnected()) {
					console.log('✅ Redis缓存已连接')
					const cacheManager = getPixelArtCacheManager()
					console.log(`💾 缓存配置: TTL=${cacheManager.getConfig().defaultTTL}s`)
				} else {
					console.log('⚠️  Redis缓存连接失败，使用无缓存模式')
				}
			} catch (error) {
				// 静默处理Redis错误，不影响核心服务启动
				console.log('⚠️  缓存服务初始化跳过，使用无缓存模式')
				console.log('💡 这不会影响像素画转换等核心功能')
			}
		} else {
			console.log('🚫 缓存功能已禁用（开发环境优化）')
		}
		
		console.log('✅ 服务初始化完成')
		
	} catch (error) {
		// 即使初始化失败，也不阻止服务启动
		console.log('⚠️  某些辅助服务初始化失败，但核心服务将正常运行')
		console.log('💡 像素画转换等核心功能不受影响')
	}
}

// 启动 HTTP 服务（VPS部署）
initializeServices().then(() => {
	const server = app.listen(PORT, '0.0.0.0', () => {
		console.log(`🚀 Server running on port ${PORT}`)
		console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
		console.log(`🎮 COLOR03 Pixel Art API: http://localhost:${PORT}/api/color03/pixel-art/convert`)
		
		// 显示缓存状态
		if (isRedisConnected()) {
			console.log(`🗄️  缓存服务: ✅ 已启用`)
		} else {
			console.log(`🗄️  缓存服务: ❌ 未启用`)
		}
	})
	
	return server
}).catch(error => {
	console.error('❌ 服务器启动失败:', error)
	process.exit(1)
}).then(server => {
	if (server) {
		setupGracefulShutdown(server)
	}
})

// 设置优雅关闭
function setupGracefulShutdown(server: any): void {
	const gracefulShutdown = async () => {
		console.log('🛑 优雅关闭中...')
		
		try {
			// 停止接受新连接
			server.close(() => {
				console.log('✅ HTTP服务器已关闭')
			})
			
			// 关闭Redis连接
			if (isRedisConnected()) {
				console.log('🗄️  正在关闭Redis连接...')
				await closeRedisConnection()
				console.log('✅ Redis连接已关闭')
			}
			
			// 清理其他资源
			console.log('🧹 清理完成')
			process.exit(0)
		} catch (error) {
			console.error('❌ 优雅关闭失败:', error)
			process.exit(1)
		}
	}

	process.on('SIGTERM', gracefulShutdown)
	process.on('SIGINT', gracefulShutdown)
}

// 导出app实例供测试使用
export default app 
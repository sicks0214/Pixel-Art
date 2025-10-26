import express from 'express'
import multer from 'multer'
import { pixelArtController } from '../controller/pixelArt/pixelArtController'
import { validatePixelArtRequest } from '../middleware/validation'
import { imageUploadMiddleware } from '../middleware/imageUpload'
import { applyCacheMiddleware, cacheClearMiddleware } from '../middleware/cacheMiddleware'

const router = express.Router()

// ============= COLOR02风格分步式路由架构 =============

/**
 * @swagger
 * /api/color03/pixel-art/upload:
 *   post:
 *     summary: 第1步：上传图片
 *     description: COLOR02风格上传图片，立即返回imageId
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: imageFile
 *         type: file
 *         required: true
 *         description: 要上传的图像文件 (PNG/JPG/WEBP)
 *     responses:
 *       200:
 *         description: 上传成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 imageId:
 *                   type: string
 *                 fileDimensions:
 *                   type: object
 *                   properties:
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                 fileSize:
 *                   type: number
 *                 fileName:
 *                   type: string
 */
router.post('/pixel-art/upload', 
  imageUploadMiddleware,
  pixelArtController.uploadImage
)

/**
 * @swagger
 * /api/color03/pixel-art/start:
 *   post:
 *     summary: 第2步：开始转换任务
 *     description: COLOR02风格启动异步转换任务
 *     parameters:
 *       - in: body
 *         name: request
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             imageId:
 *               type: string
 *               description: 上传步骤返回的图片ID
 *             parameters:
 *               type: object
 *               properties:
 *                 resizeFactor:
 *                   type: number
 *                 interpolation:
 *                   type: string
 *                 colorMode:
 *                   type: string
 *                 ditheringRatio:
 *                   type: number
 *     responses:
 *       200:
 *         description: 任务创建成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 estimatedTime:
 *                   type: number
 *                 status:
 *                   type: string
 */
router.post('/pixel-art/start',
  express.json(),
  pixelArtController.startConversion
)

/**
 * @swagger
 * /api/color03/pixel-art/progress/{taskId}:
 *   get:
 *     summary: 第3步：查询转换进度
 *     description: COLOR02风格实时查询任务进度
 *     parameters:
 *       - in: path
 *         name: taskId
 *         type: string
 *         required: true
 *         description: 转换任务ID
 *     responses:
 *       200:
 *         description: 进度查询成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 taskId:
 *                   type: string
 *                 progress:
 *                   type: number
 *                 status:
 *                   type: string
 *                 currentStep:
 *                   type: string
 *                 estimatedTimeRemaining:
 *                   type: number
 */
router.get('/pixel-art/progress/:taskId',
  pixelArtController.getConversionProgress
)

/**
 * @swagger
 * /api/color03/pixel-art/result/{taskId}:
 *   get:
 *     summary: 第4步：获取转换结果
 *     description: COLOR02风格获取完成的转换结果
 *     parameters:
 *       - in: path
 *         name: taskId
 *         type: string
 *         required: true
 *         description: 转换任务ID
 *     responses:
 *       200:
 *         description: 转换结果
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 pixelArtImage:
 *                   type: string
 *                   description: Base64编码的像素画图像
 *                 canvasInfo:
 *                   type: object
 *                 extractedColors:
 *                   type: array
 *                   items:
 *                     type: string
 *                 processingTime:
 *                   type: number
 *                 metadata:
 *                   type: object
 */
router.get('/pixel-art/result/:taskId',
  pixelArtController.getConversionResult
)

// ============= 兼容性路由（保持原有API） =============

/**
 * @swagger
 * /api/color03/pixel-art/convert:
 *   post:
 *     summary: 图像转像素画（兼容旧版）
 *     description: 将上传的图像转换为像素画风格，支持智能缓存
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: query
 *         name: quality
 *         type: string
 *         required: false
 *         description: 处理质量级别 (fast, balanced, high_quality)
 *         default: balanced
 *       - in: formData
 *         name: imageFile
 *         type: file
 *         required: true
 *         description: 要转换的图像文件 (PNG/JPG)
 *       - in: formData
 *         name: resizeFactor
 *         type: number
 *         required: true
 *         description: 调整大小因子 (0-100)
 *       - in: formData
 *         name: interpolation
 *         type: string
 *         required: true
 *         description: 插值方法 (nearest_neighbor, bilinear)
 *       - in: formData
 *         name: colorMode
 *         type: string
 *         required: true
 *         description: 颜色模式 (no_dithering, ordered_dithering_bayer)
 *       - in: formData
 *         name: ditheringRatio
 *         type: number
 *         required: true
 *         description: 抖动比例 (0.1-3.0)
 *     responses:
 *       200:
 *         description: 转换成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 pixelArtImage:
 *                   type: string
 *                   description: Base64编码的像素画图像
 *                 canvasInfo:
 *                   type: object
 *                   properties:
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     coloredPixels:
 *                       type: number
 *                 extractedColors:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: 提取的颜色数组
 *                 processingTime:
 *                   type: number
 *                   description: 处理时间(毫秒)
 *                 requestId:
 *                   type: string
 *                   description: 请求追踪ID
 */
router.post('/pixel-art/convert', 
  ...applyCacheMiddleware,
  imageUploadMiddleware,
  validatePixelArtRequest,
  pixelArtController.convertToPixelArt
)

/**
 * @swagger
 * /api/color03/health:
 *   get:
 *     summary: 像素画服务健康检查
 *     description: 检查像素画转换服务的健康状态，包括任务管理器统计
 *     responses:
 *       200:
 *         description: 服务正常
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             status:
 *               type: string
 *             timestamp:
 *               type: string
 *             services:
 *               type: object
 *               properties:
 *                 sharp:
 *                   type: object
 *                 memory:
 *                   type: object
 *                 uptime:
 *                   type: object
 *                 taskManager:
 *                   type: object
 *                   description: 任务管理器状态和统计
 */
router.get('/health', ...applyCacheMiddleware, pixelArtController.healthCheck)

/**
 * @swagger
 * /api/color03/cache/clear:
 *   post:
 *     summary: 清空缓存
 *     description: 清空所有像素画转换缓存
 *     responses:
 *       200:
 *         description: 缓存清空成功
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             message:
 *               type: string
 *             timestamp:
 *               type: string
 *       503:
 *         description: 缓存服务不可用
 *       500:
 *         description: 清空失败
 */
router.post('/cache/clear', cacheClearMiddleware)

/**
 * @swagger
 * /api/color03/cache/stats:
 *   get:
 *     summary: 获取缓存统计
 *     description: 获取详细的缓存使用统计信息
 *     responses:
 *       200:
 *         description: 缓存统计信息
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *             data:
 *               type: object
 *               properties:
 *                 totalHits:
 *                   type: number
 *                   description: 总命中次数
 *                 totalMisses:
 *                   type: number
 *                   description: 总未命中次数
 *                 hitRate:
 *                   type: number
 *                   description: 命中率(%)
 *                 totalKeys:
 *                   type: number
 *                   description: 缓存键总数
 *                 memoryUsage:
 *                   type: number
 *                   description: 内存使用量(字节)
 *                 isEnabled:
 *                   type: boolean
 *                   description: 缓存是否启用
 *       503:
 *         description: 缓存服务不可用
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const { getPixelArtCacheManager } = await import('../services/cache/pixelArtCache')
    const cacheManager = getPixelArtCacheManager()
    
    if (!cacheManager.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: '缓存服务不可用',
        data: {
          isEnabled: false
        }
      })
    }
    
    const stats = await cacheManager.getStats()
    
    res.status(200).json({
      success: true,
      data: {
        ...stats,
        isEnabled: true,
        config: cacheManager.getConfig()
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取缓存统计失败'
    })
  }
})

export default router

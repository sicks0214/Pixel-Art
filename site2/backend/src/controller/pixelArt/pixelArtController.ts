import { Request, Response } from 'express'
import sharp from 'sharp'
import { getTaskManager } from '../../services/pixelArt/taskManager'
import { getPixelArtProcessor, PixelArtConversionParams } from './pixelArtProcessor'

/**
 * 像素画控制器类 - COLOR02风格分步式架构
 */
class PixelArtController {
  
  // ============= 第1步：图片上传（COLOR02风格） =============
  
  /**
   * 上传图片，返回imageId
   */
  async uploadImage(req: Request, res: Response) {
    const requestId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`📤 [${requestId}] COLOR02风格图片上传开始`)
      
      // 获取上传的文件
      const file = req.file!
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: '未收到图片文件'
        })
      }

      // 基础验证
      if (!file.buffer || file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: '图像数据为空'
        })
      }
      
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          error: '不支持的文件类型，请上传图片文件'
        })
      }

      console.log(`📊 [${requestId}] 文件信息:`, {
        fileName: file.originalname,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        mimeType: file.mimetype
      })

      // 获取图像元数据
      const processor = getPixelArtProcessor()
      const imageInfo = await processor.getImageMetadata(file.buffer)
      
      if (!imageInfo.width || !imageInfo.height) {
        return res.status(400).json({
          success: false,
          error: '无法获取图像尺寸信息'
        })
      }

      // 验证图像尺寸
      const validation = processor.validateImageDimensions(imageInfo.width, imageInfo.height)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        })
      }

      // 存储图片到任务管理器
      const taskManager = getTaskManager()
      const imageId = taskManager.storeUploadedImage({
        fileName: file.originalname || 'unknown.png',
        buffer: file.buffer,
        fileSize: file.size,
        mimeType: file.mimetype,
        dimensions: {
          width: imageInfo.width,
          height: imageInfo.height
        }
      })

      console.log(`✅ [${requestId}] 图片上传完成，imageId: ${imageId}`)

      return res.json({
        success: true,
        data: {
          imageId,
          fileDimensions: {
            width: imageInfo.width,
            height: imageInfo.height
          },
          fileSize: file.size,
          fileName: file.originalname || 'unknown.png'
        }
      })
      
    } catch (error) {
      console.error(`❌ [${requestId}] 上传失败:`, error)
      
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '上传失败'
      })
    }
  }

  // ============= 第2步：开始转换任务（COLOR02风格） =============
  
  /**
   * 开始转换任务，返回taskId
   */
  async startConversion(req: Request, res: Response) {
    const requestId = `convert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`🎨 [${requestId}] COLOR02风格转换任务开始`)
      
      const { imageId, parameters } = req.body
      
      if (!imageId) {
        return res.status(400).json({
          success: false,
          error: 'imageId参数缺失'
        })
      }

      if (!parameters) {
        return res.status(400).json({
          success: false,
          error: '转换参数缺失'
        })
      }

      // 验证图片是否存在
      const taskManager = getTaskManager()
      const imageData = taskManager.getUploadedImage(imageId)
      
      if (!imageData) {
        return res.status(404).json({
          success: false,
          error: '图片不存在，请重新上传'
        })
      }

      // 验证转换参数
      const params: PixelArtConversionParams = {
        resizeFactor: Math.max(1, Math.min(100, Number(parameters.resizeFactor) || 50)),
        interpolation: parameters.interpolation === 'nearest_neighbor' ? 'nearest_neighbor' : 'bilinear',
        colorMode: parameters.colorMode === 'ordered_dithering_bayer' ? 'ordered_dithering_bayer' : 'no_dithering',
        ditheringRatio: Math.max(0.1, Math.min(3.0, Number(parameters.ditheringRatio) || 1.0))
      }

      console.log(`⚙️ [${requestId}] 转换参数:`, params)

      // 创建转换任务
      const taskId = taskManager.createTask(imageId, params)

      console.log(`✅ [${requestId}] 转换任务已创建: ${taskId}`)

      return res.json({
        success: true,
        data: {
          taskId,
          estimatedTime: 10000, // 估计10秒
          status: 'queued'
        }
      })
      
    } catch (error) {
      console.error(`❌ [${requestId}] 创建转换任务失败:`, error)
      
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '创建转换任务失败'
      })
    }
  }

  // ============= 第3步：查询转换进度（COLOR02风格） =============
  
  /**
   * 查询转换进度
   */
  async getConversionProgress(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'taskId参数缺失'
        })
      }

      const taskManager = getTaskManager()
      const task = taskManager.getTask(taskId)
      
      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        })
      }

      console.log(`📊 [${taskId}] 进度查询: ${task.progress}% (${task.status})`)

      return res.json({
        success: true,
        data: {
          taskId: task.taskId,
          progress: task.progress,
          status: task.status,
          currentStep: task.currentStep,
          estimatedTimeRemaining: task.estimatedTime ? 
            Math.max(0, task.estimatedTime - (Date.now() - (task.startedAt?.getTime() || Date.now()))) : 
            null
        }
      })
      
    } catch (error) {
      console.error('查询进度失败:', error)
      
      return res.status(500).json({
        success: false,
        error: '查询进度失败'
      })
    }
  }

  // ============= 第4步：获取转换结果（COLOR02风格） =============
  
  /**
   * 获取转换结果
   */
  async getConversionResult(req: Request, res: Response) {
    try {
      const { taskId } = req.params
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'taskId参数缺失'
        })
      }

      const taskManager = getTaskManager()
      const task = taskManager.getTask(taskId)
      
      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在'
        })
      }

      if (task.status === 'queued' || task.status === 'processing') {
        return res.status(202).json({
          success: false,
          error: '任务尚未完成，请继续轮询进度'
        })
      }

      if (task.status === 'failed') {
        return res.status(500).json({
          success: false,
          error: task.error || '转换失败'
        })
      }

      if (task.status === 'completed' && task.result) {
        console.log(`✅ [${taskId}] 返回转换结果`)
        
        return res.json({
          success: true,
          data: task.result
        })
      }

      return res.status(500).json({
        success: false,
        error: '结果数据不可用'
      })
      
    } catch (error) {
      console.error('获取结果失败:', error)
      
      return res.status(500).json({
        success: false,
        error: '获取结果失败'
      })
    }
  }

  // ============= 原有方法（保持兼容） =============

  /**
   * 将图像转换为像素画（兼容旧API）
   */
  async convertToPixelArt(req: Request, res: Response) {
    const startTime = Date.now()
    const requestId = `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      console.log(`🔄 [${requestId}] 兼容模式：使用旧API接口`)
      
      // 获取上传的文件和参数
      const file = req.file!
      const params = req.validatedBody as PixelArtConversionParams
      const quality = (req.query.quality as 'fast' | 'balanced' | 'high_quality') || 'fast'
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: '未收到图片文件',
          requestId
        })
      }

      // 获取图像信息
      const processor = getPixelArtProcessor()
      const imageInfo = await processor.getImageMetadata(file.buffer)
      
      if (!imageInfo.width || !imageInfo.height) {
        return res.status(400).json({
          success: false,
          error: '无法获取图像尺寸信息',
          requestId
        })
      }

      // 验证图像尺寸
      const validation = processor.validateImageDimensions(imageInfo.width, imageInfo.height)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          requestId
        })
      }

      console.log(`⚡ [${requestId}] 开始兼容模式处理...`)
      
      // 直接调用处理器
      const processingResult = await processor.processPixelArt(
        file.buffer,
        params,
        { width: imageInfo.width, height: imageInfo.height },
        quality
      )
      
      const totalTime = Date.now() - startTime
      
      console.log(`🎉 [${requestId}] 兼容模式处理完成:`, {
        总耗时: `${totalTime}ms`,
        处理耗时: `${processingResult.processingTime}ms`,
        输出尺寸: `${processingResult.canvasInfo.width}x${processingResult.canvasInfo.height}`
      })
      
      return res.json({
        success: true,
        data: processingResult,
        requestId,
        totalTime
      })
      
    } catch (error) {
      const totalTime = Date.now() - startTime
      
      console.error(`❌ [${requestId}] 兼容模式转换失败:`, error)
      
      return res.status(this.getErrorStatusCode(error)).json({
        success: false,
        error: error instanceof Error ? error.message : '转换失败，请重试',
        requestId,
        totalTime
      })
    }
  }

  // ============= 健康检查（保持原有） =============

  /**
   * 健康检查端点
   */
  async healthCheck(req: Request, res: Response) {
    try {
      console.log('[Health] 🔍 系统健康检查')
      
      // 测试Sharp是否正常工作
      const testBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 0, b: 0 }
        }
      })
      .png()
      .toBuffer()

      // 获取系统信息
      const memoryUsage = process.memoryUsage()
      const uptime = process.uptime()
      
      // 获取任务管理器状态
      const taskManager = getTaskManager()
      const taskStats = taskManager.getStats()

      console.log('[Health] ✅ 健康检查完成')

      return res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          sharp: {
            status: 'ok',
            testBufferSize: testBuffer.length
          },
          memory: {
            used: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
          },
          uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
          },
          taskManager: taskStats
        }
      })
      
    } catch (error) {
      console.error('[Health] ❌ 健康检查失败:', error)
      
      return res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : '系统异常',
        timestamp: new Date().toISOString()
      })
    }
  }

  // ============= 辅助方法 =============

  /**
   * 根据错误类型返回HTTP状态码
   */
  private getErrorStatusCode(error: any): number {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes('尺寸过大') || message.includes('文件过大')) {
        return 413
      }
      
      if (message.includes('格式') || message.includes('类型')) {
        return 415
      }
      
      if (message.includes('参数') || message.includes('无效')) {
        return 400
      }
    }
    
    return 500
  }
}

// 创建控制器实例
export const pixelArtController = new PixelArtController()
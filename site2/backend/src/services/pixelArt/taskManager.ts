/**
 * 像素画转换任务管理器 - COLOR02风格异步架构
 * 功能：任务队列、状态管理、进度追踪
 */

import { EventEmitter } from 'events'
import { PixelArtConversionParams, ConversionResult, CanvasInfo } from '../../controller/pixelArt/pixelArtProcessor'

// ============= 任务状态类型（COLOR02风格） =============

export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface PixelArtTask {
  taskId: string
  imageId: string
  status: TaskStatus
  progress: number
  currentStep: string
  params: PixelArtConversionParams
  result?: ConversionResult
  error?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  estimatedTime?: number
  actualTime?: number
}

export interface UploadedImage {
  imageId: string
  fileName: string
  buffer: Buffer
  fileSize: number
  mimeType: string
  dimensions: {
    width: number
    height: number
  }
  uploadedAt: Date
}

// ============= 任务管理器类（COLOR02架构） =============

class TaskManager extends EventEmitter {
  private tasks: Map<string, PixelArtTask> = new Map()
  private uploadedImages: Map<string, UploadedImage> = new Map()
  private isProcessing: boolean = false
  private processingQueue: string[] = []

  // 配置参数
  private readonly MAX_CONCURRENT_TASKS = 1  // 避免内存问题，一次只处理一个
  private readonly TASK_TIMEOUT = 300000     // 5分钟超时
  private readonly MAX_TASK_HISTORY = 100    // 最大任务历史记录
  private readonly IMAGE_CLEANUP_TIME = 3600000  // 1小时后清理图片

  constructor() {
    super()
    this.startTaskProcessor()
    this.startCleanupTimer()
    console.log('[TaskManager] 任务管理器初始化完成')
  }

  // ============= 图片上传管理 =============
  
  /**
   * 存储上传的图片
   */
  storeUploadedImage(imageData: Omit<UploadedImage, 'imageId' | 'uploadedAt'>): string {
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const uploadedImage: UploadedImage = {
      imageId,
      ...imageData,
      uploadedAt: new Date()
    }
    
    this.uploadedImages.set(imageId, uploadedImage)
    
    console.log(`[TaskManager] 图片已存储: ${imageId}`, {
      fileName: uploadedImage.fileName,
      fileSize: `${(uploadedImage.fileSize / 1024 / 1024).toFixed(2)}MB`,
      dimensions: `${uploadedImage.dimensions.width}x${uploadedImage.dimensions.height}`
    })
    
    return imageId
  }

  /**
   * 获取上传的图片
   */
  getUploadedImage(imageId: string): UploadedImage | null {
    return this.uploadedImages.get(imageId) || null
  }

  // ============= 任务创建和管理 =============
  
  /**
   * 创建新的转换任务
   */
  createTask(imageId: string, params: PixelArtConversionParams): string {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const task: PixelArtTask = {
      taskId,
      imageId,
      status: 'queued',
      progress: 0,
      currentStep: '排队中',
      params,
      createdAt: new Date(),
      estimatedTime: this.estimateProcessingTime(imageId, params)
    }
    
    this.tasks.set(taskId, task)
    this.processingQueue.push(taskId)
    
    console.log(`[TaskManager] 任务已创建: ${taskId}`, {
      imageId,
      estimatedTime: `${task.estimatedTime}ms`,
      queuePosition: this.processingQueue.length
    })
    
    this.emit('taskCreated', task)
    this.processNextTask()
    
    return taskId
  }

  /**
   * 获取任务状态
   */
  getTask(taskId: string): PixelArtTask | null {
    return this.tasks.get(taskId) || null
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId: string, updates: Partial<PixelArtTask>): void {
    const task = this.tasks.get(taskId)
    if (task) {
      Object.assign(task, updates)
      this.emit('taskUpdated', task)
    }
  }

  // ============= 任务处理器（异步队列） =============
  
  /**
   * 启动任务处理器
   */
  private startTaskProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processNextTask()
      }
    }, 1000)
  }

  /**
   * 处理下一个任务
   */
  private async processNextTask(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return
    }

    const taskId = this.processingQueue.shift()!
    const task = this.tasks.get(taskId)
    
    if (!task) {
      console.warn(`[TaskManager] 任务不存在: ${taskId}`)
      return
    }

    this.isProcessing = true

    try {
      console.log(`[TaskManager] 开始处理任务: ${taskId}`)
      
      // 更新任务状态
      this.updateTask(taskId, {
        status: 'processing',
        startedAt: new Date(),
        currentStep: '准备处理'
      })

      // 获取图片数据
      const imageData = this.getUploadedImage(task.imageId)
      if (!imageData) {
        throw new Error('图片数据不存在')
      }

      // 执行实际的像素画转换
      const result = await this.executePixelArtConversion(task, imageData)

      // 任务完成
      this.updateTask(taskId, {
        status: 'completed',
        progress: 100,
        currentStep: '转换完成',
        result,
        completedAt: new Date(),
        actualTime: Date.now() - (task.startedAt?.getTime() || Date.now())
      })

      console.log(`[TaskManager] ✅ 任务完成: ${taskId}`)

    } catch (error) {
      console.error(`[TaskManager] ❌ 任务失败: ${taskId}`, error)
      
      this.updateTask(taskId, {
        status: 'failed',
        currentStep: '处理失败',
        error: error instanceof Error ? error.message : '处理失败',
        completedAt: new Date()
      })

    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 执行实际的像素画转换（调用原有逻辑）
   */
  private async executePixelArtConversion(
    task: PixelArtTask, 
    imageData: UploadedImage
  ): Promise<ConversionResult> {
    console.log(`[TaskManager] 执行转换: ${task.taskId}`)
    
    // 进度更新回调
    const onProgress = (progress: number, step: string) => {
      this.updateTask(task.taskId, {
        progress: Math.min(progress, 99), // 保留1%给完成状态
        currentStep: step
      })
    }

          // 调用处理器执行转换
      const { getPixelArtProcessor } = await import('../../controller/pixelArt/pixelArtProcessor')
      const processor = getPixelArtProcessor()
      
      // 调用处理逻辑
      return await processor.processPixelArt(
        imageData.buffer,
        task.params,
        imageData.dimensions,
        'fast', // 使用快速模式确保稳定
        onProgress
      )
  }

  /**
   * 估算处理时间
   */
  private estimateProcessingTime(imageId: string, params: PixelArtConversionParams): number {
    const imageData = this.getUploadedImage(imageId)
    if (!imageData) return 10000 // 默认10秒

    const { width, height } = imageData.dimensions
    const pixelCount = width * height
    const targetPixelCount = pixelCount * (params.resizeFactor / 100) ** 2

    // 基于像素数量估算时间
    let baseTime = 1000 // 基础1秒
    
    if (targetPixelCount > 500000) baseTime = 15000      // 大图15秒
    else if (targetPixelCount > 100000) baseTime = 8000  // 中图8秒
    else if (targetPixelCount > 10000) baseTime = 3000   // 小图3秒
    
    // 抖动模式增加时间
    if (params.colorMode === 'ordered_dithering_bayer') {
      baseTime *= 1.5
    }

    return Math.round(baseTime)
  }

  // ============= 清理和维护 =============
  
  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldTasks()
      this.cleanupOldImages()
    }, 300000) // 每5分钟清理一次
  }

  /**
   * 清理过期任务
   */
  private cleanupOldTasks(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [taskId, task] of this.tasks.entries()) {
      const age = now - task.createdAt.getTime()
      
      // 清理24小时前的任务
      if (age > 24 * 60 * 60 * 1000) {
        this.tasks.delete(taskId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TaskManager] 清理了 ${cleanedCount} 个过期任务`)
    }
  }

  /**
   * 清理过期图片
   */
  private cleanupOldImages(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [imageId, image] of this.uploadedImages.entries()) {
      const age = now - image.uploadedAt.getTime()
      
      // 清理1小时前的图片
      if (age > this.IMAGE_CLEANUP_TIME) {
        this.uploadedImages.delete(imageId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log(`[TaskManager] 清理了 ${cleanedCount} 个过期图片`)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalTasks: this.tasks.size,
      queuedTasks: this.processingQueue.length,
      uploadedImages: this.uploadedImages.size,
      isProcessing: this.isProcessing,
      tasksStatus: {
        queued: Array.from(this.tasks.values()).filter(t => t.status === 'queued').length,
        processing: Array.from(this.tasks.values()).filter(t => t.status === 'processing').length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
        failed: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length,
      }
    }
  }
}

// 单例模式（COLOR02风格）
let taskManagerInstance: TaskManager | null = null

export function getTaskManager(): TaskManager {
  if (!taskManagerInstance) {
    taskManagerInstance = new TaskManager()
  }
  return taskManagerInstance
}

export default TaskManager 
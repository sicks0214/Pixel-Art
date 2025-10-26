/**
 * Worker线程池管理器
 * 管理图像处理Worker线程的创建、任务分发和资源清理
 */

import { Worker } from 'worker_threads'
import * as path from 'path'
import * as os from 'os'
import { logger } from './errorHandler'

// 任务接口定义
export interface WorkerTask {
  id: string
  type: 'resize' | 'quantize' | 'dither' | 'pixelArt'
  data: any
  priority: 'low' | 'normal' | 'high'
  timeout?: number
}

// Worker状态
interface WorkerState {
  worker: Worker
  busy: boolean
  taskId?: string
  lastUsed: number
  tasksCompleted: number
  errors: number
}

// 任务结果
export interface TaskResult {
  success: boolean
  taskId: string
  result?: any
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

/**
 * Worker线程池类
 */
export class WorkerPool {
  private workers: Map<string, WorkerState> = new Map()
  private taskQueue: Array<{
    task: WorkerTask
    resolve: (result: any) => void
    reject: (error: Error) => void
  }> = []
  private maxWorkers: number
  private minWorkers: number
  private workerScript: string
  private idleTimeout: number = 60000 // 1分钟空闲超时
  private taskTimeout: number = 30000 // 30秒任务超时
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(options: {
    maxWorkers?: number
    minWorkers?: number
    workerScript?: string
    idleTimeout?: number
    taskTimeout?: number
  } = {}) {
    this.maxWorkers = options.maxWorkers || Math.max(2, os.cpus().length - 1)
    this.minWorkers = options.minWorkers || Math.max(1, Math.floor(this.maxWorkers / 2))
    this.workerScript = options.workerScript || path.join(__dirname, 'workers', 'imageProcessingWorker.js')
    this.idleTimeout = options.idleTimeout || 60000
    this.taskTimeout = options.taskTimeout || 30000

    logger.info('WorkerPool', '初始化Worker线程池', {
      maxWorkers: this.maxWorkers,
      minWorkers: this.minWorkers,
      workerScript: this.workerScript
    })

    // 创建最小数量的Worker
    this.ensureMinWorkers()
    
    // 启动清理定时器
    this.startCleanupTimer()
  }

  /**
   * 执行任务
   */
  async executeTask<T = any>(task: WorkerTask): Promise<T> {
    return new Promise((resolve, reject) => {
      const taskWithDefaults = {
        ...task,
        priority: task.priority || 'normal',
        timeout: task.timeout || this.taskTimeout
      }

      logger.debug('WorkerPool', '接收任务', {
        taskId: task.id,
        type: task.type,
        priority: taskWithDefaults.priority,
        queueLength: this.taskQueue.length
      })

      // 添加到任务队列
      this.taskQueue.push({
        task: taskWithDefaults,
        resolve,
        reject
      })

      // 按优先级排序队列
      this.taskQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 }
        return priorityOrder[b.task.priority] - priorityOrder[a.task.priority]
      })

      // 尝试立即处理任务
      this.processQueue()
    })
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return
    }

    // 寻找空闲的Worker
    let availableWorker = this.findAvailableWorker()
    
    // 如果没有空闲Worker且未达到最大数量，创建新Worker
    if (!availableWorker && this.workers.size < this.maxWorkers) {
      availableWorker = await this.createWorker()
    }

    if (availableWorker) {
      const queueItem = this.taskQueue.shift()
      if (queueItem) {
        this.assignTaskToWorker(availableWorker, queueItem)
      }
    }

    // 如果还有任务且有可用Worker，继续处理
    if (this.taskQueue.length > 0 && this.findAvailableWorker()) {
      setImmediate(() => this.processQueue())
    }
  }

  /**
   * 寻找可用的Worker
   */
  private findAvailableWorker(): string | null {
    for (const [workerId, state] of this.workers) {
      if (!state.busy) {
        return workerId
      }
    }
    return null
  }

  /**
   * 创建新的Worker
   */
  private async createWorker(): Promise<string> {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    logger.debug('WorkerPool', '创建新Worker', { workerId })

    const worker = new Worker(this.workerScript)
    
    const workerState: WorkerState = {
      worker,
      busy: false,
      lastUsed: Date.now(),
      tasksCompleted: 0,
      errors: 0
    }

    // 监听Worker消息
    worker.on('message', (message: TaskResult) => {
      this.handleWorkerMessage(workerId, message)
    })

    // 监听Worker错误
    worker.on('error', (error: Error) => {
      logger.error('WorkerPool', `Worker ${workerId} 发生错误`, error)
      workerState.errors++
      this.handleWorkerError(workerId, error)
    })

    // 监听Worker退出
    worker.on('exit', (code: number) => {
      logger.info('WorkerPool', `Worker ${workerId} 退出`, { code })
      this.workers.delete(workerId)
    })

    this.workers.set(workerId, workerState)

    logger.info('WorkerPool', 'Worker创建成功', {
      workerId,
      totalWorkers: this.workers.size
    })

    return workerId
  }

  /**
   * 将任务分配给Worker
   */
  private assignTaskToWorker(workerId: string, queueItem: {
    task: WorkerTask
    resolve: (result: any) => void
    reject: (error: Error) => void
  }): void {
    const workerState = this.workers.get(workerId)
    if (!workerState) {
      queueItem.reject(new Error(`Worker ${workerId} 不存在`))
      return
    }

    workerState.busy = true
    workerState.taskId = queueItem.task.id
    workerState.lastUsed = Date.now()

    logger.debug('WorkerPool', '分配任务给Worker', {
      workerId,
      taskId: queueItem.task.id,
      type: queueItem.task.type
    })

    // 设置任务超时
    const timeout = setTimeout(() => {
      logger.warn('WorkerPool', '任务超时', {
        workerId,
        taskId: queueItem.task.id,
        timeout: queueItem.task.timeout
      })

      queueItem.reject(new Error(`任务超时: ${queueItem.task.id}`))
      this.resetWorker(workerId)
    }, queueItem.task.timeout!)

    // 保存resolver和timeout以便稍后清理
    ;(workerState as any).currentResolver = queueItem.resolve
    ;(workerState as any).currentRejecter = queueItem.reject
    ;(workerState as any).currentTimeout = timeout

    // 发送任务给Worker
    workerState.worker.postMessage({
      id: queueItem.task.id,
      type: queueItem.task.type,
      ...queueItem.task.data
    })
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(workerId: string, message: TaskResult): void {
    const workerState = this.workers.get(workerId)
    if (!workerState) {
      return
    }

    const resolver = (workerState as any).currentResolver
    const rejecter = (workerState as any).currentRejecter
    const timeout = (workerState as any).currentTimeout

    // 清理超时
    if (timeout) {
      clearTimeout(timeout)
    }

    logger.debug('WorkerPool', 'Worker返回结果', {
      workerId,
      taskId: message.taskId,
      success: message.success
    })

    if (message.success) {
      workerState.tasksCompleted++
      if (resolver) {
        resolver(message.result)
      }
    } else {
      workerState.errors++
      if (rejecter) {
        rejecter(new Error(message.error?.message || '未知错误'))
      }
    }

    // 重置Worker状态
    this.resetWorker(workerId)

    // 继续处理队列
    this.processQueue()
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(workerId: string, error: Error): void {
    const workerState = this.workers.get(workerId)
    if (!workerState) {
      return
    }

    const rejecter = (workerState as any).currentRejecter
    if (rejecter) {
      rejecter(error)
    }

    // 如果错误过多，终止该Worker
    if (workerState.errors > 5) {
      logger.warn('WorkerPool', 'Worker错误过多，终止该Worker', {
        workerId,
        errors: workerState.errors
      })
      this.terminateWorker(workerId)
    } else {
      this.resetWorker(workerId)
    }
  }

  /**
   * 重置Worker状态
   */
  private resetWorker(workerId: string): void {
    const workerState = this.workers.get(workerId)
    if (!workerState) {
      return
    }

    workerState.busy = false
    workerState.taskId = undefined
    workerState.lastUsed = Date.now()

    // 清理临时属性
    delete (workerState as any).currentResolver
    delete (workerState as any).currentRejecter
    delete (workerState as any).currentTimeout
  }

  /**
   * 终止Worker
   */
  private async terminateWorker(workerId: string): Promise<void> {
    const workerState = this.workers.get(workerId)
    if (!workerState) {
      return
    }

    logger.info('WorkerPool', '终止Worker', { workerId })

    try {
      await workerState.worker.terminate()
    } catch (error) {
      logger.error('WorkerPool', '终止Worker失败', error as Error, { workerId })
    }

    this.workers.delete(workerId)
  }

  /**
   * 确保最小Worker数量
   */
  private async ensureMinWorkers(): Promise<void> {
    while (this.workers.size < this.minWorkers) {
      await this.createWorker()
    }
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleWorkers()
    }, Math.floor(this.idleTimeout / 2))
  }

  /**
   * 清理空闲Worker
   */
  private cleanupIdleWorkers(): void {
    const now = Date.now()
    const workersToTerminate: string[] = []

    for (const [workerId, state] of this.workers) {
      if (!state.busy && 
          now - state.lastUsed > this.idleTimeout && 
          this.workers.size > this.minWorkers) {
        workersToTerminate.push(workerId)
      }
    }

    for (const workerId of workersToTerminate) {
      logger.debug('WorkerPool', '清理空闲Worker', { workerId })
      this.terminateWorker(workerId)
    }
  }

  /**
   * 获取线程池状态
   */
  getStatus(): {
    totalWorkers: number
    busyWorkers: number
    queuedTasks: number
    workerStats: Array<{
      id: string
      busy: boolean
      tasksCompleted: number
      errors: number
      lastUsed: string
    }>
  } {
    const workerStats = Array.from(this.workers.entries()).map(([id, state]) => ({
      id,
      busy: state.busy,
      tasksCompleted: state.tasksCompleted,
      errors: state.errors,
      lastUsed: new Date(state.lastUsed).toISOString()
    }))

    return {
      totalWorkers: this.workers.size,
      busyWorkers: Array.from(this.workers.values()).filter(w => w.busy).length,
      queuedTasks: this.taskQueue.length,
      workerStats
    }
  }

  /**
   * 关闭线程池
   */
  async shutdown(): Promise<void> {
    logger.info('WorkerPool', '开始关闭Worker线程池')

    // 清理定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    // 终止所有Worker
    const terminationPromises = Array.from(this.workers.keys()).map(workerId => 
      this.terminateWorker(workerId)
    )

    await Promise.all(terminationPromises)

    // 拒绝所有排队的任务
    for (const queueItem of this.taskQueue) {
      queueItem.reject(new Error('Worker线程池已关闭'))
    }
    this.taskQueue.length = 0

    logger.info('WorkerPool', 'Worker线程池关闭完成')
  }
}

// 全局Worker线程池实例（延迟初始化）
let globalWorkerPool: WorkerPool | null = null

/**
 * 获取全局Worker线程池
 */
export function getGlobalWorkerPool(): WorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = new WorkerPool()
  }
  return globalWorkerPool
}

/**
 * 关闭全局Worker线程池
 */
export async function shutdownGlobalWorkerPool(): Promise<void> {
  if (globalWorkerPool) {
    await globalWorkerPool.shutdown()
    globalWorkerPool = null
  }
}

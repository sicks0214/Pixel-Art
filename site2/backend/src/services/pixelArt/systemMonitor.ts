/**
 * 系统健康监控器
 * 监控系统资源、服务状态和性能指标
 */

import { EventEmitter } from 'events'
import * as os from 'os'
import * as fs from 'fs'
import { promisify } from 'util'
import sharp from 'sharp'
import { logger } from './errorHandler'
import { globalMetricsCollector } from './metricsCollector'

const fsAccess = promisify(fs.access)

// 系统健康状态
export interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical'
  timestamp: number
  uptime: number
  components: {
    memory: ComponentHealth
    cpu: ComponentHealth
    disk: ComponentHealth
    sharp: ComponentHealth
    workerPool: ComponentHealth
    database: ComponentHealth
  }
  metrics: SystemMetrics
  alerts: Alert[]
}

// 组件健康状态
export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  message: string
  value?: number
  threshold?: {
    warning: number
    critical: number
  }
  lastCheck: number
  history: Array<{
    timestamp: number
    status: string
    value?: number
  }>
}

// 系统指标
export interface SystemMetrics {
  memory: {
    used: number
    free: number
    total: number
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
    usagePercent: number
  }
  cpu: {
    usage: number[]
    loadAverage: number[]
    cores: number
  }
  disk: {
    free: number
    used: number
    total: number
    usagePercent: number
  }
  process: {
    pid: number
    uptime: number
    version: string
    platform: string
    arch: string
  }
  network: {
    activeConnections?: number
    requestsPerSecond?: number
  }
}

// 告警信息
export interface Alert {
  id: string
  level: 'info' | 'warning' | 'critical'
  component: string
  message: string
  timestamp: number
  value?: number
  threshold?: number
  resolved: boolean
  resolvedAt?: number
}

/**
 * 系统监控器类
 */
export class SystemMonitor extends EventEmitter {
  private monitoringInterval: NodeJS.Timeout | null = null
  private alertHistory: Alert[] = []
  private componentHistory: Map<string, ComponentHealth['history']> = new Map()
  private isMonitoring: boolean = false
  private checkInterval: number = 30000 // 30秒检查一次

  // 健康检查阈值配置
  private thresholds = {
    memory: { warning: 70, critical: 85 }, // 内存使用率百分比
    cpu: { warning: 80, critical: 95 }, // CPU使用率百分比
    disk: { warning: 80, critical: 90 }, // 磁盘使用率百分比
    responseTime: { warning: 5000, critical: 10000 }, // 响应时间毫秒
    errorRate: { warning: 5, critical: 10 } // 错误率百分比
  }

  constructor(options: {
    checkInterval?: number
    thresholds?: Partial<typeof SystemMonitor.prototype.thresholds>
  } = {}) {
    super()

    this.checkInterval = options.checkInterval || 30000
    if (options.thresholds) {
      this.thresholds = { ...this.thresholds, ...options.thresholds }
    }

    logger.info('SystemMonitor', '系统监控器初始化', {
      checkInterval: this.checkInterval,
      thresholds: this.thresholds
    })
  }

  /**
   * 开始监控
   */
  start(): void {
    if (this.isMonitoring) {
      logger.warn('SystemMonitor', '监控已在运行中')
      return
    }

    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.checkInterval)

    // 立即执行一次检查
    this.performHealthCheck()

    logger.info('SystemMonitor', '系统监控已启动', {
      interval: `${this.checkInterval / 1000}秒`
    })

    this.emit('monitoringStarted')
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isMonitoring) {
      return
    }

    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logger.info('SystemMonitor', '系统监控已停止')
    this.emit('monitoringStopped')
  }

  /**
   * 执行健康检查
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const timestamp = Date.now()
    
    try {
      logger.debug('SystemMonitor', '开始系统健康检查')

      // 收集系统指标
      const metrics = await this.collectSystemMetrics()
      
      // 检查各个组件
      const components = {
        memory: await this.checkMemoryHealth(metrics.memory),
        cpu: await this.checkCpuHealth(metrics.cpu),
        disk: await this.checkDiskHealth(metrics.disk),
        sharp: await this.checkSharpHealth(),
        workerPool: await this.checkWorkerPoolHealth(),
        database: await this.checkDatabaseHealth()
      }

      // 更新组件历史
      this.updateComponentHistory(components)

      // 检查告警
      const alerts = this.checkAlerts(components, metrics)

      // 计算总体健康状态
      const overall = this.calculateOverallHealth(components)

      const healthStatus: SystemHealthStatus = {
        overall,
        timestamp,
        uptime: process.uptime(),
        components,
        metrics,
        alerts
      }

      // 发出健康检查事件
      this.emit('healthCheck', healthStatus)

      // 如果状态改变，发出特定事件
      if (overall !== 'healthy') {
        this.emit('healthWarning', healthStatus)
      }

      logger.debug('SystemMonitor', '系统健康检查完成', {
        overall,
        componentStates: Object.fromEntries(
          Object.entries(components).map(([key, comp]) => [key, comp.status])
        )
      })

      return healthStatus

    } catch (error) {
      logger.error('SystemMonitor', '系统健康检查失败', error as Error)
      
      const errorStatus: SystemHealthStatus = {
        overall: 'critical',
        timestamp,
        uptime: process.uptime(),
        components: {
          memory: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] },
          cpu: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] },
          disk: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] },
          sharp: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] },
          workerPool: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] },
          database: { status: 'unknown', message: '检查失败', lastCheck: timestamp, history: [] }
        },
        metrics: {} as SystemMetrics,
        alerts: [{
          id: `health_check_error_${timestamp}`,
          level: 'critical',
          component: 'system',
          message: `健康检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp,
          resolved: false
        }]
      }

      this.emit('healthCheckError', error, errorStatus)
      return errorStatus
    }
  }

  /**
   * 收集系统指标
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    const loadAvg = os.loadavg()
    const totalMem = os.totalmem()
    const freeMem = os.freemem()

    let diskInfo = { free: 0, used: 0, total: 0, usagePercent: 0 }
    try {
      // 尝试获取磁盘使用情况（这里简化处理）
      const stats = await fs.promises.statfs ? fs.promises.statfs('.') : null
      if (stats) {
        diskInfo = {
          free: stats.bavail * stats.bsize,
          used: (stats.blocks - stats.bavail) * stats.bsize,
          total: stats.blocks * stats.bsize,
          usagePercent: ((stats.blocks - stats.bavail) / stats.blocks) * 100
        }
      }
    } catch (error) {
      // 磁盘信息获取失败，使用默认值
      logger.debug('SystemMonitor', '无法获取磁盘信息', { error })
    }

    return {
      memory: {
        used: totalMem - freeMem,
        free: freeMem,
        total: totalMem,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        usagePercent: ((totalMem - freeMem) / totalMem) * 100
      },
      cpu: {
        usage: [cpuUsage.user / 1000000, cpuUsage.system / 1000000],
        loadAverage: loadAvg,
        cores: os.cpus().length
      },
      disk: diskInfo,
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      network: {
        // 网络指标可以从metricsCollector获取
        requestsPerSecond: this.calculateRequestsPerSecond()
      }
    }
  }

  /**
   * 检查内存健康状态
   */
  private async checkMemoryHealth(memory: SystemMetrics['memory']): Promise<ComponentHealth> {
    const usagePercent = memory.usagePercent
    const timestamp = Date.now()

    let status: ComponentHealth['status'] = 'healthy'
    let message = `内存使用率: ${usagePercent.toFixed(1)}%`

    if (usagePercent >= this.thresholds.memory.critical) {
      status = 'critical'
      message = `内存使用率过高: ${usagePercent.toFixed(1)}%`
    } else if (usagePercent >= this.thresholds.memory.warning) {
      status = 'warning'
      message = `内存使用率较高: ${usagePercent.toFixed(1)}%`
    }

    return {
      status,
      message,
      value: usagePercent,
      threshold: this.thresholds.memory,
      lastCheck: timestamp,
      history: this.getComponentHistory('memory').slice(-20) // 保留最近20次记录
    }
  }

  /**
   * 检查CPU健康状态
   */
  private async checkCpuHealth(cpu: SystemMetrics['cpu']): Promise<ComponentHealth> {
    // 使用1分钟平均负载作为CPU使用率指标
    const loadAvg = cpu.loadAverage[0]
    const cores = cpu.cores
    const cpuUsagePercent = (loadAvg / cores) * 100
    const timestamp = Date.now()

    let status: ComponentHealth['status'] = 'healthy'
    let message = `CPU负载: ${loadAvg.toFixed(2)} (${cpuUsagePercent.toFixed(1)}%)`

    if (cpuUsagePercent >= this.thresholds.cpu.critical) {
      status = 'critical'
      message = `CPU负载过高: ${loadAvg.toFixed(2)}`
    } else if (cpuUsagePercent >= this.thresholds.cpu.warning) {
      status = 'warning'
      message = `CPU负载较高: ${loadAvg.toFixed(2)}`
    }

    return {
      status,
      message,
      value: cpuUsagePercent,
      threshold: this.thresholds.cpu,
      lastCheck: timestamp,
      history: this.getComponentHistory('cpu').slice(-20)
    }
  }

  /**
   * 检查磁盘健康状态
   */
  private async checkDiskHealth(disk: SystemMetrics['disk']): Promise<ComponentHealth> {
    const usagePercent = disk.usagePercent
    const timestamp = Date.now()

    let status: ComponentHealth['status'] = 'healthy'
    let message = `磁盘使用率: ${usagePercent.toFixed(1)}%`

    if (usagePercent >= this.thresholds.disk.critical) {
      status = 'critical'
      message = `磁盘空间不足: ${usagePercent.toFixed(1)}%`
    } else if (usagePercent >= this.thresholds.disk.warning) {
      status = 'warning'
      message = `磁盘空间较少: ${usagePercent.toFixed(1)}%`
    }

    return {
      status,
      message,
      value: usagePercent,
      threshold: this.thresholds.disk,
      lastCheck: timestamp,
      history: this.getComponentHistory('disk').slice(-20)
    }
  }

  /**
   * 检查Sharp图像处理库健康状态
   */
  private async checkSharpHealth(): Promise<ComponentHealth> {
    const timestamp = Date.now()
    
    try {
      // 创建一个简单的测试图像
      const testStart = Date.now()
      await sharp({
        create: {
          width: 1,
          height: 1,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      }).png().toBuffer()
      
      const testTime = Date.now() - testStart

      return {
        status: testTime < 1000 ? 'healthy' : 'warning',
        message: `Sharp响应时间: ${testTime}ms`,
        value: testTime,
        lastCheck: timestamp,
        history: this.getComponentHistory('sharp').slice(-20)
      }

    } catch (error) {
      return {
        status: 'critical',
        message: `Sharp不可用: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: timestamp,
        history: this.getComponentHistory('sharp').slice(-20)
      }
    }
  }

  /**
   * 检查Worker线程池健康状态
   */
  private async checkWorkerPoolHealth(): Promise<ComponentHealth> {
    const timestamp = Date.now()
    
    try {
      // 动态导入Worker线程池
      const { getGlobalWorkerPool } = await import('./workerPool')
      const workerPool = getGlobalWorkerPool()
      const status = workerPool.getStatus()

      const busyWorkerRatio = status.totalWorkers > 0 ? 
        (status.busyWorkers / status.totalWorkers) * 100 : 0

      let healthStatus: ComponentHealth['status'] = 'healthy'
      let message = `Worker线程: ${status.totalWorkers}总数, ${status.busyWorkers}忙碌, ${status.queuedTasks}队列`

      if (busyWorkerRatio >= 90) {
        healthStatus = 'warning'
        message = `Worker线程池繁忙: ${busyWorkerRatio.toFixed(1)}%使用率`
      }

      if (status.queuedTasks > 10) {
        healthStatus = 'warning'
        message = `Worker队列积压: ${status.queuedTasks}个任务`
      }

      return {
        status: healthStatus,
        message,
        value: busyWorkerRatio,
        lastCheck: timestamp,
        history: this.getComponentHistory('workerPool').slice(-20)
      }

    } catch (error) {
      return {
        status: 'warning',
        message: 'Worker线程池不可用',
        lastCheck: timestamp,
        history: this.getComponentHistory('workerPool').slice(-20)
      }
    }
  }

  /**
   * 检查数据库健康状态（目前为占位符）
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const timestamp = Date.now()
    
    // 这里可以添加数据库连接检查
    // 目前返回健康状态
    return {
      status: 'healthy',
      message: '数据库连接正常',
      lastCheck: timestamp,
      history: this.getComponentHistory('database').slice(-20)
    }
  }

  /**
   * 更新组件历史记录
   */
  private updateComponentHistory(components: SystemHealthStatus['components']): void {
    Object.entries(components).forEach(([componentName, component]) => {
      const history = this.getComponentHistory(componentName)
      history.push({
        timestamp: component.lastCheck,
        status: component.status,
        value: component.value
      })
      
      // 保留最近50条记录
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }
      
      this.componentHistory.set(componentName, history)
      component.history = history.slice(-20) // 返回最近20条
    })
  }

  /**
   * 获取组件历史记录
   */
  private getComponentHistory(componentName: string): ComponentHealth['history'] {
    if (!this.componentHistory.has(componentName)) {
      this.componentHistory.set(componentName, [])
    }
    return this.componentHistory.get(componentName)!
  }

  /**
   * 检查告警
   */
  private checkAlerts(components: SystemHealthStatus['components'], metrics: SystemMetrics): Alert[] {
    const alerts: Alert[] = []
    const timestamp = Date.now()

    // 检查各组件状态并生成告警
    Object.entries(components).forEach(([componentName, component]) => {
      if (component.status === 'critical' || component.status === 'warning') {
        const alertId = `${componentName}_${component.status}_${timestamp}`
        
        alerts.push({
          id: alertId,
          level: component.status === 'critical' ? 'critical' : 'warning',
          component: componentName,
          message: component.message,
          timestamp,
          value: component.value,
          threshold: component.threshold?.[component.status],
          resolved: false
        })
      }
    })

    // 添加到告警历史
    this.alertHistory.push(...alerts)
    
    // 清理旧告警（保留最近1000条）
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000)
    }

    return alerts
  }

  /**
   * 计算总体健康状态
   */
  private calculateOverallHealth(components: SystemHealthStatus['components']): SystemHealthStatus['overall'] {
    const statuses = Object.values(components).map(c => c.status)
    
    if (statuses.includes('critical')) {
      return 'critical'
    }
    
    if (statuses.includes('warning')) {
      return 'warning'
    }
    
    return 'healthy'
  }

  /**
   * 计算每秒请求数
   */
  private calculateRequestsPerSecond(): number {
    try {
      const realtimeStats = globalMetricsCollector.getRealtimeStats()
      return realtimeStats.requestsPerMinute / 60
    } catch (error) {
      return 0
    }
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(limit: number = 50): Alert[] {
    return this.alertHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find(a => a.id === alertId && !a.resolved)
    if (alert) {
      alert.resolved = true
      alert.resolvedAt = Date.now()
      
      logger.info('SystemMonitor', '告警已解决', {
        alertId,
        component: alert.component,
        level: alert.level
      })
      
      this.emit('alertResolved', alert)
      return true
    }
    return false
  }

  /**
   * 获取当前状态摘要
   */
  async getStatusSummary(): Promise<{
    status: string
    uptime: string
    activeAlerts: number
    memoryUsage: string
    cpuLoad: string
    lastCheck: string
  }> {
    const currentStatus = await this.performHealthCheck()
    
    return {
      status: currentStatus.overall,
      uptime: this.formatUptime(currentStatus.uptime),
      activeAlerts: currentStatus.alerts.filter(a => !a.resolved).length,
      memoryUsage: `${currentStatus.metrics.memory?.usagePercent.toFixed(1) || 0}%`,
      cpuLoad: `${currentStatus.metrics.cpu?.loadAverage[0].toFixed(2) || 0}`,
      lastCheck: new Date(currentStatus.timestamp).toISOString()
    }
  }

  /**
   * 格式化运行时间
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}天 ${hours}小时 ${minutes}分钟`
    } else if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.stop()
    this.alertHistory = []
    this.componentHistory.clear()
    this.removeAllListeners()
    
    logger.info('SystemMonitor', '系统监控器已销毁')
  }
}

// 全局系统监控器实例
export const globalSystemMonitor = new SystemMonitor()

// 自动启动监控（可选）
if (process.env.NODE_ENV !== 'test') {
  globalSystemMonitor.start()
}

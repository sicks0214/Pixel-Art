/**
 * 图像处理Worker线程
 * 用于在独立线程中处理大型图像，避免阻塞主线程
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')
const sharp = require('sharp')

if (!isMainThread && parentPort) {
  // Worker线程逻辑
  parentPort.on('message', async (task) => {
    try {
      console.log('[ImageWorker] 收到处理任务:', {
        taskId: task.id,
        type: task.type,
        imageSize: task.imageData ? `${task.width}x${task.height}` : 'unknown'
      })

      let result
      
      switch (task.type) {
        case 'resize':
          result = await processResize(task)
          break
        case 'quantize':
          result = await processQuantize(task)
          break
        case 'dither':
          result = await processDither(task)
          break
        case 'pixelArt':
          result = await processPixelArtEffect(task)
          break
        default:
          throw new Error(`未知的任务类型: ${task.type}`)
      }

      // 发送成功结果
      parentPort.postMessage({
        success: true,
        taskId: task.id,
        result
      })

    } catch (error) {
      console.error('[ImageWorker] 处理任务失败:', error)
      
      // 发送错误结果
      parentPort.postMessage({
        success: false,
        taskId: task.id,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code || 'WORKER_ERROR'
        }
      })
    }
  })

  /**
   * 处理图像缩放任务
   */
  async function processResize(task) {
    const { imageBuffer, width, height, interpolation } = task
    
    console.log('[ImageWorker] 开始图像缩放:', {
      targetSize: `${width}x${height}`,
      interpolation
    })

    const kernel = interpolation === 'nearest_neighbor' ? 'nearest' : 'lanczos3'
    
    const { data, info } = await sharp(imageBuffer)
      .resize(width, height, {
        kernel,
        fit: 'fill'
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    return {
      data: data,
      width: info.width,
      height: info.height,
      channels: info.channels
    }
  }

  /**
   * 处理颜色量化任务
   */
  async function processQuantize(task) {
    const { imageData, width, height, maxColors } = task
    
    console.log('[ImageWorker] 开始颜色量化:', {
      size: `${width}x${height}`,
      maxColors
    })

    // 实现简化的颜色量化算法
    const quantizedData = Buffer.alloc(imageData.length)
    const colorMap = new Map()
    const palette = []

    // 简化的中位切分算法
    for (let i = 0; i < imageData.length; i += 3) {
      const r = imageData[i]
      const g = imageData[i + 1]
      const b = imageData[i + 2]
      
      // 量化到较少的颜色级别
      const quantR = Math.round(r / 32) * 32
      const quantG = Math.round(g / 32) * 32
      const quantB = Math.round(b / 32) * 32
      
      quantizedData[i] = quantR
      quantizedData[i + 1] = quantG
      quantizedData[i + 2] = quantB
      
      const colorKey = `${quantR},${quantG},${quantB}`
      if (!colorMap.has(colorKey) && palette.length < maxColors) {
        colorMap.set(colorKey, true)
        palette.push(`#${quantR.toString(16).padStart(2, '0')}${quantG.toString(16).padStart(2, '0')}${quantB.toString(16).padStart(2, '0')}`)
      }
    }

    return {
      data: quantizedData,
      palette: palette
    }
  }

  /**
   * 处理抖动任务
   */
  async function processDither(task) {
    const { imageData, width, height, ditheringRatio } = task
    
    console.log('[ImageWorker] 开始抖动处理:', {
      size: `${width}x${height}`,
      ratio: ditheringRatio
    })

    const ditheredData = Buffer.alloc(imageData.length)
    const palette = []
    
    // 拜耳矩阵 8x8
    const bayerMatrix = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ]
    
    const colorSet = new Set()
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 3
        
        const r = imageData[index]
        const g = imageData[index + 1]
        const b = imageData[index + 2]
        
        // 获取拜耳矩阵值
        const bayerValue = bayerMatrix[y % 8][x % 8]
        const threshold = (bayerValue / 64 - 0.5) * ditheringRatio * 255
        
        // 应用抖动
        const adjustedR = Math.max(0, Math.min(255, r + threshold))
        const adjustedG = Math.max(0, Math.min(255, g + threshold))
        const adjustedB = Math.max(0, Math.min(255, b + threshold))
        
        // 量化
        const quantR = Math.round(adjustedR / 64) * 64
        const quantG = Math.round(adjustedG / 64) * 64
        const quantB = Math.round(adjustedB / 64) * 64
        
        ditheredData[index] = quantR
        ditheredData[index + 1] = quantG
        ditheredData[index + 2] = quantB
        
        // 收集调色板
        const colorHex = `#${quantR.toString(16).padStart(2, '0')}${quantG.toString(16).padStart(2, '0')}${quantB.toString(16).padStart(2, '0')}`
        colorSet.add(colorHex)
      }
    }

    return {
      data: ditheredData,
      palette: Array.from(colorSet).slice(0, 64)
    }
  }

  /**
   * 处理像素画效果任务
   */
  async function processPixelArtEffect(task) {
    const { imageData, width, height } = task
    
    console.log('[ImageWorker] 开始像素画效果处理:', {
      size: `${width}x${height}`
    })

    // 转换为PNG格式
    const pngBuffer = await sharp(imageData, {
      raw: {
        width: width,
        height: height,
        channels: 3
      }
    })
    .png({
      compressionLevel: 6,
      colors: 256
    })
    .toBuffer()

    return {
      data: pngBuffer,
      width: width,
      height: height
    }
  }

  console.log('[ImageWorker] Worker线程已启动并准备就绪')
}

module.exports = {
  // 如果这个文件被直接运行（作为Worker），则不导出任何内容
  // 如果被require，则可以导出一些工具函数（目前为空）
}

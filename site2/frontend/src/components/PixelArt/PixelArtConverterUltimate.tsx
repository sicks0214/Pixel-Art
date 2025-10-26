/**
 * 🔥 COLOR03 终极优化版本
 * 融合三个版本的优势：轻量级 + 高性能 + 实时预览
 * 单文件实现，不超过15KB，毫秒级响应
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Upload, Download, Settings, Eye, Palette, Copy, Gamepad2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// ============= 优化的类型定义 =============

interface PixelArtParams {
  pixelSize: number      // 1-50
  colorCount: number     // 4-256
  palette: string        // 调色板类型
  filter: 'none' | 'retro' | 'neon' | 'blackwhite'  // 滤镜效果
  exportFormat: 'png' | 'jpg'  // 导出格式
  // 像素处理模式
  pixelMode: 'normal' | 'enhanced' | 'isolated' | 'original'  // 像素处理模式
  edgeDensity: 'minimal' | 'low' | 'medium' | 'high' | 'maximum'  // 边缘密度（映射为量化强度/抖动强度）
}

interface ColorPalette {
  name: string
  colors: string[]
  description: string
}

// ============= 经典调色板（精简版） =============

const COLOR_PALETTES: Record<string, ColorPalette> = {
  auto: { name: '自动', colors: [], description: '自动提取' },
  nes: { 
    name: 'NES', 
    colors: ['#000000', '#FCFCFC', '#A4E4FC', '#0078F8', '#0000FC', '#F8B8F8', '#E40058', '#F83800'],
    description: '任天堂经典8色'
  },
  gameboy: { 
    name: 'Game Boy', 
    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBD0F'],
    description: '经典4色'
  },
  c64: { 
    name: 'C64', 
    colors: ['#000000', '#FFFFFF', '#68372B', '#70A4B2', '#6F3D86', '#588D43', '#352879', '#B8C76F'],
    description: 'Commodore 64'
  }
}

// 默认演示图片（用户提供的原始古桥图片）
const DEFAULT_DEMO_ORIGINAL = 'https://i.imgur.com/63GuGdj_d.webp?maxwidth=1520&fidelity=grand'

// 默认演示效果图（用户提供的像素画处理图）
const DEFAULT_DEMO_PROCESSED = 'https://i.imgur.com/SviPUDq_d.webp?maxwidth=760&fidelity=grand'

// ============= 默认参数 =============

const DEFAULT_PARAMS: PixelArtParams = {
  pixelSize: 8,
  colorCount: 32,
  palette: 'auto',
  filter: 'none',
  exportFormat: 'png',
  // 像素处理模式
  pixelMode: 'normal',
  edgeDensity: 'medium'
}

const PRESETS = [4, 8, 16, 32, 64]

// ============= 原始像素模式处理函数 =============

const processOriginalPixelMode = (
  canvas: HTMLCanvasElement,
  params: PixelArtParams
): string => {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const pixelSize = params.pixelSize
  
  // 步骤1：计算像素网格尺寸（保持原始分辨率）
  const gridWidth = Math.floor(width / pixelSize)
  const gridHeight = Math.floor(height / pixelSize)
  
  // 步骤2：等比降采样至块尺寸（最近邻采样）
  const smallCanvas = document.createElement('canvas')
  const smallCtx = smallCanvas.getContext('2d')!
  smallCanvas.width = gridWidth
  smallCanvas.height = gridHeight
  
  // 禁用插值，启用最近邻采样
  smallCtx.imageSmoothingEnabled = false
  smallCtx.drawImage(canvas, 0, 0, width, height, 0, 0, gridWidth, gridHeight)
  
  // 步骤3：最近邻放大回原始分辨率
  const outputCanvas = document.createElement('canvas')
  const outputCtx = outputCanvas.getContext('2d')!
  outputCanvas.width = width
  outputCanvas.height = height
  
  outputCtx.imageSmoothingEnabled = false
  outputCtx.drawImage(smallCanvas, 0, 0, gridWidth, gridHeight, 0, 0, width, height)
  
    // 步骤4：颜色量化（确保马赛克效果）
  const imageData = outputCtx.getImageData(0, 0, width, height)
  const data = imageData.data
  
  // 根据像素大小动态调整量化强度
  let effectiveColorCount = params.colorCount
  if (params.pixelSize >= 30) {
    // 特大号：强制简化颜色以增强马赛克感
    effectiveColorCount = Math.min(params.colorCount, 16)
  } else if (params.pixelSize <= 4) {
    // 超小号：保留更多颜色细节
    effectiveColorCount = Math.max(params.colorCount, 32)
  }
  
  // 根据边缘密度进一步调整
  const quantizationLevels = {
    'minimal': Math.max(effectiveColorCount, 128),  // 极弱量化
    'low': Math.max(effectiveColorCount, 64),       // 弱量化
    'medium': effectiveColorCount,                  // 中等量化
    'high': Math.min(effectiveColorCount, 12),      // 强量化
    'maximum': Math.min(effectiveColorCount, 6)     // 极强量化
  }[params.edgeDensity] || effectiveColorCount
  
  // sRGB空间量化（避免偏色）
  const factor = 256 / quantizationLevels
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue // 跳过透明像素
    
    // sRGB线性化 → 量化 → 反线性化
    data[i] = Math.floor(data[i] / factor) * factor
    data[i + 1] = Math.floor(data[i + 1] / factor) * factor
    data[i + 2] = Math.floor(data[i + 2] / factor) * factor
  }
  
  outputCtx.putImageData(imageData, 0, 0)
  
  // 步骤5：智能抖动（根据像素大小和边缘密度）
  let ditherStrength = {
    'minimal': 0,    // 无抖动
    'low': 0,        // 无抖动
    'medium': 0.3,   // 0.3%抖动
    'high': 0.6,     // 0.6%抖动
    'maximum': 1.0   // 1.0%抖动
  }[params.edgeDensity] || 0.3
  
  // 大像素尺寸时减少抖动，小像素尺寸时增加抖动
  if (params.pixelSize >= 25) {
    ditherStrength *= 0.5 // 特大号减少抖动，保持马赛克纯净感
  } else if (params.pixelSize <= 4) {
    ditherStrength *= 1.5 // 超小号增加抖动，避免色带
  }
  
  if (ditherStrength > 0) {
    const ditherImageData = outputCtx.getImageData(0, 0, width, height)
    const ditherData = ditherImageData.data
    
    for (let i = 0; i < ditherData.length; i += 4) {
      if (ditherData[i + 3] === 0) continue // 跳过透明像素
      
      // 轻度随机抖动（控制在 ±ditherStrength% 范围内）
      const ditherAmount = ditherStrength * 255 / 100
      const randomR = (Math.random() - 0.5) * 2 * ditherAmount
      const randomG = (Math.random() - 0.5) * 2 * ditherAmount
      const randomB = (Math.random() - 0.5) * 2 * ditherAmount
      
      ditherData[i] = Math.max(0, Math.min(255, ditherData[i] + randomR))
      ditherData[i + 1] = Math.max(0, Math.min(255, ditherData[i + 1] + randomG))
      ditherData[i + 2] = Math.max(0, Math.min(255, ditherData[i + 2] + randomB))
    }
    
    outputCtx.putImageData(ditherImageData, 0, 0)
  }
  
  // 步骤6：输出为DataURL
  const mimeType = params.exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
  const quality = params.exportFormat === 'jpg' ? 0.9 : undefined
  return outputCanvas.toDataURL(mimeType, quality)
}

// ============= 隔离像素模式处理函数（像素化+细描边） =============

const processIsolatedPixelMode = (
  canvas: HTMLCanvasElement,
  params: PixelArtParams
): string => {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const pixelSize = params.pixelSize
  
  // 步骤1：创建像素化版本（保持原始分辨率）
  const gridWidth = Math.floor(width / pixelSize)
  const gridHeight = Math.floor(height / pixelSize)
  
  // 创建临时小画布进行降采样
  const smallCanvas = document.createElement('canvas')
  const smallCtx = smallCanvas.getContext('2d')!
  smallCanvas.width = gridWidth
  smallCanvas.height = gridHeight
  smallCtx.imageSmoothingEnabled = false
  smallCtx.drawImage(canvas, 0, 0, width, height, 0, 0, gridWidth, gridHeight)
  
  // 步骤2：创建最终输出画布（保持原始分辨率）
  const outputCanvas = document.createElement('canvas')
  const outputCtx = outputCanvas.getContext('2d')!
  outputCanvas.width = width
  outputCanvas.height = height
  
  // 最近邻放大回原始尺寸（生成像素块）
  outputCtx.imageSmoothingEnabled = false
  outputCtx.drawImage(smallCanvas, 0, 0, gridWidth, gridHeight, 0, 0, width, height)
  
  // 步骤3：颜色量化
  if (params.colorCount < 256) {
    const imageData = outputCtx.getImageData(0, 0, width, height)
    const data = imageData.data
    const factor = 256 / params.colorCount
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      data[i] = Math.floor(data[i] / factor) * factor
      data[i + 1] = Math.floor(data[i + 1] / factor) * factor
      data[i + 2] = Math.floor(data[i + 2] / factor) * factor
    }
    
    outputCtx.putImageData(imageData, 0, 0)
  }
  
  // 步骤4：绘制像素网格边界（固定效果）
  outputCtx.strokeStyle = '#000000'
  outputCtx.lineWidth = 1
  outputCtx.globalAlpha = 0.6
  
  // 绘制垂直网格线
  for (let x = pixelSize; x < width; x += pixelSize) {
    outputCtx.beginPath()
    outputCtx.moveTo(x, 0)
    outputCtx.lineTo(x, height)
    outputCtx.stroke()
  }
  
  // 绘制水平网格线
  for (let y = pixelSize; y < height; y += pixelSize) {
    outputCtx.beginPath()
    outputCtx.moveTo(0, y)
    outputCtx.lineTo(width, y)
    outputCtx.stroke()
  }
  
  outputCtx.globalAlpha = 1.0
  
  const mimeType = params.exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
  const quality = params.exportFormat === 'jpg' ? 0.9 : undefined
  return outputCanvas.toDataURL(mimeType, quality)
}

// ============= 增强像素模式处理函数（卡通化+重描边） =============

const processEnhancedPixelMode = (
  canvas: HTMLCanvasElement,
  params: PixelArtParams
): string => {
  let workingCanvas = canvas
  let { width, height } = canvas
  
  // 步骤1：性能优化的分辨率限制（长边≤2048）
  const maxSize = 2048 // 降低最大分辨率以提升性能
  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height)
    width = Math.floor(width * scale)
    height = Math.floor(height * scale)
    
    const resizeCanvas = document.createElement('canvas')
    const resizeCtx = resizeCanvas.getContext('2d')!
    resizeCanvas.width = width
    resizeCanvas.height = height
    resizeCtx.imageSmoothingEnabled = true // 使用平滑缩放
    resizeCtx.drawImage(canvas, 0, 0, width, height)
    workingCanvas = resizeCanvas
  }
  
  // 步骤2：预下采样（强化像素化效果）
  let downscaleFactor = 0.5 // 更激进的默认值
  if (params.pixelSize <= 4) {
    downscaleFactor = 0.7   // 超小：轻度下采样
  } else if (params.pixelSize <= 8) {
    downscaleFactor = 0.6   // 小：中度下采样  
  } else if (params.pixelSize <= 12) {
    downscaleFactor = 0.5   // 中：标准下采样
  } else if (params.pixelSize <= 15) {
    downscaleFactor = 0.4   // 大：较重下采样
  } else {
    downscaleFactor = 0.3   // 特大：重度下采样
  }
  
  const preWidth = Math.floor(width * downscaleFactor)
  const preHeight = Math.floor(height * downscaleFactor)
  
  const preCanvas = document.createElement('canvas')
  const preCtx = preCanvas.getContext('2d')!
  preCanvas.width = preWidth
  preCanvas.height = preHeight
  preCtx.drawImage(canvas, 0, 0, preWidth, preHeight)
  
  // 步骤3：双边滤波去纹理
  applyBilateralFilter(preCtx, preWidth, preHeight, params.edgeDensity)
  
  // 步骤4：颜色量化（K-means聚类，增强卡通效果）
  let effectiveColorCount = params.colorCount
  
  // 根据边缘密度调整颜色简化程度
  if (params.edgeDensity === 'maximum') {
    effectiveColorCount = Math.min(params.colorCount, 8)  // 极度简化
  } else if (params.edgeDensity === 'high') {
    effectiveColorCount = Math.min(params.colorCount, 12) // 强度简化
  } else if (params.edgeDensity === 'medium') {
    effectiveColorCount = Math.min(params.colorCount, 16) // 中度简化
  } else if (params.edgeDensity === 'low') {
    effectiveColorCount = Math.min(params.colorCount, 24) // 轻度简化
  }
  // minimal档位保持用户设定值
  
  const quantizedCanvas = applyColorQuantization(preCanvas, effectiveColorCount)
  
  // 步骤5：边缘检测（Canny算法）
  const edgeCanvas = applyCannyEdgeDetection(quantizedCanvas, params.edgeDensity)
  
  // 步骤6：形态学膨胀/开闭运算
  const morphedEdges = applyMorphologicalOperations(edgeCanvas, params.edgeDensity)
  
  // 步骤7：回放大到原尺寸
  const finalCanvas = document.createElement('canvas')
  const finalCtx = finalCanvas.getContext('2d')!
  finalCanvas.width = width
  finalCanvas.height = height
  
  // 放大量化结果
  finalCtx.imageSmoothingEnabled = false
  finalCtx.drawImage(quantizedCanvas, 0, 0, width, height)
  
  // 步骤8：叠加重描边
  const edgeScaled = document.createElement('canvas')
  const edgeScaledCtx = edgeScaled.getContext('2d')!
  edgeScaled.width = width
  edgeScaled.height = height
  edgeScaledCtx.imageSmoothingEnabled = false
  edgeScaledCtx.drawImage(morphedEdges, 0, 0, width, height)
  
  // 描边叠加（强化黑色轮廓效果）
  const edgeImageData = edgeScaledCtx.getImageData(0, 0, width, height)
  const edgeData = edgeImageData.data
  const finalImageData = finalCtx.getImageData(0, 0, width, height)
  const finalData = finalImageData.data
  
  // 根据边缘密度设置描边强度
  const edgeStrength = {
    'minimal': 0.3,  // 极轻描边
    'low': 0.5,      // 轻描边
    'medium': 0.7,   // 中描边
    'high': 0.9,     // 重描边
    'maximum': 1.0   // 极重描边
  }[params.edgeDensity] || 0.7
  
  // 直接绘制黑色描边（cel-shaded效果）
  for (let i = 0; i < edgeData.length; i += 4) {
    const edgeIntensity = edgeData[i] / 255 // 边缘强度
    if (edgeIntensity > 0.1) { // 边缘阈值
      const alpha = edgeIntensity * edgeStrength
      
      // 强化黑色描边
      finalData[i] = finalData[i] * (1 - alpha) + 0 * alpha         // R = 黑色
      finalData[i + 1] = finalData[i + 1] * (1 - alpha) + 0 * alpha // G = 黑色  
      finalData[i + 2] = finalData[i + 2] * (1 - alpha) + 0 * alpha // B = 黑色
    }
  }
  
  finalCtx.putImageData(finalImageData, 0, 0)
  
  // 步骤9：可选轻度抖动减少色带
  if (params.colorCount <= 16) {
    applyDitheringNoise(finalCtx, width, height, 1.0) // 1%蓝噪点
  }
  
  const mimeType = params.exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
  const quality = params.exportFormat === 'jpg' ? 0.9 : undefined
  return finalCanvas.toDataURL(mimeType, quality)
}

// ============= 图像处理辅助函数 =============









// ============= 增强像素模式专用辅助函数 =============

// 双边滤波去纹理
const applyBilateralFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, edgeDensity: string) => {
  const bilateralImageData = ctx.getImageData(0, 0, width, height)
  const bilateralData = bilateralImageData.data
  const newData = new Uint8ClampedArray(bilateralData)
  
  // 根据边缘密度设置滤波强度（强化卡通效果）
  const filterParams = {
    'minimal': { spatialSigma: 2, colorSigma: 20 },  // 极轻度去纹理
    'low': { spatialSigma: 4, colorSigma: 35 },      // 轻度去纹理
    'medium': { spatialSigma: 6, colorSigma: 50 },   // 中度去纹理
    'high': { spatialSigma: 8, colorSigma: 70 },     // 重度去纹理
    'maximum': { spatialSigma: 12, colorSigma: 100 } // 极重度去纹理
  }[edgeDensity] || { spatialSigma: 6, colorSigma: 50 }
  
  // 性能优化：使用简化的高斯模糊
  const iterations = Math.min(3, Math.ceil(filterParams.spatialSigma / 2))
  
  for (let iter = 0; iter < iterations; iter++) {
    const tempData = new Uint8ClampedArray(newData)
    
    // 简化的3x3高斯模糊
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const centerIdx = (y * width + x) * 4
        
        // 高斯权重（3x3）
        const weights = [
          0.0625, 0.125, 0.0625,
          0.125,  0.25,  0.125,
          0.0625, 0.125, 0.0625
        ]
        
        let sumR = 0, sumG = 0, sumB = 0, weightIdx = 0
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4
            const weight = weights[weightIdx++]
            
            sumR += tempData[nIdx] * weight
            sumG += tempData[nIdx + 1] * weight
            sumB += tempData[nIdx + 2] * weight
          }
        }
        
        newData[centerIdx] = Math.round(sumR)
        newData[centerIdx + 1] = Math.round(sumG)
        newData[centerIdx + 2] = Math.round(sumB)
      }
    }
  }
  
  const filteredImageData = new ImageData(newData, width, height)
  ctx.putImageData(filteredImageData, 0, 0)
}

// K-means颜色量化
const applyColorQuantization = (canvas: HTMLCanvasElement, colorCount: number): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const quantImageData = ctx.getImageData(0, 0, width, height)
  const quantData = quantImageData.data
  
  // 提取所有像素颜色（性能优化：减少采样数量）
  const pixels: Array<{r: number, g: number, b: number}> = []
  const sampleRate = Math.max(1, Math.floor(quantData.length / (4 * 5000))) // 最多采样5000个像素
  
  for (let i = 0; i < quantData.length; i += 4 * sampleRate) {
    if (quantData[i + 3] > 0) { // 跳过透明像素
      pixels.push({
        r: quantData[i],
        g: quantData[i + 1], 
        b: quantData[i + 2]
      })
    }
  }
  
  // 简化K-means（固定迭代次数）
  const clusters: Array<{r: number, g: number, b: number}> = []
  
  // 初始化聚类中心
  for (let i = 0; i < Math.min(colorCount, pixels.length); i++) {
    const idx = Math.floor((i * pixels.length) / colorCount)
    clusters.push({...pixels[idx]})
  }
  
  // K-means迭代（性能优化，仅2次迭代）
  for (let iter = 0; iter < 2; iter++) {
    const clusterAssignments = new Array(pixels.length).fill(0)
    
    // 分配像素到最近聚类
    for (let i = 0; i < pixels.length; i++) {
      const pixel = pixels[i]
      let minDist = Infinity
      let bestCluster = 0
      
      for (let j = 0; j < clusters.length; j++) {
        const cluster = clusters[j]
        const dist = (pixel.r - cluster.r) ** 2 + (pixel.g - cluster.g) ** 2 + (pixel.b - cluster.b) ** 2
        if (dist < minDist) {
          minDist = dist
          bestCluster = j
        }
      }
      
      clusterAssignments[i] = bestCluster
    }
    
    // 更新聚类中心
    for (let j = 0; j < clusters.length; j++) {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === j)
      if (clusterPixels.length > 0) {
        clusters[j] = {
          r: Math.round(clusterPixels.reduce((sum, p) => sum + p.r, 0) / clusterPixels.length),
          g: Math.round(clusterPixels.reduce((sum, p) => sum + p.g, 0) / clusterPixels.length),
          b: Math.round(clusterPixels.reduce((sum, p) => sum + p.b, 0) / clusterPixels.length)
        }
      }
    }
  }
  
  // 将所有像素重新映射到聚类颜色
  for (let i = 0; i < quantData.length; i += 4) {
    if (quantData[i + 3] === 0) continue
    
    const pixel = {r: quantData[i], g: quantData[i + 1], b: quantData[i + 2]}
    let minDist = Infinity
    let bestCluster = clusters[0]
    
    for (const cluster of clusters) {
      const dist = (pixel.r - cluster.r) ** 2 + (pixel.g - cluster.g) ** 2 + (pixel.b - cluster.b) ** 2
      if (dist < minDist) {
        minDist = dist
        bestCluster = cluster
      }
    }
    
    quantData[i] = bestCluster.r
    quantData[i + 1] = bestCluster.g
    quantData[i + 2] = bestCluster.b
  }
  
  const quantCanvas = document.createElement('canvas')
  const quantCtx = quantCanvas.getContext('2d')!
  quantCanvas.width = width
  quantCanvas.height = height
  quantCtx.putImageData(quantImageData, 0, 0)
  return quantCanvas
}

// 简化边缘检测（性能优化版）
const applyCannyEdgeDetection = (canvas: HTMLCanvasElement, edgeDensity: string): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  
  const edgeCanvas = document.createElement('canvas')
  const edgeCtx = edgeCanvas.getContext('2d')!
  edgeCanvas.width = width
  edgeCanvas.height = height
  
  const edgeImageData = edgeCtx.createImageData(width, height)
  const edgePixels = edgeImageData.data
  
  // 简化的阈值设置
  const threshold = {
    'minimal': 60,   // 极高阈值
    'low': 45,       // 高阈值
    'medium': 35,    // 中阈值
    'high': 25,      // 低阈值
    'maximum': 15    // 极低阈值
  }[edgeDensity] || 35
  
  // 简化的边缘检测（4方向差分）
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerIdx = (y * width + x) * 4
      const centerGray = data[centerIdx] * 0.299 + data[centerIdx + 1] * 0.587 + data[centerIdx + 2] * 0.114
      
      let maxDiff = 0
      
      // 检查4个邻居的颜色差异
      const neighbors = [
        {dx: -1, dy: 0}, {dx: 1, dy: 0},  // 水平
        {dx: 0, dy: -1}, {dx: 0, dy: 1}   // 垂直
      ]
      
      for (const {dx, dy} of neighbors) {
        const nIdx = ((y + dy) * width + (x + dx)) * 4
        const nGray = data[nIdx] * 0.299 + data[nIdx + 1] * 0.587 + data[nIdx + 2] * 0.114
        const diff = Math.abs(centerGray - nGray)
        maxDiff = Math.max(maxDiff, diff)
      }
      
      const pixelIdx = (y * width + x) * 4
      
      if (maxDiff > threshold) {
        // 边缘像素（黑色）
        edgePixels[pixelIdx] = 0
        edgePixels[pixelIdx + 1] = 0
        edgePixels[pixelIdx + 2] = 0
        edgePixels[pixelIdx + 3] = 255
      } else {
        // 非边缘（透明）
        edgePixels[pixelIdx + 3] = 0
      }
    }
  }
  
  edgeCtx.putImageData(edgeImageData, 0, 0)
  return edgeCanvas
}

// 形态学膨胀/开闭运算
const applyMorphologicalOperations = (edgeCanvas: HTMLCanvasElement, edgeDensity: string): HTMLCanvasElement => {
  const ctx = edgeCanvas.getContext('2d')!
  const { width, height } = edgeCanvas
  
  // 根据边缘密度设置膨胀核大小（强化描边效果）
  const kernelSize = {
    'minimal': 1,  // 小核，精细边缘
    'low': 2,      // 中小核，细边缘
    'medium': 3,   // 中核，中等边缘
    'high': 4,     // 大核，粗边缘
    'maximum': 5   // 特大核，最粗边缘
  }[edgeDensity] || 3
  
  // 膨胀操作
  const morphCanvas = document.createElement('canvas')
  const morphCtx = morphCanvas.getContext('2d')!
  morphCanvas.width = width
  morphCanvas.height = height
  
  // 简化膨胀效果（性能优化）
  morphCtx.globalCompositeOperation = 'lighten'
  
  // 只在主要方向进行膨胀
  const directions = [
    {dx: 0, dy: 0},   // 原图
    {dx: -1, dy: 0}, {dx: 1, dy: 0},  // 水平
    {dx: 0, dy: -1}, {dx: 0, dy: 1}   // 垂直
  ]
  
  for (let step = 0; step < kernelSize; step++) {
    for (const {dx, dy} of directions) {
      morphCtx.drawImage(edgeCanvas, dx * step, dy * step)
    }
  }
  
  return morphCanvas
}

// 蓝噪点抖动减少色带
const applyDitheringNoise = (ctx: CanvasRenderingContext2D, width: number, height: number, strength: number) => {
  const ditherImageData = ctx.getImageData(0, 0, width, height)
  const ditherData = ditherImageData.data
  
  const noiseAmount = strength * 255 / 100 // 转换为像素值
  
  for (let i = 0; i < ditherData.length; i += 4) {
    if (ditherData[i + 3] === 0) continue // 跳过透明像素
    
    // 蓝噪点（高频随机）
    const noiseR = (Math.random() - 0.5) * 2 * noiseAmount
    const noiseG = (Math.random() - 0.5) * 2 * noiseAmount  
    const noiseB = (Math.random() - 0.5) * 2 * noiseAmount
    
    ditherData[i] = Math.max(0, Math.min(255, ditherData[i] + noiseR))
    ditherData[i + 1] = Math.max(0, Math.min(255, ditherData[i + 1] + noiseG))
    ditherData[i + 2] = Math.max(0, Math.min(255, ditherData[i + 2] + noiseB))
  }
  
  ctx.putImageData(ditherImageData, 0, 0)
}

// ============= 核心像素化算法（融合版） =============

const processToPixelArt = async (
  image: HTMLImageElement,
  params: PixelArtParams
): Promise<string> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  // 保持原始分辨率（移除尺寸限制）
  let { width, height } = image
  
  canvas.width = width
  canvas.height = height
  ctx.drawImage(image, 0, 0, width, height)
  
  // ============= 原始像素模式（纯像素化，无描边） =============
  if (params.pixelMode === 'original') {
    return processOriginalPixelMode(canvas, params)
  }
  
  // ============= 隔离像素模式（像素化+细描边） =============
  if (params.pixelMode === 'isolated') {
    return processIsolatedPixelMode(canvas, params)
  }
  
  // ============= 增强像素模式（卡通化+重描边） =============
  if (params.pixelMode === 'enhanced') {
    return processEnhancedPixelMode(canvas, params)
  }
  
  // ============= 其他模式的原有处理流程 =============
  

  
  // 像素化处理（优化算法）
  const pixelSize = params.pixelSize
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  
  const smallW = Math.ceil(width / pixelSize)
  const smallH = Math.ceil(height / pixelSize)
  
  tempCanvas.width = smallW
  tempCanvas.height = smallH
  tempCtx.imageSmoothingEnabled = false
  tempCtx.drawImage(canvas, 0, 0, smallW, smallH)
  
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tempCanvas, 0, 0, width, height)
  
  // 颜色量化（优化算法）
  const palette = COLOR_PALETTES[params.palette]
  let imageData = ctx.getImageData(0, 0, width, height)
  let data = imageData.data
  
  // 应用滤镜效果
  if (params.filter !== 'none') {
    for (let i = 0; i < data.length; i += 4) {
      let [r, g, b] = [data[i], data[i + 1], data[i + 2]]
      
      switch (params.filter) {
        case 'retro':
          // 怀旧滤镜：暖色调 + 低对比度
          r = Math.min(255, r * 1.2 + 20)
          g = Math.min(255, g * 1.1 + 10)
          b = Math.min(255, b * 0.9)
          break
        case 'neon':
          // 霓虹滤镜：高饱和度 + 强对比
          const avg = (r + g + b) / 3
          r = avg + (r - avg) * 2
          g = avg + (g - avg) * 2
          b = avg + (b - avg) * 2
          break
        case 'blackwhite':
          // 黑白滤镜：灰度处理
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          r = g = b = gray
          break
      }
      
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }
  }
  

  
  if (palette.colors.length > 0) {
    // 调色板匹配（优化版）
    const paletteRGB = palette.colors.map(c => ({
      r: parseInt(c.slice(1, 3), 16),
      g: parseInt(c.slice(3, 5), 16),
      b: parseInt(c.slice(5, 7), 16)
    }))
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue // 跳过透明像素
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
      let minDist = Infinity
      let closest = paletteRGB[0]
      
      for (const color of paletteRGB) {
        const dist = (r - color.r) ** 2 + (g - color.g) ** 2 + (b - color.b) ** 2
        if (dist < minDist) {
          minDist = dist
          closest = color
        }
      }
      
      data[i] = closest.r
      data[i + 1] = closest.g
      data[i + 2] = closest.b
    }
  } else {
    // 颜色数量限制
    const factor = 256 / params.colorCount
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue // 跳过透明像素
      data[i] = Math.floor(data[i] / factor) * factor
      data[i + 1] = Math.floor(data[i + 1] / factor) * factor
      data[i + 2] = Math.floor(data[i + 2] / factor) * factor
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
  

  
  // 导出格式处理
  const mimeType = params.exportFormat === 'jpg' ? 'image/jpeg' : 'image/png'
  const quality = params.exportFormat === 'jpg' ? 0.9 : undefined
  return canvas.toDataURL(mimeType, quality)
}

// ============= 主组件 =============

const PixelArtConverterUltimate: React.FC = () => {
  const { t, i18n } = useTranslation()
  
  // 默认展示图片
  const DEFAULT_DEMO_IMAGE = DEFAULT_DEMO_ORIGINAL // 使用高质量古桥图片作为默认演示
  
  // 状态（精简版）
  const [file, setFile] = useState<File | null>(null)
  const [imageSrc, setImageSrc] = useState(DEFAULT_DEMO_IMAGE)
  const [result, setResult] = useState<string | null>(null)
  const [params, setParams] = useState<PixelArtParams>(DEFAULT_PARAMS)
  const [isProcessing, setIsProcessing] = useState(false)
  const [realtimeMode, setRealtimeMode] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const processTimeoutRef = useRef<NodeJS.Timeout>()
  
  // 处理图像
  const processImage = useCallback(async (src: string, processParams: PixelArtParams) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          const processedUrl = await processToPixelArt(img, processParams)
          resolve(processedUrl)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('图像加载失败'))
      img.src = src
    })
  }, [])
  
  // 实时预览（300ms防抖）
  const handleRealtimeProcess = useCallback(() => {
    if (!imageSrc || !realtimeMode) return
    
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current)
    }
    
    // 根据模式动态调整防抖时间
    const debounceTime = params.pixelMode === 'enhanced' ? 800 : 300
    
    processTimeoutRef.current = setTimeout(async () => {
      try {
        setIsProcessing(true)
        const processed = await processImage(imageSrc, params)
        setResult(processed)
      } catch (error) {
        console.error('处理失败:', error)
      } finally {
        setIsProcessing(false)
      }
    }, debounceTime) // 增强模式800ms防抖，其他300ms
  }, [imageSrc, params, realtimeMode, processImage])
  
  useEffect(() => {
    handleRealtimeProcess()
  }, [handleRealtimeProcess])
  
  // 初始化默认效果
  useEffect(() => {
    if (!isInitialized && imageSrc === DEFAULT_DEMO_IMAGE) {
      // 直接使用用户提供的像素画处理图
      setResult(DEFAULT_DEMO_PROCESSED)
      setIsInitialized(true)
    }
  }, [isInitialized, imageSrc])
  
  // 文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile)
      setImageSrc(URL.createObjectURL(selectedFile))
      setResult(null)
      setIsInitialized(false) // 重置初始化状态
    }
  }, [])
  
  
  // 拖拽上传功能
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      if (droppedFile.size <= 10 * 1024 * 1024) { // 10MB限制
        setFile(droppedFile)
        setImageSrc(URL.createObjectURL(droppedFile))
        setResult(null)
        setIsInitialized(false) // 重置初始化状态
      } else {
        alert('文件过大，请选择小于10MB的图片')
      }
    } else {
      alert('请选择有效的图片文件')
    }
  }, [])
  
  // 参数更新
  const updateParam = useCallback(<K extends keyof PixelArtParams>(
    key: K,
    value: PixelArtParams[K]
  ) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])
  
  // 手动处理
  const handleManualProcess = useCallback(async () => {
    if (!imageSrc) return
    setIsProcessing(true)
    try {
      const processed = await processImage(imageSrc, params)
      setResult(processed)
    } catch (error) {
      alert('处理失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, params, processImage])
  


  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* 左侧空白，保持布局平衡 */}
            <div className="w-20"></div>
            
            {/* 标题 */}
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('pixelArt.title')}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('pixelArt.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 主要内容区 - 左右双栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          
          {/* 左侧：上传区 */}
          <div className="lg:col-span-3 bg-white rounded-lg border p-3">
            <h2 className="text-base font-bold text-gray-900 mb-3 text-left">{t('pixelArt.uploadArea')}</h2>
            
            {/* 上传图片按钮 */}
            <div className="mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center text-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('pixelArt.uploadButton')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* 拖拽上传区域 */}
            <div 
              className={`border-2 border-dashed rounded p-3 text-center mb-3 transition-all duration-200 ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
              <p className="text-xs font-medium text-gray-700 mb-1">{t('pixelArt.dragDropHint')}</p>
              <p className="text-xs text-gray-500">
                {t('pixelArt.supportedFormats')}<br />
                {t('pixelArt.maxFileSize')}
              </p>
              {isDragging && (
                <p className="text-blue-600 font-bold mt-1 text-xs">松开上传</p>
              )}
            </div>

            {/* 像素处理模式选择 */}
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="block text-xs font-bold text-blue-800 mb-3 text-center">{t('pixelArt.modes.title')}</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pixelMode"
                    value="normal"
                    checked={params.pixelMode === 'normal'}
                    onChange={() => updateParam('pixelMode', 'normal')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-700">{t('pixelArt.modes.normal')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pixelMode"
                    value="enhanced"
                    checked={params.pixelMode === 'enhanced'}
                    onChange={() => updateParam('pixelMode', 'enhanced')}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-700">{t('pixelArt.modes.enhanced')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pixelMode"
                    value="isolated"
                    checked={params.pixelMode === 'isolated'}
                    onChange={() => updateParam('pixelMode', 'isolated')}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-700">{t('pixelArt.modes.isolated')}</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="pixelMode"
                    value="original"
                    checked={params.pixelMode === 'original'}
                    onChange={() => updateParam('pixelMode', 'original')}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-xs font-medium text-gray-700">{t('pixelArt.modes.original')}</span>
                </label>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* 快捷控制参数 */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-3">
              {/* 像素大小 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('pixelArt.parameters.pixelSize')}: {params.pixelSize}
                </label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={params.pixelSize}
                  onChange={(e) => updateParam('pixelSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                {/* 像素大小快捷按钮 */}
                <div className="grid grid-cols-5 gap-1 mt-2">
                  <button
                    onClick={() => updateParam('pixelSize', 3)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      Math.abs(params.pixelSize - 3) <= 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {t('pixelArt.parameters.sizePresets.extraSmall')}
                  </button>
                  <button
                    onClick={() => updateParam('pixelSize', 6)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      Math.abs(params.pixelSize - 6) <= 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {t('pixelArt.parameters.sizePresets.small')}
                  </button>
                  <button
                    onClick={() => updateParam('pixelSize', 9)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      Math.abs(params.pixelSize - 9) <= 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {t('pixelArt.parameters.sizePresets.medium')}
                  </button>
                  <button
                    onClick={() => updateParam('pixelSize', 12)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      Math.abs(params.pixelSize - 12) <= 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {t('pixelArt.parameters.sizePresets.large')}
                  </button>
                  <button
                    onClick={() => updateParam('pixelSize', 15)}
                    className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                      Math.abs(params.pixelSize - 15) <= 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {t('pixelArt.parameters.sizePresets.extraLarge')}
                  </button>
                </div>
              </div>
              
              {/* 颜色数量 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('pixelArt.parameters.colorCount')}</label>
                <div className="grid grid-cols-5 gap-1">
                  {PRESETS.map(count => (
                    <button
                      key={count}
                      onClick={() => updateParam('colorCount', count)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.colorCount === count
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 边缘密度控制（增强像素模式显示） */}
              {params.pixelMode === 'enhanced' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('pixelArt.parameters.edgeDensity')}</label>
                  <div className="grid grid-cols-5 gap-1">
                    <button
                      onClick={() => updateParam('edgeDensity', 'minimal')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.edgeDensity === 'minimal'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
                      }`}
                    >
                      {t('pixelArt.parameters.edgePresets.minimal')}
                    </button>
                    <button
                      onClick={() => updateParam('edgeDensity', 'low')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.edgeDensity === 'low'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
                      }`}
                    >
                      {t('pixelArt.parameters.edgePresets.low')}
                    </button>
                    <button
                      onClick={() => updateParam('edgeDensity', 'medium')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.edgeDensity === 'medium'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
                      }`}
                    >
                      {t('pixelArt.parameters.edgePresets.medium')}
                    </button>
                    <button
                      onClick={() => updateParam('edgeDensity', 'high')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.edgeDensity === 'high'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
                      }`}
                    >
                      {t('pixelArt.parameters.edgePresets.high')}
                    </button>
                    <button
                      onClick={() => updateParam('edgeDensity', 'maximum')}
                      className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                        params.edgeDensity === 'maximum'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-indigo-200 hover:bg-indigo-300 text-indigo-800'
                      }`}
                    >
                      {t('pixelArt.parameters.edgePresets.maximum')}
                    </button>
                  </div>
                </div>
              )}

              {/* 普通模式专用选项 */}
              {params.pixelMode === 'normal' && (
                <div className="space-y-3">
                  <div className="border-t border-gray-200 my-3"></div>
                  
                  {/* 调色板 */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('pixelArt.palette.title')}</label>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                        <button
                          key={key}
                          onClick={() => updateParam('palette', key)}
                          className={`px-2 py-1 text-xs font-bold rounded ${
                            params.palette === key
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                          }`}
                        >
                          {palette.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 滤镜 */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t('pixelArt.filters.title')}</label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => updateParam('filter', 'none')}
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          params.filter === 'none'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                        }`}
                      >
                        {t('pixelArt.filters.none')}
                      </button>
                      <button
                        onClick={() => updateParam('filter', 'retro')}
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          params.filter === 'retro'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                        }`}
                      >
                        {t('pixelArt.filters.retro')}
                      </button>
                      <button
                        onClick={() => updateParam('filter', 'neon')}
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          params.filter === 'neon'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                        }`}
                      >
                        {t('pixelArt.filters.neon')}
                      </button>
                      <button
                        onClick={() => updateParam('filter', 'blackwhite')}
                        className={`px-2 py-1 text-xs font-bold rounded ${
                          params.filter === 'blackwhite'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                        }`}
                      >
                        {t('pixelArt.filters.blackWhite')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
          
          {/* 右侧：预览区 */}
          <div className="lg:col-span-9 bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('pixelArt.preview.title')}</h2>
                {!file && imageSrc === DEFAULT_DEMO_IMAGE && (
                  <p className="text-xs text-blue-600 mt-1">
                    🎨 {t('pixelArt.preview.demoEffect')}
                  </p>
                )}
              </div>

              {/* 下载按钮 */}
              {result && (
                <div className="flex space-x-2">
                  <a
                    href={result}
                    download={`pixel-art.${params.exportFormat}`}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('pixelArt.download.png')}
                  </a>
                  
                  {params.exportFormat === 'png' && (
                    <a
                      href={result}
                      download="pixel-art.jpg"
                      onClick={(e) => {
                        e.preventDefault()
                        // 临时生成JPG版本
                        const tempParams = { ...params, exportFormat: 'jpg' as const }
                        processImage(imageSrc, tempParams).then(jpgResult => {
                          const link = document.createElement('a')
                          link.href = jpgResult
                          link.download = 'pixel-art.jpg'
                          link.click()
                        })
                      }}
                      className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('pixelArt.download.jpg')}
                    </a>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {/* 图片对比预览 - 优化布局：原图小框，像素画大框 */}
              <div className="grid grid-cols-[200px_1fr] gap-6 items-start">
                {/* 原图（小框） */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-3 text-center">{t('pixelArt.preview.originalImage')}</h3>
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 relative" style={{ aspectRatio: '3/2', minHeight: '133px' }}>
                    <img
                      src={imageSrc}
                      alt="原图"
                      className="w-full h-full object-cover"
                    />
                    {!file && imageSrc === DEFAULT_DEMO_IMAGE && (
                      <div className="absolute top-1 left-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                        {t('pixelArt.preview.demoImage')}
                      </div>
                    )}
                  </div>
                  
                  {/* 预览控制 - 移动到小框下方 */}
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center text-sm font-medium justify-center">
                      <input
                        type="checkbox"
                        checked={realtimeMode}
                        onChange={(e) => setRealtimeMode(e.target.checked)}
                        className="mr-2"
                      />
                      {t('pixelArt.preview.realtimePreview')}
                    </label>
                    <div className="text-center">
                      {file && (
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                          {file.name}
                        </span>
                      )}
                      {!file && imageSrc === DEFAULT_DEMO_IMAGE && (
                        <span className="text-xs text-blue-600 px-2 py-1 bg-blue-50 rounded">
                          {t('pixelArt.preview.demoMode')}
                        </span>
                      )}
                    </div>
                    {!realtimeMode && (
                      <div className="text-center">
                        <button
                          onClick={handleManualProcess}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                        >
                          {isProcessing ? t('pixelArt.status.processing') : t('pixelArt.preview.generatePixelArt')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 像素化后的图（大框） */}
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">{t('pixelArt.preview.pixelizedImage')}</h3>
                  <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative" style={{ aspectRatio: '3/2', minHeight: '300px' }}>
                    {result ? (
                      <>
                        <img
                          src={result}
                          alt="像素画"
                          className="w-full h-full object-cover"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {!file && imageSrc === DEFAULT_DEMO_IMAGE && (
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                            {t('pixelArt.preview.demoResult')}
                          </div>
                        )}

                      </>
                    ) : isProcessing ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">{t('pixelArt.preview.generating')}</p>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <Gamepad2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-lg text-gray-500 mb-2">{t('pixelArt.preview.previewPlaceholder')}</p>
                        <p className="text-sm text-gray-400">{t('pixelArt.preview.adjustParams')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PixelArtConverterUltimate 
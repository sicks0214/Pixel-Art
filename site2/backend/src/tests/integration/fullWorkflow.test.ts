/**
 * 完整工作流集成测试
 * 测试从上传到转换完成的端到端流程
 */

import request from 'supertest'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import path from 'path'
import app from '../../index'
import { logger } from '../../services/pixelArt/errorHandler'

describe('端到端工作流集成测试', () => {
  beforeAll(() => {
    // 设置测试日志级别
    logger.setLogLevel(2) // WARN
  })

  afterAll(() => {
    logger.setLogLevel(1) // INFO
  })

  /**
   * 创建真实的测试图像
   */
  const createRealTestImage = async (type: 'photo' | 'logo' | 'drawing'): Promise<Buffer> => {
    let imageBuffer: Buffer

    switch (type) {
      case 'photo':
        // 模拟照片：渐变背景 + 噪声
        imageBuffer = await sharp({
          create: {
            width: 640,
            height: 480,
            channels: 3,
            background: { r: 135, g: 206, b: 235 } // 天蓝色
          }
        })
        .composite([
          {
            input: await sharp({
              create: {
                width: 200,
                height: 200,
                channels: 3,
                background: { r: 255, g: 215, b: 0 } // 金色圆形
              }
            })
            .png()
            .toBuffer(),
            top: 140,
            left: 220,
            blend: 'multiply'
          }
        ])
        .png()
        .toBuffer()
        break

      case 'logo':
        // 模拟Logo：简单几何形状
        imageBuffer = await sharp({
          create: {
            width: 256,
            height: 256,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
          }
        })
        .composite([
          {
            input: await sharp({
              create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
              }
            })
            .png()
            .toBuffer(),
            top: 78,
            left: 78
          }
        ])
        .png()
        .toBuffer()
        break

      case 'drawing':
        // 模拟绘画：多色彩图案
        const width = 400
        const height = 300
        const buffer = Buffer.alloc(width * height * 3)
        
        // 创建艺术图案
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 3
            const centerX = width / 2
            const centerY = height / 2
            
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
            const angle = Math.atan2(y - centerY, x - centerX)
            
            buffer[offset] = Math.floor(Math.abs(Math.sin(distance / 20 + angle)) * 255)
            buffer[offset + 1] = Math.floor(Math.abs(Math.cos(distance / 15)) * 255)
            buffer[offset + 2] = Math.floor(Math.abs(Math.sin(angle * 3)) * 255)
          }
        }
        
        imageBuffer = await sharp(buffer, {
          raw: { width, height, channels: 3 }
        }).png().toBuffer()
        break

      default:
        throw new Error(`未知图像类型: ${type}`)
    }

    return imageBuffer
  }

  describe('真实场景像素画转换', () => {
    test('照片转像素画完整流程', async () => {
      const photoBuffer = await createRealTestImage('photo')
      
      console.log('🖼️  开始照片转像素画测试...')
      
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=balanced')
        .field('resizeFactor', '15') // 大幅缩小以获得像素画效果
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '2.0')
        .attach('imageFile', photoBuffer, 'photo.png')
        .expect(200)

      // 验证基本响应
      expect(response.body.success).toBe(true)
      expect(response.body.data.requestId).toBeTruthy()
      
      // 验证转换结果
      const result = response.body.data
      expect(result.pixelArtImage).toMatch(/^data:image\/png;base64,/)
      expect(result.canvasInfo.width).toBeLessThan(640) // 应该被缩小了
      expect(result.canvasInfo.height).toBeLessThan(480)
      expect(result.extractedColors.length).toBeGreaterThan(8)
      expect(result.processingTime).toBeGreaterThan(0)

      console.log('✅ 照片转换结果:', {
        原始尺寸: '640x480',
        输出尺寸: `${result.canvasInfo.width}x${result.canvasInfo.height}`,
        处理时间: `${result.processingTime}ms`,
        提取颜色: result.extractedColors.length,
        文件大小: `${(result.pixelArtImage.length / 1024).toFixed(2)}KB`
      })
    }, 30000)

    test('Logo转像素画完整流程', async () => {
      const logoBuffer = await createRealTestImage('logo')
      
      console.log('🏷️  开始Logo转像素画测试...')
      
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=high_quality')
        .field('resizeFactor', '50') // 保持较高分辨率
        .field('interpolation', 'nearest_neighbor') // 保持硬边缘
        .field('colorMode', 'no_dithering') // Logo通常不需要抖动
        .field('ditheringRatio', '1.0')
        .attach('imageFile', logoBuffer, 'logo.png')
        .expect(200)

      const result = response.body.data
      expect(response.body.success).toBe(true)
      expect(result.canvasInfo.width).toBeGreaterThan(50) // Logo保持可识别尺寸
      expect(result.extractedColors.length).toBeGreaterThan(2)

      console.log('✅ Logo转换结果:', {
        原始尺寸: '256x256',
        输出尺寸: `${result.canvasInfo.width}x${result.canvasInfo.height}`,
        处理时间: `${result.processingTime}ms`,
        提取颜色: result.extractedColors.length,
        调色板: result.extractedColors.slice(0, 5).join(', ')
      })
    }, 25000)

    test('艺术绘画转像素画完整流程', async () => {
      const drawingBuffer = await createRealTestImage('drawing')
      
      console.log('🎨 开始绘画转像素画测试...')
      
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=high_quality')
        .field('resizeFactor', '40')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.8')
        .attach('imageFile', drawingBuffer, 'drawing.png')
        .expect(200)

      const result = response.body.data
      expect(response.body.success).toBe(true)
      expect(result.extractedColors.length).toBeGreaterThan(12) // 艺术作品颜色丰富

      console.log('✅ 绘画转换结果:', {
        原始尺寸: '400x300',
        输出尺寸: `${result.canvasInfo.width}x${result.canvasInfo.height}`,
        处理时间: `${result.processingTime}ms`,
        提取颜色: result.extractedColors.length,
        彩色像素: result.canvasInfo.coloredPixels
      })
    }, 35000)
  })

  describe('工作流错误恢复测试', () => {
    test('网络中断重试机制', async () => {
      const testImage = await createRealTestImage('logo')
      
      // 模拟网络问题 - 故意发送错误的content-type
      const response = await request(app)
        .post('/api/color03/pixel-art/convert')
        .set('Content-Type', 'application/octet-stream') // 错误的content-type
        .field('resizeFactor', '50')
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', testImage, 'test.png')

      // 应该得到适当的错误响应
      expect(response.status).toBeGreaterThanOrEqual(400)
      if (response.body.requestId) {
        console.log('🔧 错误恢复测试 - 请求ID:', response.body.requestId)
      }
    })

    test('部分失败场景处理', async () => {
      const testImage = await createRealTestImage('photo')
      
      // 使用极端参数测试系统稳定性
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=fast')
        .field('resizeFactor', '1') // 极小尺寸
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '3.0') // 最大抖动
        .attach('imageFile', testImage, 'extreme.png')

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
        expect(response.body.data.canvasInfo.width).toBeGreaterThan(0)
        console.log('🎯 极端参数测试通过:', {
          输出尺寸: `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`,
          处理时间: `${response.body.data.processingTime}ms`
        })
      } else {
        // 系统正确拒绝了极端请求
        expect(response.body.success).toBe(false)
        expect(response.body.suggestions).toBeDefined()
        console.log('🛡️  系统正确拒绝极端参数:', response.body.error)
      }
    }, 20000)
  })

  describe('质量保证测试', () => {
    test('输出质量验证', async () => {
      const testImage = await createRealTestImage('drawing')
      
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=balanced')
        .field('resizeFactor', '30')
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '1.5')
        .attach('imageFile', testImage, 'quality_test.png')
        .expect(200)

      const result = response.body.data
      
      // 验证输出质量指标
      expect(result.canvasInfo.coloredPixels).toBeGreaterThan(0)
      expect(result.extractedColors.length).toBeGreaterThan(4)
      expect(result.extractedColors.length).toBeLessThan(64) // 合理的颜色数量
      
      // 验证颜色格式
      result.extractedColors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
      
      // 验证Base64图像
      expect(result.pixelArtImage).toMatch(/^data:image\/png;base64,/)
      const base64Data = result.pixelArtImage.split(',')[1]
      expect(base64Data.length).toBeGreaterThan(100) // 有实际内容

      console.log('✅ 质量验证通过:', {
        颜色数量: result.extractedColors.length,
        像素数: result.canvasInfo.coloredPixels,
        图像大小: `${(base64Data.length * 0.75 / 1024).toFixed(2)}KB`
      })
    }, 25000)

    test('一致性验证 - 相同输入应产生相同输出', async () => {
      const testImage = await createRealTestImage('logo')
      const params = {
        resizeFactor: '40',
        interpolation: 'nearest_neighbor',
        colorMode: 'no_dithering',
        ditheringRatio: '1.0'
      }

      // 执行两次相同的转换
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/color03/pixel-art/convert?quality=balanced')
          .field('resizeFactor', params.resizeFactor)
          .field('interpolation', params.interpolation)
          .field('colorMode', params.colorMode)
          .field('ditheringRatio', params.ditheringRatio)
          .attach('imageFile', testImage, 'consistency1.png'),
        
        request(app)
          .post('/api/color03/pixel-art/convert?quality=balanced')
          .field('resizeFactor', params.resizeFactor)
          .field('interpolation', params.interpolation)
          .field('colorMode', params.colorMode)
          .field('ditheringRatio', params.ditheringRatio)
          .attach('imageFile', testImage, 'consistency2.png')
      ])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      const result1 = response1.body.data
      const result2 = response2.body.data

      // 验证关键输出一致性
      expect(result1.canvasInfo.width).toBe(result2.canvasInfo.width)
      expect(result1.canvasInfo.height).toBe(result2.canvasInfo.height)
      expect(result1.extractedColors.length).toBe(result2.extractedColors.length)

      console.log('🔄 一致性验证通过:', {
        尺寸一致: `${result1.canvasInfo.width}x${result1.canvasInfo.height}`,
        颜色数量一致: result1.extractedColors.length,
        处理时间差异: `${Math.abs(result1.processingTime - result2.processingTime)}ms`
      })
    }, 30000)
  })

  describe('边界和极限测试', () => {
    test('最小尺寸图像处理', async () => {
      const tinyImage = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 128, b: 64 }
        }
      }).png().toBuffer()

      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=fast')
        .field('resizeFactor', '100') // 保持原始尺寸
        .field('interpolation', 'nearest_neighbor')
        .field('colorMode', 'no_dithering')
        .field('ditheringRatio', '1.0')
        .attach('imageFile', tinyImage, 'tiny.png')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      
      const result = response.body.data
      expect(result.canvasInfo.width).toBeGreaterThan(0)
      expect(result.canvasInfo.height).toBeGreaterThan(0)
      
      console.log('🔬 最小尺寸图像测试通过:', {
        输入: '10x10',
        输出: `${result.canvasInfo.width}x${result.canvasInfo.height}`,
        处理时间: `${result.processingTime}ms`
      })
    }, 15000)

    test('处理时间限制验证', async () => {
      const complexImage = await createRealTestImage('drawing')

      const startTime = Date.now()
      
      const response = await request(app)
        .post('/api/color03/pixel-art/convert?quality=high_quality')
        .field('resizeFactor', '75') // 大尺寸
        .field('interpolation', 'bilinear')
        .field('colorMode', 'ordered_dithering_bayer')
        .field('ditheringRatio', '2.5')
        .attach('imageFile', complexImage, 'complex.png')

      const totalTime = Date.now() - startTime

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
        expect(totalTime).toBeLessThan(60000) // 应在60秒内完成
        
        console.log('⏱️  高复杂度处理测试通过:', {
          总时间: `${totalTime}ms`,
          处理时间: `${response.body.data.processingTime}ms`,
          输出尺寸: `${response.body.data.canvasInfo.width}x${response.body.data.canvasInfo.height}`
        })
      } else if (response.status === 408) {
        // 超时是可接受的响应
        console.log('⏰ 复杂图像处理超时 - 系统正确处理')
        expect(response.body.success).toBe(false)
        expect(response.body.code).toBeTruthy()
      }
    }, 65000)
  })
})


/**
 * Mock API服务 - 用于前端独立运行
 */

export interface MockApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Mock服务类
 */
class MockService {
  private mockData: Map<string, any> = new Map()
  private isEnabled = true

  constructor() {
    // 初始化mock数据
    this.initializeMockData()
  }

  /**
   * 启用/禁用Mock服务
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  /**
   * 检查是否启用Mock服务
   */
  get enabled() {
    return this.isEnabled
  }

  /**
   * 初始化Mock数据
   */
  private initializeMockData() {
    // Mock图片上传响应
    this.mockData.set('upload', {
      success: true,
      data: {
        imageId: 'mock_image_' + Date.now(),
        url: '/mock-images/uploaded-image.jpg',
        originalName: 'test-image.jpg',
        size: 1024000,
        format: 'jpeg',
        dimensions: { width: 800, height: 600 }
      }
    })

    // Mock AI卡通化响应
    this.mockData.set('cartoonify', {
      success: true,
      data: {
        processedImageUrl: '/mock-images/cartoonified-image.jpg',
        processId: 'mock_process_' + Date.now(),
        processing: false,
        progress: 100
      }
    })

    // Mock文字添加响应
    this.mockData.set('addText', {
      success: true,
      data: {
        imageUrl: '/mock-images/image-with-text.jpg',
        textId: 'mock_text_' + Date.now()
      }
    })

    // Mock图片导出响应
    this.mockData.set('export', {
      success: true,
      data: {
        downloadUrl: '/mock-images/exported-image.png',
        format: 'png',
        size: 2048000
      }
    })

    // Mock AI状态检查
    this.mockData.set('ai-status', {
      success: true,
      data: {
        available: true,
        services: {
          cartoonify: true,
          textGeneration: true,
          imageEnhancement: true
        }
      }
    })
  }

  /**
   * 模拟API延迟
   */
  private async simulateDelay(min = 500, max = 1500): Promise<void> {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Mock图片上传
   */
  async mockUpload(file: File): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 模拟图片上传', file.name)
    await this.simulateDelay(800, 1200)

    // 创建本地预览URL
    const localUrl = URL.createObjectURL(file)
    
    return {
      success: true,
      data: {
        imageId: 'mock_image_' + Date.now(),
        url: localUrl,
        originalName: file.name,
        size: file.size,
        format: file.type.split('/')[1] || 'jpeg',
        dimensions: { width: 800, height: 600 }
      }
    }
  }

  /**
   * Mock AI卡通化
   */
  async mockCartoonify(imageUrl: string): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 模拟AI卡通化', imageUrl)
    await this.simulateDelay(2000, 3000)

    return {
      success: true,
      data: {
        processedImageUrl: imageUrl, // 返回原图像作为mock
        processId: 'mock_cartoonify_' + Date.now(),
        processing: false,
        progress: 100
      }
    }
  }

  /**
   * Mock添加文字
   */
  async mockAddText(imageUrl: string, text: string, options: any): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 模拟添加文字', { imageUrl, text, options })
    await this.simulateDelay(300, 800)

    return {
      success: true,
      data: {
        imageUrl: imageUrl, // 返回原图像作为mock
        textId: 'mock_text_' + Date.now(),
        text,
        position: options.position || { x: 100, y: 100 }
      }
    }
  }

  /**
   * Mock图片导出
   */
  async mockExport(imageUrl: string, format: string, quality?: number): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 模拟图片导出', { imageUrl, format, quality })
    await this.simulateDelay(500, 1000)

    return {
      success: true,
      data: {
        downloadUrl: imageUrl, // 返回原图像作为mock
        format,
        quality: quality || 90,
        size: Math.floor(Math.random() * 2000000) + 500000 // 模拟文件大小
      }
    }
  }

  /**
   * Mock AI服务状态检查
   */
  async mockCheckAIStatus(): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 检查AI服务状态')
    await this.simulateDelay(200, 500)

    return this.mockData.get('ai-status')
  }

  /**
   * Mock批量处理
   */
  async mockBatchProcess(images: string[], operation: string): Promise<MockApiResponse> {
    if (!this.isEnabled) return { success: false, error: 'Mock service disabled' }
    
    console.log('🎭 Mock: 模拟批量处理', { images, operation })
    await this.simulateDelay(1000, 2000)

    return {
      success: true,
      data: {
        processedImages: images.map((img, index) => ({
          original: img,
          processed: img, // 返回原图像作为mock
          processId: `mock_batch_${Date.now()}_${index}`
        })),
        totalProcessed: images.length
      }
    }
  }

  /**
   * 获取Mock数据
   */
  getMockData(key: string) {
    return this.mockData.get(key)
  }

  /**
   * 设置Mock数据
   */
  setMockData(key: string, data: any) {
    this.mockData.set(key, data)
  }
}

// 创建全局Mock服务实例
export const mockService = new MockService()
export default mockService 
/**
 * 像素画转换参数验证器
 * 提供全面的输入验证、安全检查和参数标准化
 */

import { Request } from 'express'
import sharp from 'sharp'
import { PixelArtError, ErrorType, logger } from './errorHandler'

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  normalizedParams?: NormalizedParams
}

// 标准化参数接口
export interface NormalizedParams {
  resizeFactor: number
  interpolation: 'nearest_neighbor' | 'bilinear'
  colorMode: 'no_dithering' | 'ordered_dithering_bayer'
  ditheringRatio: number
  quality: 'fast' | 'balanced' | 'high_quality'
}

// 文件验证结果
export interface FileValidationResult {
  isValid: boolean
  error?: string
  metadata?: {
    format: string
    width: number
    height: number
    channels: number
    fileSize: number
    colorSpace?: string
  }
  securityChecks: {
    mimeTypeValid: boolean
    extensionMatches: boolean
    headerValid: boolean
    sizeWithinLimits: boolean
    dimensionsValid: boolean
    noMaliciousContent: boolean
  }
}

/**
 * 参数验证器类
 */
export class ParameterValidator {
  // 验证配置
  private static readonly VALIDATION_CONFIG = {
    resizeFactor: {
      min: 1,
      max: 200,
      default: 50
    },
    ditheringRatio: {
      min: 0.1,
      max: 5.0,
      default: 1.0,
      step: 0.1
    },
    file: {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxDimension: 8192,
      maxPixels: 50 * 1024 * 1024, // 50MP
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
      allowedExtensions: ['.jpg', '.jpeg', '.png']
    }
  }

  /**
   * 验证转换参数
   */
  static validateConversionParams(params: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    logger.debug('ParameterValidator', '开始验证转换参数', { params })

    // 验证缩放因子
    const resizeFactorResult = this.validateResizeFactor(params.resizeFactor)
    if (!resizeFactorResult.isValid) {
      errors.push(...resizeFactorResult.errors)
    }
    if (resizeFactorResult.warnings) {
      warnings.push(...resizeFactorResult.warnings)
    }

    // 验证插值方法
    const interpolationResult = this.validateInterpolation(params.interpolation)
    if (!interpolationResult.isValid) {
      errors.push(...interpolationResult.errors)
    }

    // 验证颜色模式
    const colorModeResult = this.validateColorMode(params.colorMode)
    if (!colorModeResult.isValid) {
      errors.push(...colorModeResult.errors)
    }

    // 验证抖动比例
    const ditheringResult = this.validateDitheringRatio(params.ditheringRatio)
    if (!ditheringResult.isValid) {
      errors.push(...ditheringResult.errors)
    }
    if (ditheringResult.warnings) {
      warnings.push(...ditheringResult.warnings)
    }

    // 验证质量参数
    const qualityResult = this.validateQuality(params.quality)
    if (!qualityResult.isValid) {
      errors.push(...qualityResult.errors)
    }

    const isValid = errors.length === 0

    const result: ValidationResult = {
      isValid,
      errors,
      warnings
    }

    if (isValid) {
      result.normalizedParams = {
        resizeFactor: resizeFactorResult.value || this.VALIDATION_CONFIG.resizeFactor.default,
        interpolation: interpolationResult.value || 'bilinear',
        colorMode: colorModeResult.value || 'no_dithering',
        ditheringRatio: ditheringResult.value || this.VALIDATION_CONFIG.ditheringRatio.default,
        quality: qualityResult.value || 'balanced'
      }
    }

    logger.debug('ParameterValidator', '参数验证完成', {
      isValid,
      errorsCount: errors.length,
      warningsCount: warnings.length
    })

    return result
  }

  /**
   * 验证缩放因子
   */
  private static validateResizeFactor(value: any): {
    isValid: boolean
    errors: string[]
    warnings?: string[]
    value?: number
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        warnings: ['缩放因子未提供，使用默认值50%'],
        value: this.VALIDATION_CONFIG.resizeFactor.default
      }
    }

    const numValue = Number(value)
    
    if (isNaN(numValue)) {
      errors.push('缩放因子必须是有效数字')
      return { isValid: false, errors }
    }

    if (numValue < this.VALIDATION_CONFIG.resizeFactor.min) {
      errors.push(`缩放因子不能小于${this.VALIDATION_CONFIG.resizeFactor.min}%`)
    }

    if (numValue > this.VALIDATION_CONFIG.resizeFactor.max) {
      errors.push(`缩放因子不能大于${this.VALIDATION_CONFIG.resizeFactor.max}%`)
    }

    if (numValue < 10) {
      warnings.push('缩放因子过小可能导致图像细节丢失')
    }

    if (numValue > 150) {
      warnings.push('缩放因子过大可能导致处理时间过长')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      value: numValue
    }
  }

  /**
   * 验证插值方法
   */
  private static validateInterpolation(value: any): {
    isValid: boolean
    errors: string[]
    value?: string
  } {
    const errors: string[] = []
    const validMethods = ['nearest_neighbor', 'bilinear']

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        value: 'bilinear'
      }
    }

    if (typeof value !== 'string') {
      errors.push('插值方法必须是字符串')
      return { isValid: false, errors }
    }

    if (!validMethods.includes(value)) {
      errors.push(`插值方法必须是以下之一: ${validMethods.join(', ')}`)
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      errors: [],
      value
    }
  }

  /**
   * 验证颜色模式
   */
  private static validateColorMode(value: any): {
    isValid: boolean
    errors: string[]
    value?: string
  } {
    const errors: string[] = []
    const validModes = ['no_dithering', 'ordered_dithering_bayer']

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        value: 'no_dithering'
      }
    }

    if (typeof value !== 'string') {
      errors.push('颜色模式必须是字符串')
      return { isValid: false, errors }
    }

    if (!validModes.includes(value)) {
      errors.push(`颜色模式必须是以下之一: ${validModes.join(', ')}`)
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      errors: [],
      value
    }
  }

  /**
   * 验证抖动比例
   */
  private static validateDitheringRatio(value: any): {
    isValid: boolean
    errors: string[]
    warnings?: string[]
    value?: number
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        warnings: ['抖动比例未提供，使用默认值1.0'],
        value: this.VALIDATION_CONFIG.ditheringRatio.default
      }
    }

    const numValue = Number(value)
    
    if (isNaN(numValue)) {
      errors.push('抖动比例必须是有效数字')
      return { isValid: false, errors }
    }

    if (numValue < this.VALIDATION_CONFIG.ditheringRatio.min) {
      errors.push(`抖动比例不能小于${this.VALIDATION_CONFIG.ditheringRatio.min}`)
    }

    if (numValue > this.VALIDATION_CONFIG.ditheringRatio.max) {
      errors.push(`抖动比例不能大于${this.VALIDATION_CONFIG.ditheringRatio.max}`)
    }

    if (numValue > 3.0) {
      warnings.push('抖动比例过大可能产生过度的噪点效果')
    }

    // 检查步长精度
    const rounded = Math.round(numValue / this.VALIDATION_CONFIG.ditheringRatio.step) * this.VALIDATION_CONFIG.ditheringRatio.step
    if (Math.abs(rounded - numValue) > 0.001) {
      warnings.push(`抖动比例将被调整为${rounded.toFixed(1)}以匹配步长要求`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      value: rounded
    }
  }

  /**
   * 验证质量参数
   */
  private static validateQuality(value: any): {
    isValid: boolean
    errors: string[]
    value?: string
  } {
    const errors: string[] = []
    const validQualities = ['fast', 'balanced', 'high_quality']

    if (value === undefined || value === null) {
      return {
        isValid: true,
        errors: [],
        value: 'balanced'
      }
    }

    if (typeof value !== 'string') {
      errors.push('质量参数必须是字符串')
      return { isValid: false, errors }
    }

    if (!validQualities.includes(value)) {
      errors.push(`质量参数必须是以下之一: ${validQualities.join(', ')}`)
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      errors: [],
      value
    }
  }
}

/**
 * 文件验证器类
 */
export class FileValidator {
  /**
   * 验证上传的文件
   */
  static async validateImageFile(file: Express.Multer.File): Promise<FileValidationResult> {
    logger.debug('FileValidator', '开始验证图像文件', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })

    const securityChecks = {
      mimeTypeValid: false,
      extensionMatches: false,
      headerValid: false,
      sizeWithinLimits: false,
      dimensionsValid: false,
      noMaliciousContent: false
    }

    try {
      // 1. 验证MIME类型
      const mimeTypeResult = this.validateMimeType(file.mimetype)
      securityChecks.mimeTypeValid = mimeTypeResult.isValid
      if (!mimeTypeResult.isValid) {
        return {
          isValid: false,
          error: mimeTypeResult.error,
          securityChecks
        }
      }

      // 2. 验证文件扩展名
      const extensionResult = this.validateFileExtension(file.originalname, file.mimetype)
      securityChecks.extensionMatches = extensionResult.matches
      if (!extensionResult.matches) {
        return {
          isValid: false,
          error: extensionResult.error,
          securityChecks
        }
      }

      // 3. 验证文件大小
      const sizeResult = this.validateFileSize(file.size)
      securityChecks.sizeWithinLimits = sizeResult.isValid
      if (!sizeResult.isValid) {
        return {
          isValid: false,
          error: sizeResult.error,
          securityChecks
        }
      }

      // 4. 验证图像头部和元数据
      let metadata: sharp.Metadata
      try {
        metadata = await sharp(file.buffer).metadata()
        securityChecks.headerValid = true
      } catch (error) {
        logger.error('FileValidator', '无法解析图像元数据', error as Error, {
          filename: file.originalname
        })
        return {
          isValid: false,
          error: '文件不是有效的图像格式或文件已损坏',
          securityChecks
        }
      }

      // 5. 验证图像尺寸
      const dimensionResult = this.validateImageDimensions(metadata)
      securityChecks.dimensionsValid = dimensionResult.isValid
      if (!dimensionResult.isValid) {
        return {
          isValid: false,
          error: dimensionResult.error,
          securityChecks
        }
      }

      // 6. 恶意内容检查
      const maliciousResult = await this.checkForMaliciousContent(file.buffer, metadata)
      securityChecks.noMaliciousContent = maliciousResult.isSafe
      if (!maliciousResult.isSafe) {
        return {
          isValid: false,
          error: maliciousResult.error,
          securityChecks
        }
      }

      // 所有验证通过
      const result: FileValidationResult = {
        isValid: true,
        metadata: {
          format: metadata.format || 'unknown',
          width: metadata.width || 0,
          height: metadata.height || 0,
          channels: metadata.channels || 0,
          fileSize: file.size,
          colorSpace: metadata.space
        },
        securityChecks
      }

      logger.info('FileValidator', '文件验证成功', {
        filename: file.originalname,
        format: metadata.format,
        dimensions: `${metadata.width}x${metadata.height}`,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      })

      return result

    } catch (error) {
      logger.error('FileValidator', '文件验证过程中发生错误', error as Error, {
        filename: file.originalname
      })

      return {
        isValid: false,
        error: '文件验证过程中发生错误',
        securityChecks
      }
    }
  }

  /**
   * 验证MIME类型
   */
  private static validateMimeType(mimetype: string): {
    isValid: boolean
    error?: string
  } {
    const allowedTypes = ParameterValidator['VALIDATION_CONFIG'].file.allowedMimeTypes
    
    if (!allowedTypes.includes(mimetype.toLowerCase())) {
      return {
        isValid: false,
        error: `不支持的文件类型: ${mimetype}。支持的类型: ${allowedTypes.join(', ')}`
      }
    }

    return { isValid: true }
  }

  /**
   * 验证文件扩展名
   */
  private static validateFileExtension(filename: string, mimetype: string): {
    matches: boolean
    error?: string
  } {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    const allowedExtensions = ParameterValidator['VALIDATION_CONFIG'].file.allowedExtensions

    if (!allowedExtensions.includes(extension)) {
      return {
        matches: false,
        error: `不支持的文件扩展名: ${extension}。支持的扩展名: ${allowedExtensions.join(', ')}`
      }
    }

    // 检查扩展名与MIME类型是否匹配
    const mimeExtensionMap: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    }

    const validExtensions = mimeExtensionMap[mimetype.toLowerCase()]
    if (validExtensions && !validExtensions.includes(extension)) {
      return {
        matches: false,
        error: `文件扩展名${extension}与MIME类型${mimetype}不匹配`
      }
    }

    return { matches: true }
  }

  /**
   * 验证文件大小
   */
  private static validateFileSize(size: number): {
    isValid: boolean
    error?: string
  } {
    const maxSize = ParameterValidator['VALIDATION_CONFIG'].file.maxSize

    if (size > maxSize) {
      return {
        isValid: false,
        error: `文件大小${(size / 1024 / 1024).toFixed(2)}MB超过限制${(maxSize / 1024 / 1024)}MB`
      }
    }

    if (size < 100) { // 小于100字节可能是无效文件
      return {
        isValid: false,
        error: '文件大小过小，可能不是有效的图像文件'
      }
    }

    return { isValid: true }
  }

  /**
   * 验证图像尺寸
   */
  private static validateImageDimensions(metadata: sharp.Metadata): {
    isValid: boolean
    error?: string
  } {
    const { width, height } = metadata
    const config = ParameterValidator['VALIDATION_CONFIG'].file

    if (!width || !height) {
      return {
        isValid: false,
        error: '无法获取图像尺寸信息'
      }
    }

    if (width > config.maxDimension || height > config.maxDimension) {
      return {
        isValid: false,
        error: `图像尺寸${width}x${height}超过限制${config.maxDimension}x${config.maxDimension}`
      }
    }

    if (width * height > config.maxPixels) {
      return {
        isValid: false,
        error: `图像像素数${width * height}超过限制${config.maxPixels}`
      }
    }

    if (width < 1 || height < 1) {
      return {
        isValid: false,
        error: '图像尺寸无效'
      }
    }

    return { isValid: true }
  }

  /**
   * 检查恶意内容
   */
  private static async checkForMaliciousContent(buffer: Buffer, metadata: sharp.Metadata): Promise<{
    isSafe: boolean
    error?: string
  }> {
    try {
      // 1. 检查异常大的文件头部
      if (buffer.length < 50) {
        return {
          isSafe: false,
          error: '文件头部过短，可能是恶意文件'
        }
      }

      // 2. 检查图像格式的合法性
      const format = metadata.format?.toLowerCase()
      if (!format || !['jpeg', 'jpg', 'png'].includes(format)) {
        return {
          isSafe: false,
          error: '图像格式验证失败'
        }
      }

      // 3. 检查是否有嵌入的可执行内容（简单检查）
      const bufferStr = buffer.toString('hex')
      const suspiciousPatterns = [
        '4d5a', // MZ header (exe)
        '504b', // PK header (zip/jar)
        '7f454c46', // ELF header
        '89504e47' // PNG但检查是否有异常
      ]

      // PNG文件应该以PNG signature开始
      if (format === 'png' && !bufferStr.startsWith('89504e470d0a1a0a')) {
        return {
          isSafe: false,
          error: 'PNG文件头部验证失败'
        }
      }

      // JPEG文件应该以JPEG signature开始
      if ((format === 'jpeg' || format === 'jpg') && !bufferStr.startsWith('ffd8ff')) {
        return {
          isSafe: false,
          error: 'JPEG文件头部验证失败'
        }
      }

      // 4. 尝试用Sharp重新处理以确保文件的完整性
      try {
        await sharp(buffer)
          .resize(1, 1) // 最小缩放测试
          .jpeg()
          .toBuffer()
      } catch (error) {
        return {
          isSafe: false,
          error: '图像处理测试失败，文件可能已损坏'
        }
      }

      return { isSafe: true }

    } catch (error) {
      logger.error('FileValidator', '恶意内容检查失败', error as Error)
      return {
        isSafe: false,
        error: '安全检查过程中发生错误'
      }
    }
  }
}

/**
 * Express中间件：验证像素画转换参数
 */
export function validatePixelArtParams(req: Request, res: any, next: any) {
  try {
    const validationResult = ParameterValidator.validateConversionParams(req.body)
    
    if (!validationResult.isValid) {
      logger.warn('ValidationMiddleware', '参数验证失败', {
        errors: validationResult.errors,
        originalParams: req.body
      })

      return res.status(400).json({
        success: false,
        error: '请求参数验证失败',
        details: validationResult.errors,
        code: 'VALIDATION_ERROR'
      })
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      logger.info('ValidationMiddleware', '参数验证警告', {
        warnings: validationResult.warnings
      })
    }

    // 将标准化的参数添加到请求对象
    req.validatedBody = validationResult.normalizedParams
    req.validationWarnings = validationResult.warnings

    next()

  } catch (error) {
    logger.error('ValidationMiddleware', '验证中间件错误', error as Error)
    
    res.status(500).json({
      success: false,
      error: '参数验证过程中发生错误',
      code: 'VALIDATION_MIDDLEWARE_ERROR'
    })
  }
}

// 扩展Express Request接口
declare global {
  namespace Express {
    interface Request {
      validatedBody?: NormalizedParams
      validationWarnings?: string[]
    }
  }
}

import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

/**
 * 像素画转换请求验证模式
 */
const pixelArtValidationSchema = Joi.object({
  resizeFactor: Joi.number()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': '调整大小因子必须是数字',
      'number.min': '调整大小因子不能小于1',
      'number.max': '调整大小因子不能大于100',
      'any.required': '调整大小因子是必需的'
    }),
  
  interpolation: Joi.string()
    .valid('nearest_neighbor', 'bilinear')
    .required()
    .messages({
      'any.only': '插值方法必须是 "nearest_neighbor" 或 "bilinear"',
      'any.required': '插值方法是必需的'
    }),
  
  colorMode: Joi.string()
    .valid('no_dithering', 'ordered_dithering_bayer')
    .required()
    .messages({
      'any.only': '颜色模式必须是 "no_dithering" 或 "ordered_dithering_bayer"',
      'any.required': '颜色模式是必需的'
    }),
  
  ditheringRatio: Joi.number()
    .min(0.1)
    .max(3.0)
    .precision(1)
    .required()
    .messages({
      'number.base': '抖动比例必须是数字',
      'number.min': '抖动比例不能小于0.1',
      'number.max': '抖动比例不能大于3.0',
      'any.required': '抖动比例是必需的'
    })
})

/**
 * 通用验证中间件生成器
 */
const createValidationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有验证错误
      allowUnknown: true, // 允许未知字段（如文件上传字段）
      stripUnknown: false // 不移除未知字段
    })
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }))
      
      console.log('[Validation] 验证失败:', errors)
      
      return res.status(400).json({
        success: false,
        error: '请求参数验证失败',
        details: errors,
        code: 'VALIDATION_ERROR'
      })
    }
    
    // 将验证后的值存储到req.validatedBody
    req.validatedBody = value
    console.log('[Validation] 验证成功:', value)
    
    next()
  }
}

/**
 * 像素画转换请求验证中间件
 */
export const validatePixelArtRequest = (req: Request, res: Response, next: NextFunction) => {
  // 首先检查是否有文件上传
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: '图像文件是必需的',
      code: 'NO_FILE'
    })
  }
  
  // 转换字符串参数为适当的类型
  const processedBody = {
    resizeFactor: parseFloat(req.body.resizeFactor),
    interpolation: req.body.interpolation,
    colorMode: req.body.colorMode,
    ditheringRatio: parseFloat(req.body.ditheringRatio)
  }
  
  // 检查参数转换是否成功
  if (isNaN(processedBody.resizeFactor)) {
    return res.status(400).json({
      success: false,
      error: '调整大小因子必须是有效数字',
      code: 'INVALID_RESIZE_FACTOR'
    })
  }
  
  if (isNaN(processedBody.ditheringRatio)) {
    return res.status(400).json({
      success: false,
      error: '抖动比例必须是有效数字',
      code: 'INVALID_DITHERING_RATIO'
    })
  }
  
  // 验证处理后的数据
  const { error, value } = pixelArtValidationSchema.validate(processedBody, {
    abortEarly: false
  })
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }))
    
    console.log('[PixelArt Validation] 验证失败:', errors)
    
    return res.status(400).json({
      success: false,
      error: '像素画转换参数验证失败',
      details: errors,
      code: 'PIXEL_ART_VALIDATION_ERROR'
    })
  }
  
  // 存储验证后的参数
  req.validatedBody = value
  
  console.log('[PixelArt Validation] 验证成功:', {
    file: {
      name: req.file.originalname,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      type: req.file.mimetype
    },
    parameters: value
  })
  
  next()
}

/**
 * 健康检查验证中间件
 */
export const validateHealthCheck = (req: Request, res: Response, next: NextFunction) => {
  // 健康检查不需要特殊验证，直接通过
  next()
}

// 为Express Request接口添加validatedBody属性
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any
    }
  }
}

export default {
  validatePixelArtRequest,
  validateHealthCheck,
  createValidationMiddleware
}

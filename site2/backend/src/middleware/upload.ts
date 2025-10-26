import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

// Vercel兼容的文件上传配置
// 使用内存存储，避免文件系统写入
const storage = multer.memoryStorage()

// 配置multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    // 允许的图像类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的图像格式，请上传 JPEG、PNG、WebP 或 GIF 格式的图像'))
    }
  }
})

// 单文件上传中间件
export const uploadSingle = (fieldName: string = 'image') => {
  return upload.single(fieldName)
}

// 多文件上传中间件
export const uploadMultiple = (fieldName: string = 'images', maxCount: number = 5) => {
  return upload.array(fieldName, maxCount)
}

// 错误处理中间件
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: '文件大小超过限制（最大10MB）',
          timestamp: new Date()
        }
      })
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_FILES',
          message: '文件数量超过限制',
          timestamp: new Date()
        }
      })
    }
  }
  
  if (err.message && err.message.includes('图像格式')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message,
        timestamp: new Date()
      }
    })
  }
  
  next(err)
}

// 验证上传的文件
export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: '没有上传文件',
        timestamp: new Date()
      }
    })
  }
  
  next()
} 
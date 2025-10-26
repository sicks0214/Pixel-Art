import multer from 'multer'
import path from 'path'
import { Request, Response, NextFunction } from 'express'

/**
 * 支持的图像格式
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png'
]

/**
 * 支持的文件扩展名
 */
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

/**
 * 最大文件大小 (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 文件过滤器
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 检查MIME类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    console.log(`[ImageUpload] 拒绝文件类型: ${file.mimetype}`)
    return cb(new Error(`不支持的文件格式。请上传 ${ALLOWED_MIME_TYPES.join(', ')} 格式的图片`))
  }

  // 检查文件扩展名
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    console.log(`[ImageUpload] 拒绝文件扩展名: ${ext}`)
    return cb(new Error(`不支持的文件扩展名。请上传 ${ALLOWED_EXTENSIONS.join(', ')} 格式的图片`))
  }

  // 验证文件名
  if (!file.originalname || file.originalname.length > 255) {
    console.log(`[ImageUpload] 无效文件名: ${file.originalname}`)
    return cb(new Error('文件名无效或过长'))
  }

  console.log(`[ImageUpload] 接受文件: ${file.originalname}, 类型: ${file.mimetype}, 大小: ${file.size || 'unknown'}`)
  cb(null, true)
}

/**
 * Multer配置 - 内存存储
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // 只允许单个文件
    fieldSize: 1024 * 1024, // 1MB field size limit
    fields: 10 // 最多10个字段
  },
  fileFilter
})

/**
 * 图像上传中间件
 */
export const imageUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const uploadHandler = upload.single('imageFile')
  
  uploadHandler(req, res, (err: any) => {
    if (err) {
      console.error('[ImageUpload] 上传失败:', err.message)
      
      if (err instanceof multer.MulterError) {
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            return res.status(413).json({
              success: false,
              error: `文件大小超出限制。最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
              code: 'FILE_TOO_LARGE'
            })
          
          case 'LIMIT_FILE_COUNT':
            return res.status(400).json({
              success: false,
              error: '只能上传一个文件',
              code: 'TOO_MANY_FILES'
            })
          
          case 'LIMIT_UNEXPECTED_FILE':
            return res.status(400).json({
              success: false,
              error: '请使用字段名 "imageFile" 上传图片',
              code: 'INVALID_FIELD_NAME'
            })
          
          default:
            return res.status(400).json({
              success: false,
              error: `上传错误: ${err.message}`,
              code: 'UPLOAD_ERROR'
            })
        }
      }
      
      // 自定义验证错误
      if (err.message.includes('不支持的文件格式') || err.message.includes('不支持的文件扩展名')) {
        return res.status(415).json({
          success: false,
          error: err.message,
          code: 'UNSUPPORTED_FORMAT'
        })
      }
      
      return res.status(400).json({
        success: false,
        error: err.message,
        code: 'VALIDATION_ERROR'
      })
    }
    
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '请选择要上传的图片文件',
        code: 'NO_FILE'
      })
    }
    
    // 记录成功的文件信息
    console.log(`[ImageUpload] 文件上传成功:`, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      bufferLength: req.file.buffer.length
    })
    
    next()
  })
}

/**
 * 验证图像文件内容
 */
export const validateImageContent = async (buffer: Buffer, mimeType: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // 检查文件头以验证真实格式
    const fileSignatures = {
      'image/jpeg': [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0xFF, 0xD8, 0xFF, 0xE0], // JPEG/JFIF
        [0xFF, 0xD8, 0xFF, 0xE1] // JPEG/EXIF
      ],
      'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
      ]
    }
    
    const signatures = fileSignatures[mimeType as keyof typeof fileSignatures] || []
    
    let isValidFormat = false
    for (const signature of signatures) {
      const match = signature.every((byte, index) => buffer[index] === byte)
      if (match) {
        isValidFormat = true
        break
      }
    }
    
    if (!isValidFormat) {
      return {
        isValid: false,
        error: `文件内容与声明的格式 ${mimeType} 不匹配`
      }
    }
    
    // 检查最小尺寸（通过buffer大小粗略估算）
    if (buffer.length < 1024) { // 小于1KB的图像文件可能有问题
      return {
        isValid: false,
        error: '图像文件过小，可能已损坏'
      }
    }
    
    return { isValid: true }
    
  } catch (error) {
    return {
      isValid: false,
      error: `图像文件验证失败: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export default imageUploadMiddleware

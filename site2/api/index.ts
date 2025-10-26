// Vercel API函数 - 健康检查和基础API
// 前端应用主要独立运行，此API仅提供基础支持

import { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // 健康检查
  if (req.url === '/api' || req.url === '/api/' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: '像素画转换器 API 正常运行',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      mode: 'frontend-primary'
    })
  }

  // 默认响应
  return res.status(200).json({
    message: '像素画转换器 - 前端独立运行模式',
    note: '主要功能在前端实现，无需后端API',
    timestamp: new Date().toISOString()
  })
}
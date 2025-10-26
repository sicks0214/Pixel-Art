/**
 * 组件懒加载配置
 */

import { lazy } from 'react'

// 路由级别的代码分割
export const routeComponents = {
  SimplePalettePage: () => import('@pages/SimplePalettePage'),
}

// 懒加载的页面组件
export const LazySimplePalettePage = lazy(() => import('@pages/SimplePalettePage'))

/**
 * 批量预加载路由组件
 */
export async function preloadRoutes(routes: (keyof typeof routeComponents)[]): Promise<void> {
  console.log('🚀 开始预加载路由组件...')
  
  try {
    await Promise.all(
      routes.map(async (route) => {
        await routeComponents[route]()
        console.log(`✅ 预加载完成: ${route}`)
      })
    )
    console.log('🎉 所有路由组件预加载完成')
  } catch (error) {
    console.error('❌ 路由预加载失败:', error)
  }
}

/**
 * 图片懒加载Hook
 */
export function useImageLazyLoading() {
  const createImageLoader = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const preloadImages = async (srcs: string[]): Promise<HTMLImageElement[]> => {
    try {
      const images = await Promise.all(srcs.map(createImageLoader))
      console.log(`✅ 预加载了 ${images.length} 张图片`)
      return images
    } catch (error) {
      console.error('❌ 图片预加载失败:', error)
      throw error
    }
  }

  return {
    preloadImages,
    createImageLoader
  }
}

/**
 * 智能预加载：根据用户行为预测并预加载
 */
export class SmartPreloader {
  private preloadedRoutes = new Set<string>()
  private hoverTimeout: number | null = null

  /**
   * 鼠标悬停预加载
   */
  onLinkHover = (routeName: keyof typeof routeComponents) => {
    if (this.preloadedRoutes.has(routeName)) return

    this.hoverTimeout = window.setTimeout(async () => {
      try {
        await routeComponents[routeName]()
        this.preloadedRoutes.add(routeName)
        console.log(`🎯 悬停预加载完成: ${routeName}`)
      } catch (error) {
        console.error(`❌ 悬停预加载失败: ${routeName}`, error)
      }
    }, 50) // 50ms 延迟，避免误触发
  }

  /**
   * 取消悬停预加载
   */
  onLinkLeave = () => {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
      this.hoverTimeout = null
    }
  }

  /**
   * 空闲时间预加载
   */
  preloadOnIdle = (routes: (keyof typeof routeComponents)[]) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadRoutes(routes)
      })
    } else {
      // 降级方案
      setTimeout(() => {
        preloadRoutes(routes)
      }, 2000)
    }
  }
}

export const smartPreloader = new SmartPreloader() 
/**
 * 测试环境配置
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest'

// 扩展Jest DOM匹配器
import '@testing-library/jest-dom/vitest'

// 模拟窗口对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟 performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    mark: vi.fn(),
    measure: vi.fn(),
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
  },
})

// 清理函数
beforeAll(() => {
  // 测试开始前的全局设置
})

afterEach(() => {
  // 每个测试后清理
  vi.clearAllMocks()
})

afterAll(() => {
  // 所有测试完成后的清理
}) 
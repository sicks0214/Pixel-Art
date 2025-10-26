/**
 * Jest 测试配置
 * 支持TypeScript，包含覆盖率报告和超时设置
 */

module.exports = {
  // 指定测试环境为Node.js
  testEnvironment: 'node',
  
  // TypeScript支持
  preset: 'ts-jest',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/tests/**/*.test.ts',
    '<rootDir>/src/tests/**/*.spec.ts'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  },
  
  // 测试超时设置（毫秒）
  testTimeout: 30000,
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/index.ts',
    '!src/**/*.d.ts',
    '!**/node_modules/**'
  ],
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    },
    // 为关键模块设置更高的覆盖率要求
    'src/services/pixelArt/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // 测试设置文件
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup.ts'
  ],
  
  // 详细输出
  verbose: true,
  
  // 并发运行限制
  maxWorkers: '50%',
  
  // 清除模拟
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // 全局变量
  globals: {
    'ts-jest': {
      useESM: false,
      isolatedModules: true
    }
  },
  
  // 转换配置
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false
    }]
  },
  
  // 模块文件扩展名
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // 报告器配置
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'COLOR03 Pixel Art API Test Report'
      }
    ]
  ],
  
  // 测试结果处理器
  testResultsProcessor: './src/tests/testResultsProcessor.js',
  
  // 错误处理
  errorOnDeprecated: false,
  
  // 缓存配置
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // 快照序列化器
  snapshotSerializers: [],
  
  // 监听插件
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}


# 测试配置说明

## 概述

本项目使用 **Vitest** 作为测试框架，提供了完整的单元测试和集成测试支持。

## 测试结构

```
frontend/src/tests/
├── README.md              # 测试说明文档
├── setup.ts               # 测试环境配置
├── utils/                 # 工具函数测试
│   └── performance.test.ts
├── components/            # 组件测试 (待完善)
├── services/             # 服务测试 (待完善)
└── pages/                # 页面测试 (待完善)
```

## 测试配置

### 环境设置

`setup.ts` 文件包含了测试环境的基础配置：

- **DOM 扩展**: 引入 `@testing-library/jest-dom` 匹配器
- **API 模拟**: 模拟浏览器 API (ResizeObserver, IntersectionObserver 等)
- **性能监控**: 模拟 Performance API
- **清理函数**: 自动清理测试状态

### 已实现的测试

1. **性能监控测试** (`utils/performance.test.ts`)
   - 性能标记创建
   - 性能测量功能
   - 指标获取
   - 报告生成

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test performance.test.ts

# 监视模式运行测试
npm test -- --watch

# 生成测试覆盖率报告
npm test -- --coverage
```

## 扩展测试依赖

如需完整的组件测试支持，建议添加以下依赖：

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## 测试最佳实践

### 1. 测试命名

- 使用描述性的测试名称
- 以 "应该..." 或 "能够..." 开头
- 清楚地描述测试的预期行为

### 2. 测试结构

```typescript
describe('组件/功能名称', () => {
  beforeEach(() => {
    // 每个测试前的设置
  })

  it('应该正确处理正常情况', () => {
    // 安排 (Arrange)
    // 执行 (Act)  
    // 断言 (Assert)
  })

  it('应该正确处理边界情况', () => {
    // 测试边界条件
  })

  it('应该正确处理错误情况', () => {
    // 测试错误处理
  })
})
```

### 3. 模拟和存根

- 使用 `vi.fn()` 创建模拟函数
- 使用 `vi.mock()` 模拟模块
- 在 `beforeEach` 中清理模拟状态

### 4. 异步测试

```typescript
it('应该正确处理异步操作', async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

## 测试覆盖率目标

- **组件**: 80%+ 覆盖率
- **工具函数**: 90%+ 覆盖率
- **服务层**: 85%+ 覆盖率
- **关键业务逻辑**: 95%+ 覆盖率

## 持续集成

测试将在以下情况自动运行：

- 代码提交时 (pre-commit hook)
- Pull Request 创建时
- 主分支合并时
- 发布版本时

## 性能测试

除了功能测试外，还包含性能监控测试：

- Web Vitals 指标测试
- 组件渲染性能测试  
- 用户交互延迟测试
- 资源加载性能测试

## 未来计划

- [ ] 添加端到端 (E2E) 测试
- [ ] 集成 Cypress 或 Playwright
- [ ] 添加视觉回归测试
- [ ] 完善组件测试覆盖
- [ ] 添加性能基准测试 
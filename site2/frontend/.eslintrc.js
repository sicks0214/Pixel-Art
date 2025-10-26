module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'jsx-a11y',
    'i18n', // 自定义多语言插件
  ],
  rules: {
    // 多语言相关规则
    'i18n/no-hardcoded-text': 'warn',
    'i18n/no-chinese-text': 'warn',
    'i18n/no-english-text': 'warn',
    'i18n/require-translation-key': 'warn',
    
    // React相关规则
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    
    // TypeScript相关规则
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {},
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // TypeScript特定规则
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      rules: {
        // 测试文件中的规则
        'i18n/no-hardcoded-text': 'off',
        'i18n/no-chinese-text': 'off',
        'i18n/no-english-text': 'off',
      },
    },
  ],
  // 自定义多语言规则
  plugins: {
    i18n: {
      rules: {
        'no-hardcoded-text': {
          create(context) {
            return {
              Literal(node) {
                if (typeof node.value === 'string' && node.value.length > 2) {
                  // 检测中文文本
                  if (/[\u4e00-\u9fa5]/.test(node.value)) {
                    context.report({
                      node,
                      message: '检测到硬编码的中文文本，请使用翻译键',
                    })
                  }
                  // 检测英文文本
                  if (/^[a-zA-Z\s]+$/.test(node.value) && node.value.length > 3) {
                    context.report({
                      node,
                      message: '检测到硬编码的英文文本，请使用翻译键',
                    })
                  }
                }
              },
              JSXText(node) {
                const text = node.value.trim()
                if (text.length > 2) {
                  // 检测中文文本
                  if (/[\u4e00-\u9fa5]/.test(text)) {
                    context.report({
                      node,
                      message: '检测到硬编码的中文文本，请使用翻译键',
                    })
                  }
                  // 检测英文文本
                  if (/^[a-zA-Z\s]+$/.test(text) && text.length > 3) {
                    context.report({
                      node,
                      message: '检测到硬编码的英文文本，请使用翻译键',
                    })
                  }
                }
              },
            }
          },
        },
        'no-chinese-text': {
          create(context) {
            return {
              Literal(node) {
                if (typeof node.value === 'string' && /[\u4e00-\u9fa5]/.test(node.value)) {
                  context.report({
                    node,
                    message: '检测到中文文本，请使用翻译键',
                  })
                }
              },
              JSXText(node) {
                if (/[\u4e00-\u9fa5]/.test(node.value)) {
                  context.report({
                    node,
                    message: '检测到中文文本，请使用翻译键',
                  })
                }
              },
            }
          },
        },
        'no-english-text': {
          create(context) {
            return {
              Literal(node) {
                if (typeof node.value === 'string' && /^[a-zA-Z\s]+$/.test(node.value) && node.value.length > 3) {
                  context.report({
                    node,
                    message: '检测到英文文本，请使用翻译键',
                  })
                }
              },
              JSXText(node) {
                if (/^[a-zA-Z\s]+$/.test(node.value) && node.value.length > 3) {
                  context.report({
                    node,
                    message: '检测到英文文本，请使用翻译键',
                  })
                }
              },
            }
          },
        },
        'require-translation-key': {
          create(context) {
            return {
              CallExpression(node) {
                if (node.callee.name === 't' && node.arguments.length > 0) {
                  const key = node.arguments[0]
                  if (key.type === 'Literal' && typeof key.value === 'string') {
                    // 检查翻译键格式
                    if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/.test(key.value)) {
                      context.report({
                        node: key,
                        message: '翻译键格式不正确，应使用小写字母和点号分隔',
                      })
                    }
                  }
                }
              },
            }
          },
        },
      },
    },
  },
} 
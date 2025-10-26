#!/usr/bin/env node

/**
 * 架构验证脚本
 * 用于验证项目架构的完整性和一致性
 */

const fs = require('fs')
const path = require('path')

// 验证配置
const VALIDATION_CONFIG = {
  requiredFiles: [
    'docs/architecture.md',
    'docs/architecture-management.md',
    'docs/architecture-changelog.md',
    'README.md',
    'package.json'
  ],
  requiredDirectories: [
    'frontend',
    'backend',
    'shared',
    'docs'
  ],
  requiredSections: [
    '## 🏗️ **项目结构**',
    '## 🚀 **技术栈**',
    '## 📦 **核心模块**',
    '## 🎯 **快速开始**'
  ]
}

// 验证结果
const validationResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
}

/**
 * 验证必需文件是否存在
 */
function validateRequiredFiles() {
  console.log('🔍 验证必需文件...')
  
  VALIDATION_CONFIG.requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} 文件存在`)
      validationResults.passed++
    } else {
      console.log(`❌ ${file} 文件不存在`)
      validationResults.failed++
      validationResults.errors.push(`缺少必需文件: ${file}`)
    }
  })
}

/**
 * 验证必需目录是否存在
 */
function validateRequiredDirectories() {
  console.log('\n🔍 验证必需目录...')
  
  VALIDATION_CONFIG.requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      console.log(`✅ ${dir} 目录存在`)
      validationResults.passed++
    } else {
      console.log(`❌ ${dir} 目录不存在`)
      validationResults.failed++
      validationResults.errors.push(`缺少必需目录: ${dir}`)
    }
  })
}

/**
 * 验证架构文档内容
 */
function validateArchitectureContent() {
  console.log('\n🔍 验证架构文档内容...')
  
  const architectureFile = 'docs/architecture.md'
  if (!fs.existsSync(architectureFile)) {
    console.log(`❌ ${architectureFile} 文件不存在`)
    validationResults.failed++
    validationResults.errors.push(`缺少架构文档: ${architectureFile}`)
    return
  }
  
  try {
    const content = fs.readFileSync(architectureFile, 'utf8')
    
    VALIDATION_CONFIG.requiredSections.forEach(section => {
      if (content.includes(section)) {
        console.log(`✅ 包含必需章节: ${section}`)
        validationResults.passed++
      } else {
        console.log(`❌ 缺少必需章节: ${section}`)
        validationResults.failed++
        validationResults.errors.push(`架构文档缺少章节: ${section}`)
      }
    })
    
    // 检查项目结构图
    if (content.includes('📁 通用Web应用框架/')) {
      console.log('✅ 包含项目结构图')
      validationResults.passed++
    } else {
      console.log('❌ 缺少项目结构图')
      validationResults.failed++
      validationResults.errors.push('架构文档缺少项目结构图')
    }
    
  } catch (error) {
    console.log(`❌ 读取架构文档失败: ${error.message}`)
    validationResults.failed++
    validationResults.errors.push(`读取架构文档失败: ${error.message}`)
  }
}

/**
 * 验证目录结构完整性
 */
function validateDirectoryStructure() {
  console.log('\n🔍 验证目录结构完整性...')
  
  const expectedStructure = {
    'frontend/src': {
      'presentation': ['components', 'pages'],
      'controller': ['stores'],
      'business': ['services'],
      'service': ['api'],
      'data': ['models'],
      'plugins': ['core', 'marketplace', 'examples'],
      'i18n': ['core', 'locales', 'components']
    },
    'backend/src': {
      'presentation': ['routes'],
      'controller': ['controllers'],
      'business': [],
      'service': [],
      'data': [],
      'plugins': []
    },
    'shared': {
      'types': [],
      'constants': [],
      'i18n': []
    },
    'docs': {
      'architecture.md': [],
      'api.md': [],
      'plugins.md': []
    }
  }
  
  for (const [dir, subdirs] of Object.entries(expectedStructure)) {
    if (!fs.existsSync(dir)) {
      console.log(`❌ 缺少目录: ${dir}`)
      validationResults.failed++
      validationResults.errors.push(`缺少目录: ${dir}`)
      continue
    }
    
    if (Array.isArray(subdirs)) {
      // 处理数组格式的子目录
      for (const subdir of subdirs) {
        const fullPath = path.join(dir, subdir)
        if (!fs.existsSync(fullPath)) {
          console.log(`❌ 缺少子目录: ${fullPath}`)
          validationResults.failed++
          validationResults.errors.push(`缺少子目录: ${fullPath}`)
        } else {
          console.log(`✅ 目录存在: ${fullPath}`)
          validationResults.passed++
        }
      }
    } else {
      // 处理对象格式的子目录
      for (const [subdir, files] of Object.entries(subdirs)) {
        const fullPath = path.join(dir, subdir)
        if (!fs.existsSync(fullPath)) {
          console.log(`❌ 缺少子目录: ${fullPath}`)
          validationResults.failed++
          validationResults.errors.push(`缺少子目录: ${fullPath}`)
        } else {
          console.log(`✅ 目录存在: ${fullPath}`)
          validationResults.passed++
        }
      }
    }
  }
}

/**
 * 验证文档一致性
 */
function validateDocumentConsistency() {
  console.log('\n🔍 验证文档一致性...')
  
  // 检查README中的项目结构是否与架构文档一致
  const readmeFile = 'README.md'
  const architectureFile = 'docs/architecture.md'
  
  if (fs.existsSync(readmeFile) && fs.existsSync(architectureFile)) {
    try {
      const readmeContent = fs.readFileSync(readmeFile, 'utf8')
      const architectureContent = fs.readFileSync(architectureFile, 'utf8')
      
      // 检查是否都包含项目结构图
      const readmeHasStructure = readmeContent.includes('📁 通用Web应用框架/')
      const architectureHasStructure = architectureContent.includes('📁 通用Web应用框架/')
      
      if (readmeHasStructure && architectureHasStructure) {
        console.log('✅ README和架构文档都包含项目结构图')
        validationResults.passed++
      } else {
        console.log('❌ README和架构文档的项目结构图不一致')
        validationResults.failed++
        validationResults.errors.push('README和架构文档的项目结构图不一致')
      }
      
    } catch (error) {
      console.log(`❌ 读取文档失败: ${error.message}`)
      validationResults.failed++
      validationResults.errors.push(`读取文档失败: ${error.message}`)
    }
  }
}

/**
 * 验证变更日志
 */
function validateChangelog() {
  console.log('\n🔍 验证变更日志...')
  
  const changelogFile = 'docs/architecture-changelog.md'
  if (!fs.existsSync(changelogFile)) {
    console.log(`❌ 缺少变更日志: ${changelogFile}`)
    validationResults.failed++
    validationResults.errors.push(`缺少变更日志: ${changelogFile}`)
    return
  }
  
  try {
    const content = fs.readFileSync(changelogFile, 'utf8')
    
    // 检查是否包含变更历史
    if (content.includes('## 📅 **变更历史**')) {
      console.log('✅ 包含变更历史章节')
      validationResults.passed++
    } else {
      console.log('❌ 缺少变更历史章节')
      validationResults.failed++
      validationResults.errors.push('变更日志缺少变更历史章节')
    }
    
    // 检查是否包含最新版本
    if (content.includes('v2.0.0')) {
      console.log('✅ 包含最新版本信息')
      validationResults.passed++
    } else {
      console.log('❌ 缺少最新版本信息')
      validationResults.warnings.push('变更日志可能缺少最新版本信息')
    }
    
  } catch (error) {
    console.log(`❌ 读取变更日志失败: ${error.message}`)
    validationResults.failed++
    validationResults.errors.push(`读取变更日志失败: ${error.message}`)
  }
}

/**
 * 生成验证报告
 */
function generateValidationReport() {
  console.log('\n📊 架构验证报告')
  console.log('='.repeat(50))
  console.log(`✅ 通过: ${validationResults.passed}`)
  console.log(`❌ 失败: ${validationResults.failed}`)
  console.log(`⚠️ 警告: ${validationResults.warnings.length}`)
  console.log(`📈 成功率: ${((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100).toFixed(2)}%`)
  
  if (validationResults.errors.length > 0) {
    console.log('\n❌ 错误详情:')
    validationResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`)
    })
  }
  
  if (validationResults.warnings.length > 0) {
    console.log('\n⚠️ 警告详情:')
    validationResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`)
    })
  }
  
  if (validationResults.failed === 0) {
    console.log('\n🎉 架构验证通过！架构文档完整且一致。')
    process.exit(0)
  } else {
    console.log('\n⚠️ 架构验证失败，请修复上述错误。')
    process.exit(1)
  }
}

/**
 * 主验证函数
 */
function runValidation() {
  console.log('🏗️ 开始架构验证...\n')
  
  validateRequiredFiles()
  validateRequiredDirectories()
  validateArchitectureContent()
  validateDirectoryStructure()
  validateDocumentConsistency()
  validateChangelog()
  
  generateValidationReport()
}

// 运行验证
if (require.main === module) {
  runValidation()
}

module.exports = {
  runValidation,
  validationResults
} 
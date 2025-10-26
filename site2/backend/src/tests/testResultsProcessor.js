/**
 * Jest测试结果处理器
 * 生成详细的测试报告和统计信息
 */

const fs = require('fs')
const path = require('path')

/**
 * 处理测试结果
 * @param {Object} testResults - Jest测试结果对象
 * @returns {Object} 处理后的测试结果
 */
module.exports = function(testResults) {
  const {
    numFailedTests,
    numPassedTests,
    numPendingTests,
    testResults: results,
    startTime,
    endTime
  } = testResults

  const totalTime = endTime - startTime
  const totalTests = numFailedTests + numPassedTests + numPendingTests

  // 生成测试统计
  const stats = {
    总测试数: totalTests,
    成功: numPassedTests,
    失败: numFailedTests,
    跳过: numPendingTests,
    成功率: totalTests > 0 ? ((numPassedTests / totalTests) * 100).toFixed(2) + '%' : '0%',
    总耗时: (totalTime / 1000).toFixed(2) + 's',
    平均耗时: totalTests > 0 ? (totalTime / totalTests).toFixed(0) + 'ms' : '0ms',
    测试时间: new Date().toISOString()
  }

  // 收集性能数据
  const performanceData = []
  const failureDetails = []

  results.forEach(result => {
    const testFilePath = path.relative(process.cwd(), result.testFilePath)
    
    result.testResults.forEach(test => {
      if (test.duration) {
        performanceData.push({
          测试名称: test.title,
          文件: testFilePath,
          耗时: test.duration + 'ms',
          状态: test.status
        })
      }

      if (test.status === 'failed') {
        failureDetails.push({
          测试名称: test.title,
          文件: testFilePath,
          错误信息: test.failureMessages.join('\n'),
          耗时: test.duration + 'ms'
        })
      }
    })
  })

  // 按耗时排序性能数据
  performanceData.sort((a, b) => {
    const timeA = parseInt(a.耗时.replace('ms', ''))
    const timeB = parseInt(b.耗时.replace('ms', ''))
    return timeB - timeA
  })

  // 生成详细报告
  const report = {
    统计信息: stats,
    性能排行: performanceData.slice(0, 20), // 显示最慢的20个测试
    失败详情: failureDetails,
    测试套件信息: results.map(result => ({
      文件: path.relative(process.cwd(), result.testFilePath),
      测试数: result.numFailingTests + result.numPassingTests + result.numPendingTests,
      成功: result.numPassingTests,
      失败: result.numFailingTests,
      跳过: result.numPendingTests,
      耗时: (result.perfStats.end - result.perfStats.start).toFixed(0) + 'ms'
    }))
  }

  // 控制台输出简化报告
  console.log('\n🧪 COLOR03 像素画API测试报告')
  console.log('=' .repeat(50))
  
  Object.entries(stats).forEach(([key, value]) => {
    console.log(`${key.padEnd(10)}: ${value}`)
  })

  if (performanceData.length > 0) {
    console.log('\n⚡ 性能最慢的5个测试:')
    performanceData.slice(0, 5).forEach((test, index) => {
      console.log(`${index + 1}. ${test.测试名称} - ${test.耗时}`)
    })
  }

  if (failureDetails.length > 0) {
    console.log('\n❌ 失败的测试:')
    failureDetails.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.测试名称}`)
    })
  }

  // 保存详细报告到文件
  const reportDir = path.join(process.cwd(), 'test-reports')
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportFile = path.join(reportDir, `test-report-${Date.now()}.json`)
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

  // 生成简化的Markdown报告
  const markdownReport = generateMarkdownReport(report)
  const markdownFile = path.join(reportDir, 'latest-test-report.md')
  fs.writeFileSync(markdownFile, markdownReport)

  console.log(`\n📊 详细报告已保存至: ${reportFile}`)
  console.log(`📝 Markdown报告已保存至: ${markdownFile}`)

  return testResults
}

/**
 * 生成Markdown格式的测试报告
 */
function generateMarkdownReport(report) {
  const { 统计信息: stats, 性能排行: performance, 失败详情: failures, 测试套件信息: suites } = report

  let markdown = `# COLOR03 像素画API测试报告

## 📊 测试统计

| 指标 | 值 |
|------|-----|
`

  Object.entries(stats).forEach(([key, value]) => {
    markdown += `| ${key} | ${value} |\n`
  })

  if (performance.length > 0) {
    markdown += `\n## ⚡ 性能统计（前10名最慢测试）

| 排名 | 测试名称 | 文件 | 耗时 | 状态 |
|------|----------|------|------|------|
`

    performance.slice(0, 10).forEach((test, index) => {
      markdown += `| ${index + 1} | ${test.测试名称} | ${test.文件} | ${test.耗时} | ${test.状态} |\n`
    })
  }

  if (suites.length > 0) {
    markdown += `\n## 📁 测试套件详情

| 文件 | 总数 | 成功 | 失败 | 跳过 | 耗时 |
|------|------|------|------|------|------|
`

    suites.forEach(suite => {
      markdown += `| ${suite.文件} | ${suite.测试数} | ${suite.成功} | ${suite.失败} | ${suite.跳过} | ${suite.耗时} |\n`
    })
  }

  if (failures.length > 0) {
    markdown += `\n## ❌ 失败测试详情\n\n`

    failures.forEach((failure, index) => {
      markdown += `### ${index + 1}. ${failure.测试名称}

**文件**: ${failure.文件}  
**耗时**: ${failure.耗时}

**错误信息**:
\`\`\`
${failure.错误信息}
\`\`\`

---

`
    })
  }

  markdown += `\n## 📅 报告生成信息

- **生成时间**: ${stats.测试时间}
- **总耗时**: ${stats.总耗时}
- **成功率**: ${stats.成功率}

---

*此报告由COLOR03 像素画API测试套件自动生成*
`

  return markdown
}


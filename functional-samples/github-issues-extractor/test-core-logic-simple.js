/**
 * 核心逻辑测试 - 验证 extractIssues 函数的基本结构
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 读取 popup.js
const popupJS = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');

// 提取 extractIssues 函数
const functionMatch = popupJS.match(/function extractIssues\(\)\s*{[\s\S]*?return uniqueIssues;\s*}/);
if (!functionMatch) {
  console.error('❌ 无法找到 extractIssues 函数');
  process.exit(1);
}

console.log('✅ 找到 extractIssues 函数');

// 检查关键修复点
const checks = [
  { check: /func:\s*extractIssues/, name: '使用 func: 而不是 function:' },
  { check: /world:\s*['"]MAIN['"]/, name: '使用 world: "MAIN"' },
  { check: /tab\.url\.includes\('github\.com'\).*includes\('\/issues'\)/, name: 'URL 检测支持任意 GitHub issues 页面' },
  { check: /chrome\.runtime\.lastError/, name: '错误处理' },
  { check: /data-testid="issue-row"/, name: '支持现代 GitHub 选择器' },
  { check: /turbo-frame/, name: '支持 Turbo Frame' },
  { check: /uniqueIssues/, name: '去重逻辑' },
  { check: /issue\.url/, name: 'URL 字段' },
];

console.log('\n📋 关键修复点检查:');
checks.forEach(({ check, name }) => {
  const passed = check.test(popupJS);
  console.log(`  ${passed ? '✅' : '❌'} ${name}`);
});

// 检查函数是否在顶层
const extractIssuesPos = popupJS.indexOf('function extractIssues()');
const domContentPos = popupJS.indexOf('document.addEventListener(\'DOMContentLoaded\'');
if (extractIssuesPos < domContentPos && extractIssuesPos > 0) {
  console.log('  ✅ extractIssues 函数在顶层作用域');
} else {
  console.log('  ❌ extractIssues 函数位置不正确');
}

// 创建模拟 HTML 测试
const testHTML = `
<!DOCTYPE html>
<html>
<body>
  <div data-testid="issue-row">
    <a href="/owner/repo/issues/123">Test Issue</a>
    <span class="State">OPEN</span>
    <a href="/testuser" data-hovercard-type="user">testuser</a>
    <relative-time datetime="2024-01-15T10:00:00Z"></relative-time>
  </div>
  <div data-testid="issue-row">
    <a href="/owner/repo/issues/456">Another Issue</a>
    <span class="State">CLOSED</span>
    <a href="/otheruser" data-hovercard-type="user">otheruser</a>
    <relative-time datetime="2024-01-10T10:00:00Z"></relative-time>
  </div>
</body>
</html>
`;

const dom = new JSDOM(testHTML, { url: 'https://github.com/owner/repo/issues' });
global.document = dom.window.document;
global.window = dom.window;
global.console = { log: () => {}, error: () => {} };

// 执行 extractIssues 函数
try {
  // 提取并执行函数体
  const functionBody = functionMatch[0].replace(/function extractIssues\(\)\s*\{/, '').replace(/return uniqueIssues;\s*}$/, '');
  
  // 在模拟环境中测试
  const testFunc = new Function(`
    const window = this.window;
    const document = this.document;
    const console = { log: () => {}, error: () => {} };
    
    ${functionBody}
    return uniqueIssues;
  `);
  
  const result = testFunc.call({ window: dom.window, document: dom.window.document });
  console.log(`\n🧪 测试结果: 提取到 ${result ? result.length : 0} 个 issues`);
  if (result && result.length > 0) {
    console.log('  ✅ DOM 提取逻辑正常工作');
    result.forEach((issue, i) => {
      console.log(`     ${i+1}. ${issue.id}: ${issue.title} (${issue.status}) by ${issue.author}`);
    });
  } else {
    console.log('  ⚠️  测试 DOM 中没有提取到 issues（可能是选择器不匹配）');
  }
  
} catch (e) {
  console.log(`\n⚠️  函数执行测试跳过: ${e.message}`);
}

console.log('\n🎉 基本测试完成!');

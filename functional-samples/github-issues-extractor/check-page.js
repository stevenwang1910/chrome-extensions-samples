const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./page.html', 'utf8');

console.log('=== 检查 Turbo Frame ===');
console.log('是否有 repo-content-turbo-frame:', html.includes('repo-content-turbo-frame'));
console.log('是否有 turbo-frame:', html.includes('turbo-frame'));

const reactAppPos = html.indexOf('<react-app');
const turboFramePos = html.indexOf('turbo-frame');
console.log('react-app 位置:', reactAppPos);
console.log('turbo-frame 位置:', turboFramePos);

console.log('是否有 #shadow-root:', html.includes('#shadow-root'));
console.log('是否有 open shadow root:', html.includes('open shadow root'));

const dom = new JSDOM(html);
const doc = dom.window.document;

console.log('\n=== 页面结构检查 ===');
console.log('react-app 标签数量:', doc.querySelectorAll('react-app').length);
console.log('script[type="application/json"] 数量:', doc.querySelectorAll('script[type="application/json"]').length);
console.log('data-testid="issue-row" 数量:', doc.querySelectorAll('[data-testid="issue-row"]').length);

const turboFrames = doc.querySelectorAll('turbo-frame, [id*="turbo"]');
console.log('turbo-frame 数量:', turboFrames.length);
turboFrames.forEach((f, i) => {
  console.log(`  frame[${i}]:`, f.id, f.getAttribute('src'));
});

// 检查 react-app 内部结构
const reactApp = doc.querySelector('react-app');
if (reactApp) {
  console.log('\n=== react-app 内部 ===');
  const scriptsInside = reactApp.querySelectorAll('script');
  console.log('react-app 内的 script 数量:', scriptsInside.length);
  scriptsInside.forEach((s, i) => {
    console.log(`  script[${i}]: type=${s.type}, data-target=${s.getAttribute('data-target')}`);
  });
}

// 检查包含 "IssueIndexPageQuery" 的位置
console.log('\n=== IssueIndexPageQuery 位置 ===');
const issueQueryPos = html.indexOf('IssueIndexPageQuery');
console.log('IssueIndexPageQuery 位置:', issueQueryPos);
if (issueQueryPos > 0) {
  const context = html.substring(issueQueryPos - 100, issueQueryPos + 100);
  console.log('上下文:', context.replace(/\s+/g, ' '));
}

// 检查页面中的 JSON 数据
console.log('\n=== 检查 JSON 数据结构 ===');
const allScripts = doc.querySelectorAll('script[type="application/json"]');
allScripts.forEach((script, i) => {
  try {
    const data = JSON.parse(script.textContent);
    if (data.payload && data.payload.preloadedQueries) {
      console.log(`脚本 ${i}: 有 preloadedQueries, 数量:`, data.payload.preloadedQueries.length);
      data.payload.preloadedQueries.forEach((q, j) => {
        console.log(`  查询 ${j}:`, q.queryName);
      });
    }
  } catch (e) {
    console.log(`脚本 ${i}: 解析失败`, e.message);
  }
});

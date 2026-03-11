// 测试脚本：在 GitHub Issues 页面控制台运行，查看 DOM 结构
function testGitHubDOM() {
  console.log('=== Testing GitHub Issues DOM Structure ===');

  const allDivs = document.querySelectorAll('div');
  console.log('Total divs:', allDivs.length);

  const issueLikeDivs = [];
  allDivs.forEach((div) => {
    if (div.textContent.includes('#') && div.textContent.includes('opened')) {
      issueLikeDivs.push(div);
    }
  });
  console.log('Issue-like divs:', issueLikeDivs.length);

  if (issueLikeDivs.length > 0) {
    console.log(
      'First issue-like div HTML:',
      issueLikeDivs[0].outerHTML.substring(0, 2000)
    );
  }

  const allLinks = document.querySelectorAll('a');
  console.log('Total links:', allLinks.length);

  const issueLinks = [];
  allLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.includes('/issues/')) {
      issueLinks.push(link);
    }
  });
  console.log('Issue links:', issueLinks.length);

  if (issueLinks.length > 0) {
    issueLinks.forEach((link, i) => {
      console.log(
        `Link ${i}:`,
        link.textContent.trim(),
        link.getAttribute('href')
      );
    });
  }

  console.log('=== End of Test ===');
}

testGitHubDOM();

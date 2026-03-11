document.addEventListener('DOMContentLoaded', function() {
  // 初始加载数据
  loadIssuesData();
  
  // 刷新按钮点击事件
  document.getElementById('refreshBtn').addEventListener('click', function() {
    loadIssuesData();
  });
});

function loadIssuesData() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com/GoogleChrome/chrome-extensions-samples/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to GitHub issues page';
      return;
    }

    // 显示加载状态
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    document.getElementById('debug').style.display = 'none';
    
    // 清空表格
    const tbody = document.querySelector('#issuesTable tbody');
    tbody.innerHTML = '';

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      const issues = results[0].result;
      
      // Show debug info
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No issues found</td></tr>';
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = issue.id;
        row.insertCell(1).textContent = issue.status;
        row.insertCell(2).textContent = issue.title;
        row.insertCell(3).textContent = issue.author;
        row.insertCell(4).textContent = issue.date;
      });
    });
  });
}

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Approach 1: Extract from React embedded JSON (modern GitHub)
  const embeddedDataScript = document.querySelector('script[data-target="react-app.embeddedData"]');
  if (embeddedDataScript) {
    try {
      const embeddedData = JSON.parse(embeddedDataScript.textContent);
      console.log('Found embedded data:', embeddedData);
      
      // Navigate through the preloaded queries to find issues
      if (embeddedData.payload && embeddedData.payload.preloadedQueries) {
        for (const query of embeddedData.payload.preloadedQueries) {
          if (query.result && query.result.data && query.result.data.repository && query.result.data.repository.search) {
            const edges = query.result.data.repository.search.edges;
            if (edges && edges.length > 0) {
              edges.forEach(edge => {
                if (edge.node && edge.node.__typename === 'Issue') {
                  const issue = edge.node;
                  issues.push({
                    id: '#' + issue.number,
                    status: issue.state === 'OPEN' ? 'Open' : issue.state === 'CLOSED' ? 'Closed' : issue.state,
                    title: issue.title,
                    author: issue.author ? issue.author.login : 'Unknown',
                    date: (issue.state === 'CLOSED' && issue.closedAt ? issue.closedAt : issue.createdAt) ? (issue.state === 'CLOSED' && issue.closedAt ? issue.closedAt : issue.createdAt).split('T')[0] : 'Unknown'
                  });
                }
              });
            }
          }
        }
      }
      
      console.log('Found', issues.length, 'issues using embedded JSON approach');
      if (issues.length > 0) {
        return issues;
      }
    } catch (e) {
      console.error('Error parsing embedded JSON:', e);
    }
  }
  
  // Approach 2: Try DOM approach for older GitHub pages
  const selectors = [
    'div.js-issue-row',
    'div[data-hovercard-type="issue"]'
  ];
  
  let allElements = [];
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    console.log(`Found ${elements.length} elements for selector: ${selector}`);
    allElements = allElements.concat(Array.from(elements));
  });
  
  const uniqueElements = [...new Set(allElements)];
  console.log('Total unique elements:', uniqueElements.length);
  
  uniqueElements.forEach(element => {
    const titleElement = element.querySelector('a[data-hovercard-type="issue"]');
    const idElement = element.querySelector('span[id^="issue_"]');
    const statusElement = element.querySelector('span.State');
    const authorElement = element.querySelector('a[data-hovercard-type="user"]');
    const timeElement = element.querySelector('relative-time');
    
    if (titleElement && idElement) {
      issues.push({
        id: idElement.textContent ? idElement.textContent.trim() : '#' + titleElement.href.split('/').pop(),
        status: statusElement ? statusElement.textContent.trim() : 'Unknown',
        title: titleElement.textContent.trim(),
        author: authorElement ? authorElement.textContent.trim() : 'Unknown',
        date: timeElement ? timeElement.getAttribute('datetime').split('T')[0] : 'Unknown'
      });
    }
  });
  
  console.log('Returning issues:', issues.length);
  return issues;
}

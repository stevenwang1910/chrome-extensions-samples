document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    
    // 检查是否在 GitHub Issues 页面
    if (!tab.url.includes('github.com')) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page';
      return;
    }

    // 首先注入内容脚本，等待页面完全加载
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      if (chrome.runtime.lastError) {
        console.error('Script execution error:', chrome.runtime.lastError);
        document.getElementById('debug').style.display = 'block';
        document.getElementById('debugLog').innerHTML = '<pre style="color: red;">Error: ' + chrome.runtime.lastError.message + '</pre>';
        return;
      }
      
      const issues = results && results[0] ? results[0].result : [];
      const tbody = document.querySelector('#issuesTable tbody');
      
      // 显示调试信息
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      tbody.innerHTML = '';
      
      if (!issues || issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><div class="empty-state-icon">🔍</div>No issues found. Make sure you are on a GitHub issues page with visible issues.</td></tr>';
        return;
      }
      
      // 更新统计信息
      const openCount = issues.filter(i => i.status.toLowerCase() === 'open').length;
      const closedCount = issues.filter(i => i.status.toLowerCase() === 'closed').length;
      
      document.getElementById('stats').style.display = 'flex';
      document.getElementById('totalCount').textContent = issues.length;
      document.getElementById('openCount').textContent = openCount;
      document.getElementById('closedCount').textContent = closedCount;
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        
        const idCell = row.insertCell(0);
        idCell.innerHTML = `<span class="issue-id">${issue.id}</span>`;
        
        const statusCell = row.insertCell(1);
        const statusClass = issue.status.toLowerCase() === 'open' ? 'status-open' : 'status-closed';
        statusCell.innerHTML = `<span class="status-badge ${statusClass}">${issue.status}</span>`;
        
        const titleCell = row.insertCell(2);
        titleCell.innerHTML = `<a href="${issue.url}" target="_blank" class="issue-title">${escapeHtml(issue.title)}</a>`;
        
        const authorCell = row.insertCell(3);
        authorCell.innerHTML = `<span class="author">${escapeHtml(issue.author)}</span>`;
        
        const dateCell = row.insertCell(4);
        dateCell.innerHTML = `<span class="date">${issue.date}</span>`;
      });
    });
  });
});

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function extractIssues() {
  console.log('extractIssues called on:', window.location.href);
  const issues = [];
  
  // 方法 1: 查找所有 issue 链接并提取信息
  const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
  console.log('Found issue links:', issueLinks.length);
  
  issueLinks.forEach(link => {
    const href = link.getAttribute('href');
    const match = href.match(/\/issues\/(\d+)$/);
    if (!match) return;
    
    const issueId = match[1];
    
    // 避免重复
    if (issues.some(i => i.id === '#' + issueId)) return;
    
    // 提取标题
    const title = link.textContent.trim();
    if (!title || title.startsWith('#')) return;
    
    // 向上查找容器 - 查找包含整个 issue 行的大容器
    let container = link.closest('div[data-testid], [role="row"], .Box-row, tr, li, article');
    
    // 如果找不到，向上遍历最多 15 层
    if (!container) {
      container = link.parentElement;
      for (let i = 0; i < 15 && container && container !== document.body; i++) {
        // 检查是否包含状态文本或时间信息
        const text = container.textContent;
        if (text.includes('opened') || text.includes('closed') || text.includes('by')) {
          break;
        }
        container = container.parentElement;
      }
    }
    
    // 提取状态
    let status = 'Open';
    if (container) {
      const containerText = container.textContent;
      
      // 检查各种状态指示
      if (containerText.includes('Status: Closed') || 
          containerText.includes('was closed') ||
          container.querySelector('svg[aria-label*="Closed"], .octicon-issue-closed, [color="danger"]')) {
        status = 'Closed';
      } else if (containerText.includes('Status: Open') ||
                 containerText.includes('opened')) {
        status = 'Open';
      } else if (containerText.includes('Not planned')) {
        status = 'Not planned';
      }
    }
    
    // 提取作者 - 从文本内容中解析
    let author = 'Unknown';
    let date = 'Unknown';
    
    if (container) {
      const containerText = container.textContent;
      
      // 尝试匹配 "by username" 或 "by username was closed on" 格式
      const byMatch = containerText.match(/by\s+([a-zA-Z0-9_-]+)/);
      if (byMatch) {
        author = byMatch[1];
      }
      
      // 尝试匹配日期 - 多种格式
      // 格式 1: "on Jan 23, 2026" 或 "on Feb 2, 2026"
      const dateMatch1 = containerText.match(/on\s+([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/);
      // 格式 2: "opened on Jan 23, 2026"
      const dateMatch2 = containerText.match(/opened\s+on\s+([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/);
      // 格式 3: "closed on Jan 23, 2026"
      const dateMatch3 = containerText.match(/closed\s+on\s+([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/);
      // 格式 4: ISO 日期
      const dateMatch4 = containerText.match(/(\d{4}-\d{2}-\d{2})/);
      
      if (dateMatch3) {
        date = dateMatch3[1];
      } else if (dateMatch2) {
        date = dateMatch2[1];
      } else if (dateMatch1) {
        date = dateMatch1[1];
      } else if (dateMatch4) {
        date = dateMatch4[1];
      }
      
      // 如果从文本中找不到作者，尝试查找链接
      if (author === 'Unknown') {
        const allLinks = container.querySelectorAll('a');
        for (const a of allLinks) {
          if (a === link) continue;
          const aHref = a.getAttribute('href');
          const aText = a.textContent.trim();
          // 匹配用户链接格式 /username
          if (aHref && aHref.match(/^\/[a-zA-Z0-9_-]+$/) && 
              aText && aText.match(/^[a-zA-Z0-9_-]+$/) &&
              aText.length < 40) {
            author = aText;
            break;
          }
        }
      }
      
      // 如果从文本中找不到日期，尝试查找时间元素
      if (date === 'Unknown') {
        const timeEl = container.querySelector('time, relative-time');
        if (timeEl) {
          const datetime = timeEl.getAttribute('datetime');
          const title = timeEl.getAttribute('title');
          const text = timeEl.textContent.trim();
          
          if (datetime) {
            date = datetime.split('T')[0];
          } else if (title) {
            date = title;
          } else if (text) {
            date = text;
          }
        }
      }
    }
    
    issues.push({
      id: '#' + issueId,
      status: status,
      title: title,
      author: author,
      date: date,
      url: href.startsWith('http') ? href : 'https://github.com' + href
    });
  });
  
  console.log('Method 1 found issues:', issues.length);
  
  // 方法 2: 从页面 JSON 数据中提取
  if (issues.length === 0) {
    const scripts = document.querySelectorAll('script[type="application/json"]');
    scripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (data.payload && data.payload.issues) {
          data.payload.issues.forEach(issue => {
            issues.push({
              id: '#' + issue.number,
              status: issue.state || 'Unknown',
              title: issue.title,
              author: issue.user ? issue.user.login : 'Unknown',
              date: issue.created_at ? issue.created_at.split('T')[0] : 'Unknown',
              url: issue.html_url || `https://github.com${window.location.pathname}/${issue.number}`
            });
          });
        }
      } catch (e) {
        // 忽略解析错误
      }
    });
  }
  
  // 方法 3: 从 react-app 容器中提取
  if (issues.length === 0) {
    const reactApp = document.querySelector('react-app[app-name="issues-react"]');
    if (reactApp) {
      const rows = reactApp.querySelectorAll('[data-testid*="row"], [role="row"], .Box-row');
      rows.forEach(row => {
        const link = row.querySelector('a[href*="/issues/"]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        const match = href.match(/\/issues\/(\d+)$/);
        if (!match) return;
        
        const issueId = match[1];
        if (issues.some(i => i.id === '#' + issueId)) return;
        
        const title = link.textContent.trim();
        
        // 从行文本中提取信息
        const rowText = row.textContent;
        let status = 'Open';
        let author = 'Unknown';
        let date = 'Unknown';
        
        if (rowText.includes('closed') || rowText.includes('Closed')) {
          status = 'Closed';
        }
        
        const byMatch = rowText.match(/by\s+([a-zA-Z0-9_-]+)/);
        if (byMatch) {
          author = byMatch[1];
        }
        
        const dateMatch = rowText.match(/on\s+([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/);
        if (dateMatch) {
          date = dateMatch[1];
        }
        
        issues.push({
          id: '#' + issueId,
          status: status,
          title: title,
          author: author,
          date: date,
          url: href.startsWith('http') ? href : 'https://github.com' + href
        });
      });
    }
  }
  
  console.log('Total issues found:', issues.length);
  return issues;
}

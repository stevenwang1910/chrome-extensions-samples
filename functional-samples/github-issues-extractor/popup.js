document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      document.getElementById('loading').textContent = '请导航到 GitHub issues 页面';
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      if (chrome.runtime.lastError) {
        document.getElementById('loading').textContent = '错误: ' + chrome.runtime.lastError.message;
        return;
      }

      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      const result = results[0].result;
      const issues = result.issues || [];
      const debugInfo = result.debugInfo || {};
      const tbody = document.querySelector('#issuesTable tbody');
      const baseUrl = tab.url.split('/issues')[0];
      
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify({issues, debugInfo}, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">未找到 issues。请确保您在已加载内容的 GitHub issues 页面上。</td></tr>';
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        
        const idCell = row.insertCell(0);
        const idLink = document.createElement('a');
        idLink.href = baseUrl + '/issues/' + issue.id.replace('#', '');
        idLink.className = 'issue-link';
        idLink.textContent = issue.id;
        idCell.appendChild(idLink);
        
        const statusCell = row.insertCell(1);
        const statusClass = issue.status.toLowerCase() === 'open' ? 'status-open' : 
                           issue.status.toLowerCase() === 'closed' ? 'status-closed' : 'status-unknown';
        statusCell.className = statusClass;
        statusCell.textContent = issue.status;
        
        const titleCell = row.insertCell(2);
        titleCell.className = 'issue-title';
        titleCell.textContent = issue.title;
        titleCell.title = issue.title;
        
        row.insertCell(3).textContent = issue.author;
        row.insertCell(4).textContent = issue.date;
      });
    });
  });
});

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  const seenIds = new Set();
  
  const debugInfo = {
    pageUrl: window.location.href,
    bodyTextLength: document.body.textContent.length,
    foundElements: [],
    selectorsTried: []
  };

  const bodyText = document.body.textContent || '';
  const issueRegex = /Status: ([^\n]+)\.\s*#(\d+)\s+In GoogleChrome\/chrome-extensions-samples;\s*·\s*(\S+)\s+opened\s+on\s+(\w+ \d+, \d+)/g;
  
  let match;
  while ((match = issueRegex.exec(bodyText)) !== null) {
    issues.push({
      id: '#' + match[2],
      status: match[1],
      title: 'Issue #' + match[2],
      author: match[3],
      date: match[4]
    });
  }
  
  console.log('Found', issues.length, 'issues using regex approach');
  debugInfo.regexIssues = issues.length;
  
  if (issues.length === 0) {
    const selectors = [
      'div[data-testid="issue-row"]',
      'div[data-testid="issue-list-item"]',
      'div[data-testid="issue"]',
      'li[data-testid="issue-row"]',
      'div[data-testid="issue-list"] > div',
      'div[data-testid="issues-list"] > div',
      'div[role="row"][data-testid*="issue"]',
      'div[id^="issue_"]',
      'article[id^="issue_"]',
      'div.js-issue-row',
      'div.js-discussion-item',
      'div.issue-list-item',
      'a[href*="/issues/"]',
      'a[aria-label*="issue"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      debugInfo.selectorsTried.push({selector, count: elements.length});
      console.log(`Found ${elements.length} elements for selector: ${selector}`);
    });
    
    const allElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      allElements = allElements.concat(Array.from(elements));
    });
    
    const uniqueElements = [...new Set(allElements)];
    console.log('Total unique elements:', uniqueElements.length);
    debugInfo.totalUniqueElements = uniqueElements.length;
    
    uniqueElements.forEach((element, index) => {
      console.log(`Processing element ${index}:`, element.tagName, element.className);
      
      const titleElement = 
        element.querySelector('a[data-hovercard-type="issue"]') ||
        element.querySelector('a[href*="/issues/"][data-hovercard-type="issue"]') ||
        element.querySelector('a.IssueLink') ||
        element.querySelector('a.issue-title') ||
        (element.tagName === 'A' && element.href && element.href.includes('/issues/') ? element : null);
        
      const idElement = 
        element.querySelector('a[href*="/issues/"]') ||
        element.querySelector('span[data-issue-id]') ||
        element.querySelector('span.issue-number') ||
        (element.tagName === 'A' && element.href && element.href.includes('/issues/') ? element : null);
        
      const statusElement = 
        element.querySelector('svg[aria-label*="open"]') ||
        element.querySelector('svg[aria-label*="closed"]') ||
        element.querySelector('span[aria-label*="open"]') ||
        element.querySelector('span[aria-label*="closed"]') ||
        element.querySelector('svg.octicon-issue-opened') ||
        element.querySelector('svg.octicon-issue-closed') ||
        element.querySelector('span.State');
        
      const authorElement = 
        element.querySelector('a[data-hovercard-type="user"]') ||
        element.querySelector('a.author') ||
        element.querySelector('span.author a');
        
      const timeElement = 
        element.querySelector('time') ||
        element.querySelector('relative-time') ||
        element.querySelector('span[datetime]');
      
      console.log(`Element ${index}:`, {
        title: !!titleElement,
        id: !!idElement,
        status: !!statusElement,
        author: !!authorElement,
        time: !!timeElement
      });
      
      if (titleElement && idElement) {
        let id = '';
        if (idElement.textContent && idElement.textContent.trim()) {
          id = idElement.textContent.trim();
        } else if (idElement.href) {
          const idMatch = idElement.href.match(/\/issues\/(\d+)/);
          if (idMatch) {
            id = idMatch[1];
          }
        }
        
        if (!id) {
          console.log('Skipping element - no ID found');
          return;
        }
        
        if (seenIds.has(id)) {
          console.log('Skipping duplicate ID:', id);
          return;
        }
        seenIds.add(id);
        
        let status = 'Unknown';
        if (statusElement) {
          const ariaLabel = statusElement.getAttribute('aria-label');
          if (ariaLabel) {
            if (ariaLabel.toLowerCase().includes('open')) {
              status = 'Open';
            } else if (ariaLabel.toLowerCase().includes('closed')) {
              status = 'Closed';
            }
          } else if (statusElement.classList.contains('octicon-issue-opened')) {
            status = 'Open';
          } else if (statusElement.classList.contains('octicon-issue-closed')) {
            status = 'Closed';
          } else {
            const text = statusElement.textContent.trim().toLowerCase();
            if (text.includes('open')) {
              status = 'Open';
            } else if (text.includes('closed')) {
              status = 'Closed';
            }
          }
        }
        
        let date = 'Unknown';
        if (timeElement) {
          date = timeElement.getAttribute('datetime') || timeElement.getAttribute('title') || timeElement.textContent.trim();
          if (date.includes('T')) {
            date = date.split('T')[0];
          }
        }
        
        const issue = {
          id: id,
          status: status,
          title: titleElement.textContent.trim(),
          author: authorElement ? authorElement.textContent.trim() : 'Unknown',
          date: date
        };
        
        console.log('Adding issue:', issue);
        issues.push(issue);
      }
    });
    
    debugInfo.foundIssues = issues.length;
    debugInfo.seenIds = Array.from(seenIds);
  }
  
  console.log('Returning issues:', issues.length);
  console.log('Debug info:', debugInfo);
  
  return {issues, debugInfo};
}

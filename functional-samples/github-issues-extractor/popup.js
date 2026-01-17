document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page';
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      const issues = results[0].result;
      const tbody = document.querySelector('#issuesTable tbody');
      
      // Show debug info
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-issues">No issues found</td></tr>';
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = issue.id;
        
        const statusCell = row.insertCell(1);
        const statusText = issue.status.toLowerCase();
        const statusClass = statusText.includes('open') ? 'status-open' : 
                          (statusText.includes('closed') ? 'status-closed' : 'status');
        statusCell.innerHTML = `<span class="status ${statusClass}">${issue.status}</span>`;
        
        const titleCell = row.insertCell(2);
        titleCell.textContent = issue.title;
        titleCell.style.fontWeight = '500';
        
        row.insertCell(3).textContent = issue.author;
        row.insertCell(4).textContent = issue.date;
      });
    });
  });
});

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Try multiple selectors to find issue elements
  const selectors = [
    'div.js-issue-row',
    'div.js-discussion-item',
    'div.issue-list-item',
    'div[id^="issue_"]',
    'article[id^="issue_"]',
    'ul.js-issue-association-list li',
    'div[data-hovercard-type="issue"]',
    'div.Box-row',
    'div.Box-row--focus-gray',
    'div.js-issue-container',
    'div[data-testid="issue-item"]',
    'li.js-issue-row'
  ];
    
    let allElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements for selector: ${selector}`);
      allElements = allElements.concat(Array.from(elements));
    });
    
    // Remove duplicates
    const uniqueElements = [...new Set(allElements)];
    console.log('Total unique elements:', uniqueElements.length);
    
    // If no elements found with selectors, try a different approach
    if (uniqueElements.length === 0) {
      console.log('No elements found with selectors, trying direct API approach');
      // Try to find issues using GitHub's API data
      const scriptTags = document.querySelectorAll('script[type="application/json"]');
      console.log('Found', scriptTags.length, 'JSON script tags');
      
      scriptTags.forEach(script => {
        try {
          const jsonData = JSON.parse(script.textContent);
          if (jsonData && jsonData.issues) {
            console.log('Found issues data in JSON');
            jsonData.issues.forEach(issue => {
              issues.push({
                id: '#' + issue.number,
                status: issue.state,
                title: issue.title,
                author: issue.user.login,
                date: issue.created_at.split('T')[0]
              });
            });
          } else if (jsonData && jsonData.payload && jsonData.payload.issues) {
            console.log('Found issues data in payload');
            jsonData.payload.issues.forEach(issue => {
              issues.push({
                id: '#' + issue.number,
                status: issue.state,
                title: issue.title,
                author: issue.user.login,
                date: issue.created_at.split('T')[0]
              });
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    }
    
    uniqueElements.forEach(element => {
      // Try multiple ways to find each element
      const titleElement = 
        element.querySelector('a.js-issue-title') || 
        element.querySelector('a[data-hovercard-type="issue"]') ||
        element.querySelector('a.issue-title') ||
        element.querySelector('a.Link--primary') ||
        element.querySelector('h1 a') ||
        element.querySelector('h2 a');
        
      const idElement = 
        element.querySelector('span.js-issue-number') ||
        element.querySelector('span.issue-number') ||
        element.querySelector('a[href*="/issues/"]') ||
        element.querySelector('div[data-issue-number]');
        
      const statusElement = 
        element.querySelector('span.State') ||
        element.querySelector('span.label') ||
        element.querySelector('span[data-state]') ||
        element.querySelector('span.mr-1') ||
        element.querySelector('span[data-testid="status"]');
        
      const authorElement = 
        element.querySelector('a.author') ||
        element.querySelector('a[data-hovercard-type="user"]') ||
        element.querySelector('span.author a') ||
        element.querySelector('a.Link--muted') ||
        element.querySelector('div[data-hovercard-type="user"] a');
        
      const timeElement = 
        element.querySelector('time') ||
        element.querySelector('relative-time') ||
        element.querySelector('time-ago');
      
      console.log('Element check:', {title: !!titleElement, id: !!idElement, status: !!statusElement, author: !!authorElement, time: !!timeElement});
      
      if (titleElement && idElement) {
        let id = idElement.textContent ? idElement.textContent.trim() : '';
        if (!id && idElement.href) {
          id = idElement.href.match(/\d+/)[0];
        } else if (!id && idElement.getAttribute) {
          id = idElement.getAttribute('data-issue-number') || idElement.getAttribute('issue-number');
        }
        
        issues.push({
          id: id,
          status: statusElement ? statusElement.textContent.trim() : 'Unknown',
          title: titleElement.textContent.trim(),
          author: authorElement ? authorElement.textContent.trim() : 'Unknown',
          date: timeElement ? (timeElement.getAttribute('datetime') || timeElement.getAttribute('title')).split('T')[0] : 'Unknown'
        });
      }
    });
  
  console.log('Found', issues.length, 'issues using DOM approach');
  
  // Try to find issues using API if DOM approach fails
  if (issues.length === 0) {
    console.log('Trying to find issues using API approach');
    // This is a fallback approach that uses the GitHub API
    // It will only work if the page has a data-repository-url attribute
    const repoUrl = document.querySelector('[data-repository-url]')?.getAttribute('data-repository-url');
    if (repoUrl) {
      console.log('Found repository URL:', repoUrl);
    }
  }
  
  console.log('Returning issues:', issues.length);
  return issues;
}

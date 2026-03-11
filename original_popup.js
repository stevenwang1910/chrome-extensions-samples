document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com/GoogleChrome/chrome-extensions-samples/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to GitHub issues page';
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
});

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Try to find issues using various approaches
  
  // Approach 1: Check if page is static HTML from the saved file
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
  
  // If no issues found with regex, try DOM approach
  if (issues.length === 0) {
    // Try multiple selectors to find issue elements
    const selectors = [
      'div.js-issue-row',
      'div.js-discussion-item',
      'div.issue-list-item',
      'div[id^="issue_"]',
      'article[id^="issue_"]',
      'ul.js-issue-association-list li',
      'div[data-hovercard-type="issue"]'
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
    
    uniqueElements.forEach(element => {
      // Try multiple ways to find each element
      const titleElement = 
        element.querySelector('a.js-issue-title') || 
        element.querySelector('a[data-hovercard-type="issue"]') ||
        element.querySelector('a.issue-title') ||
        element.querySelector('a');
        
      const idElement = 
        element.querySelector('span.js-issue-number') ||
        element.querySelector('span.issue-number') ||
        element.querySelector('a[href*="/issues/"]');
        
      const statusElement = 
        element.querySelector('span.State') ||
        element.querySelector('span.label') ||
        element.querySelector('span[data-state]');
        
      const authorElement = 
        element.querySelector('a.author') ||
        element.querySelector('a[data-hovercard-type="user"]') ||
        element.querySelector('span.author a');
        
      const timeElement = 
        element.querySelector('time') ||
        element.querySelector('relative-time');
      
      console.log('Element check:', {title: !!titleElement, id: !!idElement, status: !!statusElement, author: !!authorElement, time: !!timeElement});
      
      if (titleElement && idElement) {
        let id = idElement.textContent ? idElement.textContent.trim() : '';
        if (!id && idElement.href) {
          id = idElement.href.match(/\d+/)[0];
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
  }
  
  console.log('Returning issues:', issues.length);
  return issues;
}

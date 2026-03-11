// extractIssues must be at top level for Chrome scripting to work
function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Get the current page URL for constructing issue URLs
  const pageUrl = window.location.href;
  const repoMatch = pageUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues/);
  const repoBaseUrl = repoMatch ? `https://github.com/${repoMatch[1]}/${repoMatch[2]}` : null;

  // Try to find issues using DOM approach for modern GitHub
  // Try different selectors
  const selectors = [
    '[data-testid="issue-row"]',
    '.js-issue-row',
    '.issue-row',
    'div[id^="issue_"][data-hovercard-type="issue"]'
  ];
  
  let issueRows = [];
  for (const selector of selectors) {
    const rows = document.querySelectorAll(selector);
    if (rows.length > 0) {
      issueRows = rows;
      console.log('Found rows with selector:', selector, rows.length);
      break;
    }
  }
  
  // Also check inside turbo frame
  if (issueRows.length === 0) {
    const turboFrame = document.querySelector('turbo-frame#repo-content-turbo-frame');
    if (turboFrame) {
      for (const selector of selectors) {
        const rows = turboFrame.querySelectorAll(selector);
        if (rows.length > 0) {
          issueRows = rows;
          console.log('Found rows inside turbo frame with selector:', selector, rows.length);
          break;
        }
      }
    }
  }
  
  console.log('Total issue rows found:', issueRows.length);
  
  issueRows.forEach(row => {
    try {
      const link = row.querySelector('a[href*="/issues/"]');
      if (link) {
        const href = link.getAttribute('href') || '';
        const issueMatch = href.match(/\/issues\/(\d+)/);
        if (issueMatch) {
          const title = link.textContent.trim() || '';
          const id = '#' + issueMatch[1];
          
          const statusIcon = row.querySelector('[aria-label*="Open"], [aria-label*="Closed"], .octicon-issue-opened, .octicon-issue-closed');
          let status = 'Unknown';
          if (statusIcon) {
            const ariaLabel = statusIcon.getAttribute('aria-label') || '';
            const className = statusIcon.className || '';
            if (ariaLabel.includes('Open') || className.includes('opened')) status = 'OPEN';
            if (ariaLabel.includes('Closed') || className.includes('closed')) status = 'CLOSED';
          }
          
          const authorLink = row.querySelector('a[href^="/"][data-hovercard-type="user"]');
          let author = 'Unknown';
          if (authorLink) {
            const hrefAttr = authorLink.getAttribute('href') || '';
            author = hrefAttr.substring(1);
          }
          
          const time = row.querySelector('relative-time, time');
          let date = 'Unknown';
          if (time) {
            const datetime = time.getAttribute('datetime') || time.getAttribute('title');
            if (datetime) date = datetime.split('T')[0];
          }
          
          const url = `https://github.com${href}`;
          
          issues.push({ id, status, title, author, date, url });
        }
      }
    } catch (e) {
      console.log('Error parsing row:', e);
    }
  });
  
  // Fallback: Try to extract from embedded JSON data
  if (issues.length === 0) {
    try {
      const allScripts = document.querySelectorAll('script[type="application/json"]');
      for (const script of allScripts) {
        try {
          const text = script.textContent;
          if (text.includes('Issue') && text.includes('nodes')) {
            const jsonData = JSON.parse(text);
            if (jsonData.payload && jsonData.payload.preloadedQueries) {
              for (const query of jsonData.payload.preloadedQueries) {
                if (query.result && query.result.data) {
                  const repo = query.result.data.repository;
                  if (repo) {
                    const repoUrl = repo.url;
                    const searchEdges = repo.search?.edges || [];
                    const issueNodes = repo.issues?.nodes || [];
                    
                    [...searchEdges, ...issueNodes].forEach(item => {
                      const node = item.node || item;
                      if (node && node.__typename === 'Issue') {
                        issues.push({
                          id: '#' + node.number,
                          status: node.state || 'Unknown',
                          title: node.title || 'No title',
                          author: node.author?.login || 'Unknown',
                          date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown',
                          url: node.url || (repoUrl ? repoUrl + '/issues/' + node.number : null)
                        });
                      }
                    });
                  }
                }
              }
            }
          }
        } catch (e) {
          console.log('Error parsing script data:', e.message);
        }
      }
    } catch (e) {
      console.error('Error in JSON extraction:', e);
    }
  }
  
  // Remove duplicates
  const uniqueIssues = [];
  const seen = new Set();
  for (const issue of issues) {
    if (!seen.has(issue.id)) {
      seen.add(issue.id);
      uniqueIssues.push(issue);
    }
  }
  
  console.log('Returning issues:', uniqueIssues.length);
  return uniqueIssues;
}

document.addEventListener('DOMContentLoaded', function() {
  // Toggle debug info
  const toggleDebug = document.getElementById('toggleDebug');
  const debugDiv = document.getElementById('debug');
  if (toggleDebug && debugDiv) {
    toggleDebug.addEventListener('click', function() {
      debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    });
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    
    // Fix: Support any GitHub issues page, not just hardcoded
    if (!tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to GitHub issues page';
      return;
    }

    // Fix: Use 'func' instead of 'function' and add 'world: "MAIN"'
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: extractIssues,
      world: 'MAIN'
    }, function(results) {
      // Add error handling
      if (chrome.runtime.lastError) {
        document.getElementById('loading').textContent = 'Error: ' + chrome.runtime.lastError.message;
        return;
      }
      
      if (!results || !results[0] || !results[0].result) {
        document.getElementById('loading').textContent = 'No results returned';
        return;
      }
      
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
        tbody.innerHTML = '<tr><td colspan="6">No issues found</td></tr>';
        return;
      }

      issues.forEach(issue => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = issue.id;
        row.insertCell(1).textContent = issue.status;
        row.insertCell(2).textContent = issue.title;
        row.insertCell(3).textContent = issue.author;
        row.insertCell(4).textContent = issue.date;
        // Add URL column
        const urlCell = row.insertCell(5);
        if (issue.url) {
          const link = document.createElement('a');
          link.href = issue.url;
          link.textContent = 'Link';
          link.target = '_blank';
          urlCell.appendChild(link);
        } else {
          urlCell.textContent = 'N/A';
        }
      });
    });
  });
});

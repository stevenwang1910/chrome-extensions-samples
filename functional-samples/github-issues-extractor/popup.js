document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    const urlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/issues/;
    if (!urlPattern.test(tab.url)) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page (e.g., github.com/owner/repo/issues)';
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }).then(function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      let issues = [];
      if (results && results[0] && results[0].result && Array.isArray(results[0].result)) {
        issues = results[0].result;
      } else {
        console.error('Failed to extract issues: results is null or invalid', results);
      }
      
      const tbody = document.querySelector('#issuesTable tbody');
      
      // Show debug info
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      // Show issue count
      const issueCountEl = document.getElementById('issueCount');
      issueCountEl.textContent = `Found ${issues.length} issue${issues.length !== 1 ? 's' : ''}`;
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No issues found</td></tr>';
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        
        const idCell = row.insertCell(0);
        idCell.textContent = issue.id;
        idCell.className = 'issue-id';
        
        const statusCell = row.insertCell(1);
        const statusLower = issue.status.toLowerCase();
        statusCell.textContent = issue.status;
        statusCell.className = statusLower === 'open' ? 'status-open' : statusLower === 'closed' ? 'status-closed' : '';
        
        const titleCell = row.insertCell(2);
        titleCell.textContent = issue.title;
        titleCell.className = 'issue-title';
        titleCell.title = issue.title;
        
        const authorCell = row.insertCell(3);
        authorCell.textContent = issue.author;
        authorCell.className = 'issue-author';
        
        const dateCell = row.insertCell(4);
        dateCell.textContent = issue.date;
        dateCell.className = 'issue-date';
      });
    }).catch(function(error) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      const issueCountEl = document.getElementById('issueCount');
      issueCountEl.textContent = 'Error: ' + error.message;
      const tbody = document.querySelector('#issuesTable tbody');
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Script execution failed: ${error.message}</td></tr>`;
      console.error('Script execution error:', error);
    });
  });
});

function extractIssues() {
  console.log('extractIssues called');
  let issues = [];
  
  const scriptTag = document.querySelector('script[type="application/json"][data-target="react-partial.embeddedData"]') || 
                      document.querySelector('script[type="application/json"][data-target="react-app.embeddedData"]');
  if (scriptTag) {
    try {
      const jsonData = JSON.parse(scriptTag.textContent);
      console.log('Found embedded JSON data');
      
      if (jsonData.payload && jsonData.payload.preloadedQueries) {
        const queries = Array.isArray(jsonData.payload.preloadedQueries) 
          ? jsonData.payload.preloadedQueries 
          : Object.values(jsonData.payload.preloadedQueries);
        
        for (const query of queries) {
          if (query.result && query.result.data) {
            const data = query.result.data;
            
            if (data.repository && data.repository.issues && data.repository.issues.edges) {
              const edges = data.repository.issues.edges;
              console.log('Found', edges.length, 'issues in GraphQL data');
              
              edges.forEach(edge => {
                const node = edge.node;
                if (node) {
                  issues.push({
                    id: '#' + node.number,
                    status: node.state || 'Unknown',
                    title: node.title || 'No title',
                    author: node.author ? node.author.login : 'Unknown',
                    date: node.createdAt ? node.createdAt.split('T')[0] : 'Unknown'
                  });
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing JSON data:', e);
    }
  }
  
  if (issues.length === 0) {
    console.log('No issues found in embedded data, trying DOM fallback');
    issues = extractIssuesFromDOM();
  }
  
  console.log('Returning', issues.length, 'issues');
  return issues;
}

function extractIssuesFromDOM() {
  const issues = [];
  
  const selectors = [
    'div[data-testid="results-list"] > div',
    'div[aria-label="Issues"] > div',
    '.Box--responsive .Box-row',
    '.js-navigation-container > .js-navigation-item',
    'div[data-list-item-type="issue"]',
    '.issues-listing .Box-row'
  ];
  
  for (const selector of selectors) {
    const rows = document.querySelectorAll(selector);
    console.log('Selector:', selector, '- Found:', rows.length, 'rows');
    
    if (rows.length > 0) {
      for (const row of rows) {
        const issue = parseIssueRow(row);
        if (issue && issue.title) {
          issues.push(issue);
        }
      }
      
      if (issues.length > 0) {
        break;
      }
    }
  }
  
  if (issues.length === 0) {
    const issueLinks = document.querySelectorAll('a[href*="/issues/"][data-hovercard-type="issue"]');
    console.log('Found', issueLinks.length, 'issue links');
    
    const seen = new Set();
    issueLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (seen.has(href)) return;
      seen.add(href);
      
      const numberMatch = href.match(/\/issues\/(\d+)/);
      if (numberMatch) {
        const title = link.textContent.trim();
        if (title) {
          issues.push({
            id: '#' + numberMatch[1],
            status: 'Unknown',
            title: title,
            author: 'Unknown',
            date: 'Unknown'
          });
        }
      }
    });
  }
  
  return issues;
}

function parseIssueRow(row) {
  let title = '';
  let id = '';
  let status = 'Unknown';
  let author = 'Unknown';
  let date = 'Unknown';
  
  const titleLink = row.querySelector('a[data-hovercard-type="issue"], a[href*="/issues/"]');
  if (titleLink) {
    title = titleLink.textContent.trim();
    const href = titleLink.getAttribute('href') || '';
    const numberMatch = href.match(/\/issues\/(\d+)/);
    id = numberMatch ? '#' + numberMatch[1] : '';
  }
  
  const statusIcons = row.querySelectorAll('svg');
  for (const icon of statusIcons) {
    const ariaLabel = icon.getAttribute('aria-label') || '';
    const className = icon.className || '';
    if (ariaLabel.includes('Open') || ariaLabel.includes('open') || className.includes('open')) {
      status = 'OPEN';
      break;
    } else if (ariaLabel.includes('Closed') || ariaLabel.includes('closed') || className.includes('closed')) {
      status = 'CLOSED';
      break;
    }
  }
  
  const statusSpan = row.querySelector('.State, .Label');
  if (statusSpan) {
    const statusText = statusSpan.textContent.trim().toLowerCase();
    if (statusText.includes('open')) status = 'OPEN';
    else if (statusText.includes('closed')) status = 'CLOSED';
  }
  
  const authorLink = row.querySelector('a[data-hovercard-type="user"], a[class*="author"]');
  if (authorLink) {
    author = authorLink.textContent.trim();
  } else {
    const authorMatch = row.textContent.match(/opened by (\S+)/i);
    if (authorMatch) {
      author = authorMatch[1];
    }
  }
  
  const timeElement = row.querySelector('relative-time, time, [datetime]');
  if (timeElement) {
    const datetime = timeElement.getAttribute('datetime') || timeElement.getAttribute('title') || '';
    date = datetime.split('T')[0] || timeElement.textContent.trim();
  }
  
  if (!title) {
    const textContent = row.textContent.trim();
    const titleMatch = textContent.match(/#\d+\s+(.+?)(?:\s+opened|\s+by|$)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }
  
  return title ? { id, status, title, author, date } : null;
}

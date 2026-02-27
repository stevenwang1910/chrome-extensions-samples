document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com')) {
      document.getElementById('loading').style.display = 'none';
      showError('Please navigate to a GitHub issues page');
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      if (chrome.runtime.lastError) {
        showError('Script execution error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (!results || !results[0]) {
        showError('No results returned from page');
        return;
      }
      
      const issues = results[0].result || [];
      const tbody = document.querySelector('#issuesTable tbody');
      
      // Update issue count in header
      const issueCountEl = document.getElementById('issueCount');
      if (issues.length === 0) {
        issueCountEl.textContent = 'No issues found';
      } else {
        issueCountEl.textContent = `${issues.length} issue${issues.length > 1 ? 's' : ''} found`;
      }
      
      // Show debug info
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="empty-state">
              <div class="empty-state-icon">📭</div>
              <div>No issues found on this page</div>
              <div style="font-size: 12px; margin-top: 8px; color: #8c959f;">
                Make sure you are on a GitHub issues page with issues loaded
              </div>
            </td>
          </tr>
        `;
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        
        // ID cell
        const idCell = row.insertCell(0);
        idCell.innerHTML = `<span class="issue-id">${escapeHtml(issue.id)}</span>`;
        
        // Status cell with styled badge
        const statusCell = row.insertCell(1);
        const statusClass = getStatusClass(issue.status);
        const statusDot = getStatusDot(issue.status);
        statusCell.innerHTML = `
          <span class="issue-status ${statusClass}">
            <span class="status-dot ${statusDot}"></span>
            ${escapeHtml(issue.status)}
          </span>
        `;
        
        // Title cell
        const titleCell = row.insertCell(2);
        titleCell.innerHTML = `<span class="issue-title" title="${escapeHtml(issue.title)}">${escapeHtml(issue.title)}</span>`;
        
        // Author cell
        const authorCell = row.insertCell(3);
        authorCell.innerHTML = `<span class="issue-author">${escapeHtml(issue.author)}</span>`;
        
        // Date cell
        const dateCell = row.insertCell(4);
        dateCell.innerHTML = `<span class="issue-date">${escapeHtml(issue.date)}</span>`;
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

function getStatusClass(status) {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'open') return 'status-open';
  if (statusLower === 'closed') return 'status-closed';
  if (statusLower === 'merged') return 'status-merged';
  return 'status-unknown';
}

function getStatusDot(status) {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'open') return 'dot-open';
  if (statusLower === 'closed') return 'dot-closed';
  if (statusLower === 'merged') return 'dot-merged';
  return 'dot-unknown';
}

function showError(message) {
  const tbody = document.querySelector('#issuesTable tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="error-state">
        <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
        <div>${escapeHtml(message)}</div>
      </td>
    </tr>
  `;
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
  document.getElementById('issueCount').textContent = 'Error';
}

function extractIssues() {
  console.log('extractIssues called on:', window.location.href);
  const issues = [];
  const processedIds = new Set();
  
  // Strategy 0: Try to get data from GitHub's embedded data or API responses stored in the page
  // Check for __APOLLO_STATE__ or similar data stores
  if (window.__APOLLO_STATE__ || window.__DATA__ || window._reactListening) {
    console.log('Found React/Apollo data in window object');
  }
  
  // Strategy 1: Find all issue rows using modern GitHub selectors
  // Try multiple selectors to find issue rows
  const issueSelectors = [
    '[data-testid="issue-row"]',
    '[data-testid*="issue-item"]',
    '[data-testid*="issue-row"]',
    '.Box-row',
    '[role="row"]',
    'div[id^="issue_"]',
    'article[id^="issue_"]',
    'li[id^="issue_"]',
    '.js-issue-row',
    '.js-navigation-item'
  ];
  
  let issueRows = [];
  for (const selector of issueSelectors) {
    const rows = document.querySelectorAll(selector);
    if (rows.length > 0) {
      console.log('Found', rows.length, 'rows with selector:', selector);
      issueRows = Array.from(rows);
      break;
    }
  }
  
  // If no rows found with specific selectors, try broader approach
  if (issueRows.length === 0) {
    // Look for elements that contain issue links and have a container structure
    const allElements = document.querySelectorAll('div, li, tr, article');
    for (const el of allElements) {
      const issueLink = el.querySelector('a[href*="/issues/"]');
      if (issueLink && el.querySelector('svg')) {
        // This might be an issue row (has issue link and svg icon)
        issueRows.push(el);
      }
    }
    console.log('Found', issueRows.length, 'potential issue rows by scanning');
  }
  
  // Process found rows
  if (issueRows.length > 0) {
    issueRows.forEach(row => {
      // Get issue ID from various sources
      let issueId = '';
      let issueNumber = '';
      
      // Try to get from id attribute
      const idAttr = row.id || row.getAttribute('data-issue-id') || '';
      const idMatch = idAttr.match(/(\d+)/);
      if (idMatch) {
        issueNumber = idMatch[1];
        issueId = '#' + issueNumber;
      }
      
      // Try to get from issue link
      if (!issueId) {
        const link = row.querySelector('a[href*="/issues/"]');
        if (link) {
          const href = link.getAttribute('href') || '';
          const match = href.match(/\/issues\/(\d+)$/);
          if (match) {
            issueNumber = match[1];
            issueId = '#' + issueNumber;
          }
        }
      }
      
      if (issueId && !processedIds.has(issueId)) {
        processedIds.add(issueId);
        const link = row.querySelector('a[href*="/issues/"]') || row.querySelector('a');
        const issueData = extractIssueData(row, link, issueId, issueNumber);
        if (issueData) {
          issues.push(issueData);
        }
      }
    });
  }
  
  // Strategy 2: If still no issues, scan all issue links
  if (issues.length === 0) {
    const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
    console.log('Fallback: Found', issueLinks.length, 'issue links');
    
    issueLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/issues\/(\d+)$/);
      
      if (match) {
        const issueId = '#' + match[1];
        if (processedIds.has(issueId)) return;
        processedIds.add(issueId);
        
        // Find the closest container
        let container = link.closest('[data-testid*="issue"]') ||
                       link.closest('.Box-row') ||
                       link.closest('[role="row"]') ||
                       link.closest('div[id^="issue_"]') ||
                       link.closest('article') ||
                       link.closest('li') ||
                       link.closest('tr') ||
                       link.parentElement?.parentElement?.parentElement ||
                       link.parentElement?.parentElement;
        
        const issueData = extractIssueData(container, link, issueId, match[1]);
        if (issueData) {
          issues.push(issueData);
        }
      }
    });
  }
  
  console.log('Returning', issues.length, 'issues:', issues);
  return issues;
}

function extractIssueData(container, link, issueId, issueNumber) {
  if (!link) return null;
  
  // Use document body as fallback container
  if (!container) {
    container = document.body;
  }
  
  let title = link.textContent.trim();
  let status = 'Open';
  let author = '';
  let date = '';
  
  // Extract status - look for SVG icons
  // GitHub uses specific SVG icons for issue states
  const allSvgs = container.querySelectorAll('svg');
  for (const svg of allSvgs) {
    const ariaLabel = svg.getAttribute('aria-label') || '';
    const svgClass = svg.getAttribute('class') || '';
    
    // Check for open issue icon (green circle)
    if (ariaLabel.toLowerCase().includes('open') || 
        svgClass.includes('octicon-issue-opened') ||
        svgClass.includes('issue-opened')) {
      status = 'Open';
      break;
    }
    // Check for closed issue icon (purple square/check)
    else if (ariaLabel.toLowerCase().includes('close') || 
             svgClass.includes('octicon-issue-closed') ||
             svgClass.includes('issue-closed')) {
      status = 'Closed';
      break;
    }
  }
  
  // Check for status labels/text
  const statusLabels = container.querySelectorAll('.State, [class*="State--"], [data-testid*="state"]');
  for (const label of statusLabels) {
    const text = label.textContent.trim().toLowerCase();
    if (text === 'open') {
      status = 'Open';
      break;
    } else if (text === 'closed') {
      status = 'Closed';
      break;
    }
  }
  
  // Extract author - multiple strategies
  // Strategy 1: Look for links with data-hovercard-type="user"
  const userLinks = container.querySelectorAll('a[data-hovercard-type="user"], a[data-hovercard-type="mention"]');
  for (const userLink of userLinks) {
    const text = userLink.textContent.trim();
    if (text && text.length > 0 && text.length < 50 && text !== title) {
      author = text;
      break;
    }
  }
  
  // Strategy 2: Look for author links by href pattern
  if (!author) {
    const allLinks = container.querySelectorAll('a');
    for (const a of allLinks) {
      const href = a.getAttribute('href') || '';
      
      // Skip issue links and non-user links
      if (href.includes('/issues/') || href.startsWith('#') || href.includes('/')) {
        // Check if it's a simple user profile link: /username
        const userMatch = href.match(/^\/[a-zA-Z0-9_-]+$/);
        if (!userMatch) continue;
      }
      
      const text = a.textContent.trim();
      // Skip if it's the issue title or too long/short
      if (text && text.length > 0 && text.length < 50 && text !== title && !text.includes(' ')) {
        author = text;
        break;
      }
    }
  }
  
  // Strategy 3: Try to extract from text content patterns
  if (!author) {
    const text = container.textContent;
    // Match patterns like "opened by username" or "username opened"
    const patterns = [
      /opened\s+(?:by\s+)?([a-zA-Z0-9_-]{2,50})/i,
      /by\s+([a-zA-Z0-9_-]{2,50})\s+(?:on|opened)/i,
      /#\d+\s+.+?by\s+([a-zA-Z0-9_-]{2,50})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].length > 1) {
        // Filter out common false positives
        if (!['the', 'and', 'for', 'this', 'that', 'with'].includes(match[1].toLowerCase())) {
          author = match[1];
          break;
        }
      }
    }
  }
  
  // Extract date - look for time elements
  const timeElements = container.querySelectorAll('time, relative-time');
  for (const time of timeElements) {
    const datetime = time.getAttribute('datetime');
    const title = time.getAttribute('title');
    const text = time.textContent.trim();
    
    if (datetime) {
      // Format: 2024-01-15T10:30:00Z
      date = datetime.split('T')[0];
      break;
    } else if (title) {
      date = title;
      break;
    } else if (text && (text.includes('20') || text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i))) {
      date = text;
      break;
    }
  }
  
  // If no time element found, try to extract from text patterns
  if (!date) {
    const text = container.textContent;
    const datePatterns = [
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i,
      /\d{4}-\d{2}-\d{2}/,
      /opened\s+(?:by\s+.+?\s+)?on\s+(.{10,30}?)(?:\s|$)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        date = match[0].replace(/^on\s+/i, '');
        break;
      }
    }
  }
  
  // Clean up title if needed
  if (!title || title === issueId) {
    title = 'Issue ' + issueId;
  }
  
  return {
    id: issueId,
    status: status,
    title: title,
    author: author || 'Unknown',
    date: date || 'Unknown'
  };
}

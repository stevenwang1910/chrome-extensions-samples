document.addEventListener('DOMContentLoaded', fetchIssues);
document.getElementById('refreshBtn').addEventListener('click', fetchIssues);

function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.getElementById('tableContainer').style.display = 'none';
}

function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
  document.getElementById('error').textContent = message;
  document.getElementById('tableContainer').style.display = 'none';
}

function showTable() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  document.getElementById('tableContainer').style.display = 'block';
}

function fetchIssues() {
  showLoading();
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = activeTab.url;
    
    if (!url.includes('github.com') || !url.includes('issues')) {
      showError('Please navigate to a GitHub issues page.\ne.g. https://github.com/GoogleChrome/chrome-extensions-samples/issues');
      return;
    }
    
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        func: extractIssuesDirectly
      },
      (results) => {
        if (chrome.runtime.lastError) {
          showError('Error: ' + chrome.runtime.lastError.message);
          return;
        }
        
        if (!results || !results[0] || !results[0].result) {
          showError('No results returned.');
          return;
        }
        
        const issues = results[0].result;
        
        if (issues.length === 0) {
          showError('No issues found on page.\n\nTry refreshing the page first.');
          return;
        }
        
        displayIssues(issues);
      }
    );
  });
}

function extractIssuesDirectly() {
  function cleanText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }
  
  const issues = [];
  
  let rows = document.querySelectorAll('.Box-row');
  console.log('Box-row count:', rows.length);
  
  if (rows.length === 0) {
    rows = document.querySelectorAll('[data-testid="results-list"] > div > div');
    console.log('results-list count:', rows.length);
  }
  
  if (rows.length === 0) {
    const container = document.querySelector('.application-main');
    if (container) {
      rows = container.querySelectorAll('div[class*="Box-"][class*="-row"], div[class^="Box"] > div:not([class])');
      console.log('generic rows count:', rows.length);
    }
  }
  
  if (rows.length === 0) {
    rows = document.querySelectorAll('div:not([class]) div:not([class]) > div[style*="display: flex"]');
    console.log('flex rows count:', rows.length);
  }
  
  if (rows.length === 0) {
    rows = document.querySelectorAll('[data-testid="issue-row"]');
    console.log('issue-row count:', rows.length);
  }
  
  if (rows.length === 0) {
    const allDivs = document.querySelectorAll('div');
    for (let i = 0; i < Math.min(100, allDivs.length); i++) {
      const div = allDivs[i];
      const text = div.textContent || '';
      if (text.includes('Status:') && text.match(/#\d+/)) {
        rows = [div];
        break;
      }
    }
  }
  
  rows.forEach((row, index) => {
    try {
      const issue = {};
      const rowText = cleanText(row.textContent);
      
      const idMatch = rowText.match(/#(\d+)/);
      if (idMatch) {
        issue.id = idMatch[1];
      }
      
      const statusMatch = rowText.match(/Status:\s*(\w+)/i);
      if (statusMatch) {
        issue.status = statusMatch[1].replace(/\.$/, '');
      }
      
      const authorMatch = rowText.match(/·\s*([\w-]+)\s+opened\s+on\s+(.+?)(?:\s*\d{4})/i);
      if (authorMatch) {
        issue.author = authorMatch[1];
      }
      
      const dateMatch = rowText.match(/opened\s+on\s+((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).+?\d{4})/i);
      if (dateMatch) {
        issue.date = dateMatch[1];
      }
      
      const titleMatch = rowText.match(/#\d+\s+In\s+[^;]+;\s*(.+?)(?:\s*Status:|$)/is);
      if (titleMatch) {
        issue.title = cleanText(titleMatch[1]);
      }
      
      const hrefMatch = row.innerHTML.match(/href="([^"]*\/issues\/\d+)"/i);
      if (hrefMatch) {
        const hrefParts = hrefMatch[1].split('/');
        issue.id = hrefParts[hrefParts.length - 1];
      }
      
      const openIcon = row.querySelector('.octicon-issue-opened, [aria-label="Open"]');
      const closedIcon = row.querySelector('.octicon-issue-closed, [aria-label="Closed"]');
      if (!issue.status) {
        if (openIcon) issue.status = 'Open';
        else if (closedIcon) issue.status = 'Closed';
      }
      
      const authorLink = row.querySelector('a[href*="/"][data-hovercard-type="user"], a[data-octo-click*="hovercard"]');
      if (authorLink && !issue.author) {
        issue.author = cleanText(authorLink.textContent);
      }
      
      const timeEl = row.querySelector('relative-time, time[datetime]');
      if (timeEl && !issue.date) {
        const datetime = timeEl.getAttribute('datetime');
        if (datetime) {
          issue.date = new Date(datetime).toLocaleDateString();
        }
      }
      
      const issueLink = row.querySelector('a[href*="/issues/"]');
      if (issueLink && !issue.title) {
        issue.title = cleanText(issueLink.textContent);
      }
      
      if (!issue.status) issue.status = 'Open';
      if (!issue.author) issue.author = 'Unknown';
      if (!issue.date) issue.date = '';
      if (!issue.title) issue.title = 'Issue #' + issue.id;
      
      if (issue.id) {
        issues.push(issue);
      }
    } catch (e) {
      console.log('Error parsing row', index, ':', e);
    }
  });
  
  return issues;
}

function displayIssues(issues) {
  const tbody = document.getElementById('issueTableBody');
  tbody.innerHTML = '';
  
  issues.forEach(issue => {
    const row = document.createElement('tr');
    
    const idCell = document.createElement('td');
    idCell.className = 'issue-id';
    idCell.textContent = '#' + issue.id;
    row.appendChild(idCell);
    
    const titleCell = document.createElement('td');
    titleCell.className = 'issue-title';
    titleCell.textContent = issue.title;
    titleCell.title = issue.title;
    row.appendChild(titleCell);
    
    const authorCell = document.createElement('td');
    authorCell.textContent = issue.author;
    row.appendChild(authorCell);
    
    const dateCell = document.createElement('td');
    dateCell.textContent = issue.date;
    row.appendChild(dateCell);
    
    const statusCell = document.createElement('td');
    statusCell.className = issue.status.toLowerCase().includes('open') ? 'status-open' : 'status-closed';
    statusCell.textContent = issue.status;
    row.appendChild(statusCell);
    
    tbody.appendChild(row);
  });
  
  showTable();
}
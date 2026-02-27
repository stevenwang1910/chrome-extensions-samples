function extractIssues() {
  const issues = [];
  
  console.log('Starting to extract issues...');
  
  let issueRows = document.querySelectorAll('.js-navigation-container .Box-row');
  console.log('Found rows with .Box-row selector:', issueRows.length);
  
  if (issueRows.length === 0) {
    issueRows = document.querySelectorAll('[data-testid="results-list"] > div');
    console.log('Found rows with results-list selector:', issueRows.length);
  }
  
  if (issueRows.length === 0) {
    issueRows = document.querySelectorAll('div[role="row"]');
    console.log('Found rows with div role=row selector:', issueRows.length);
  }
  
  if (issueRows.length === 0) {
    issueRows = document.querySelectorAll('.application-main .Box > div');
    console.log('Found rows with Box > div selector:', issueRows.length);
  }
  
  issueRows.forEach((row, index) => {
    try {
      const issue = {};
      
      const links = row.querySelectorAll('a');
      let issueLink = null;
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.includes('/issues/')) {
          issueLink = link;
          break;
        }
      }
      
      if (!issueLink) {
        const textContent = row.textContent || '';
        const idMatch = textContent.match(/#(\d+)/);
        if (idMatch) {
          issue.id = idMatch[1];
        }
        
        const statusMatch = textContent.match(/Status:\s*(\w+)/i);
        if (statusMatch) {
          issue.status = statusMatch[1];
        }
        
        const authorMatch = textContent.match(/·\s*(\w+)\s+opened\s+on\s+([\w\s,]+)/i);
        if (authorMatch) {
          issue.author = authorMatch[1];
          issue.date = authorMatch[2];
        }
        
        const titleMatch = textContent.match(/#\d+\s+In\s+[^;]+;\s*(.+?)Status:/is);
        if (titleMatch) {
          issue.title = titleMatch[1].trim();
        } else if (issue.id) {
          issue.title = 'Issue #' + issue.id;
        }
        
        if (issue.id) {
          console.log('Parsed from text:', issue);
          issues.push(issue);
        }
        return;
      }
      
      const href = issueLink.getAttribute('href');
      const idMatch = href.match(/\/issues\/(\d+)/);
      if (idMatch) {
        issue.id = idMatch[1];
      }
      issue.title = issueLink.textContent.trim();
      
      const stateLabels = row.querySelectorAll('.State, [data-view-component="true"] .octicon');
      for (const el of stateLabels) {
        if (el.classList && el.classList.contains('State')) {
          issue.status = el.textContent.trim();
          break;
        }
        const parent = el.closest('.flex-self-start, .mr-2, .flex-shrink-0');
        if (parent && parent.textContent) {
          issue.status = parent.textContent.trim();
          break;
        }
      }
      
      if (!issue.status) {
        const openIcon = row.querySelector('.octicon-issue-opened');
        const closedIcon = row.querySelector('.octicon-issue-closed');
        if (openIcon) issue.status = 'Open';
        else if (closedIcon) issue.status = 'Closed';
      }
      
      const userLinks = row.querySelectorAll('a[data-hovercard-type="user"], a[data-octo-click="hovercard-link-click"]');
      for (const link of userLinks) {
        const parent = link.parentElement;
        if (parent && parent.textContent && parent.textContent.includes('opened')) {
          issue.author = link.textContent.trim();
          break;
        }
      }
      
      if (!issue.author) {
        const text = row.textContent;
        const byMatch = text.match(/opened\s+by\s+@?([\w-]+)/i);
        if (byMatch) {
          issue.author = byMatch[1];
        }
      }
      
      const timeEl = row.querySelector('relative-time, time, [datetime]');
      if (timeEl) {
        const datetime = timeEl.getAttribute('datetime');
        if (datetime) {
          const date = new Date(datetime);
          const options = { year: 'numeric', month: 'short', day: 'numeric' };
          issue.date = date.toLocaleDateString('en-US', options);
        } else {
          issue.date = timeEl.textContent || timeEl.getAttribute('title') || '';
        }
      }
      
      if (!issue.date) {
        const text = row.textContent;
        const dateMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+),?\s*(\d{4})/i);
        if (dateMatch) {
          issue.date = dateMatch[0];
        }
      }
      
      if (!issue.status) issue.status = 'Open';
      if (!issue.author) issue.author = 'Unknown';
      if (!issue.date) issue.date = '';
      
      if (issue.id && issue.title) {
        console.log('Row', index, 'parsed:', issue);
        issues.push(issue);
      }
    } catch (e) {
      console.log('Error parsing issue row:', index, e);
    }
  });
  
  console.log('Total issues extracted:', issues.length);
  return issues;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIssues') {
    const issues = extractIssues();
    sendResponse({ issues: issues });
  }
  return true;
});
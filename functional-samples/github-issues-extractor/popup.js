document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    
    if (!tab.url.includes('github.com')) {
      showError('Please navigate to a GitHub repository issues page');
      return;
    }
    
    const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/issues)?/);
    if (!urlMatch) {
      showError('Please navigate to a GitHub repository issues page');
      return;
    }
    
    const owner = urlMatch[1];
    const repo = urlMatch[2];
    
    if (owner === 'orgs' || owner === 'users' || owner === 'search') {
      showError('Please navigate to a specific repository issues page');
      return;
    }
    
    document.getElementById('loading').textContent = `Extracting issues from ${owner}/${repo}...`;
    
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssuesFromPage
    }, function(results) {
      if (chrome.runtime.lastError) {
        showError('Failed to extract data: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (!results || !results[0]) {
        showError('No data returned from page');
        return;
      }
      
      const result = results[0].result;
      
      if (!result) {
        showError('Could not find issues data on this page');
        return;
      }
      
      if (result.error) {
        showError(result.error);
        return;
      }
      
      displayIssues(result.issues, result.owner || owner, result.repo || repo);
    });
  });
});

function showError(message) {
  const loadingEl = document.getElementById('loading');
  loadingEl.textContent = message;
  loadingEl.style.color = '#cf222e';
  loadingEl.classList.add('error');
}

function extractIssuesFromPage() {
  try {
    const issues = [];
    let owner = '';
    let repo = '';
    
    const urlMatch = window.location.pathname.match(/\/([^\/]+)\/([^\/]+)(\/issues)?/);
    if (urlMatch) {
      owner = urlMatch[1];
      repo = urlMatch[2];
    }
    
    const reactApp = document.querySelector('react-app[app-name="issues-react"]');
    if (reactApp) {
      const embeddedData = reactApp.querySelector('script[data-target="react-app.embeddedData"]');
      if (embeddedData) {
        try {
          const data = JSON.parse(embeddedData.textContent);
          const preloadedQueries = data.payload?.preloadedQueries;
          
          if (preloadedQueries && preloadedQueries.length > 0) {
            for (const query of preloadedQueries) {
              const repository = query.result?.data?.repository;
              if (repository && repository.nameWithOwner) {
                const parts = repository.nameWithOwner.split('/');
                owner = parts[0] || owner;
                repo = parts[1] || repo;
              }
              
              const edges = repository?.search?.edges || [];
              for (const edge of edges) {
                const node = edge.node;
                if (node && node.__typename === 'Issue') {
                  issues.push({
                    id: node.number,
                    title: node.title,
                    status: node.state,
                    author: node.author?.login || 'Unknown',
                    date: node.createdAt,
                    url: `https://github.com/${owner}/${repo}/issues/${node.number}`
                  });
                }
              }
            }
          }
        } catch (e) {
          console.log('Failed to parse embeddedData:', e);
        }
      }
    }
    
    if (issues.length === 0) {
      const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
      const processedIds = new Set();
      
      issueLinks.forEach(link => {
        const href = link.getAttribute('href');
        const issueMatch = href.match(/\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
        
        if (issueMatch && !processedIds.has(issueMatch[3])) {
          const issueId = issueMatch[3];
          processedIds.add(issueId);
          
          owner = issueMatch[1];
          repo = issueMatch[2];
          
          const row = link.closest('[role="row"], [role="listitem"], tr, li, div[class*="Item"], div[class*="Row"]');
          
          let title = link.getAttribute('title') || link.textContent.trim();
          if (title.startsWith('#')) {
            title = '';
          }
          
          if (!title && row) {
            const titleEl = row.querySelector('a[data-hovercard-type="issue"], a[class*="title"], [class*="title"]');
            if (titleEl) {
              title = titleEl.textContent.trim();
            }
          }
          
          if (!title) {
            const parent = link.parentElement;
            if (parent) {
              const nextSibling = link.nextElementSibling;
              if (nextSibling && nextSibling.textContent.trim() && !nextSibling.textContent.trim().startsWith('#')) {
                title = nextSibling.textContent.trim();
              }
            }
          }
          
          let status = 'OPEN';
          if (row) {
            const statusEl = row.querySelector('[class*="closed"], [class*="CLOSED"], [aria-label*="closed"], [aria-label*="Closed"]');
            if (statusEl) {
              status = 'CLOSED';
            }
            
            const openIcon = row.querySelector('[class*="open"], [aria-label*="open"], [aria-label*="Open"]');
            if (openIcon && !statusEl) {
              status = 'OPEN';
            }
          }
          
          let author = 'Unknown';
          if (row) {
            const authorLink = row.querySelector('a[data-hovercard-type="user"], a[href*="/users/"], [class*="author"]');
            if (authorLink) {
              const href = authorLink.getAttribute('href') || '';
              const authorMatch = href.match(/\/([^\/]+)$/);
              if (authorMatch) {
                author = authorMatch[1];
              } else {
                author = authorLink.textContent.trim();
              }
            }
          }
          
          let date = '';
          if (row) {
            const timeEl = row.querySelector('time, relative-time, [datetime]');
            if (timeEl) {
              date = timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || timeEl.textContent.trim();
            }
          }
          
          if (title) {
            issues.push({
              id: parseInt(issueId),
              title: title,
              status: status,
              author: author,
              date: date,
              url: `https://github.com/${owner}/${repo}/issues/${issueId}`
            });
          }
        }
      });
    }
    
    if (issues.length === 0) {
      const allLinks = Array.from(document.querySelectorAll('a'));
      const issuePattern = /\/issues\/\d+$/;
      const processedUrls = new Set();
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && issuePattern.test(href) && !processedUrls.has(href)) {
          processedUrls.add(href);
          
          const issueMatch = href.match(/\/([^\/]+)\/([^\/]+)\/issues\/(\d+)$/);
          if (issueMatch) {
            const issueId = issueMatch[3];
            owner = issueMatch[1];
            repo = issueMatch[2];
            
            const title = link.textContent.trim() || `Issue #${issueId}`;
            
            issues.push({
              id: parseInt(issueId),
              title: title,
              status: 'OPEN',
              author: 'Unknown',
              date: '',
              url: `https://github.com${href}`
            });
          }
        }
      });
    }
    
    if (issues.length === 0) {
      return { error: 'No issues found on this page. Please make sure you are on a GitHub issues page and the page has finished loading.' };
    }
    
    const uniqueIssues = [];
    const seenIds = new Set();
    issues.forEach(issue => {
      if (!seenIds.has(issue.id)) {
        seenIds.add(issue.id);
        uniqueIssues.push(issue);
      }
    });
    
    uniqueIssues.sort((a, b) => b.id - a.id);
    
    return { issues: uniqueIssues, owner: owner, repo: repo };
  } catch (e) {
    return { error: 'Error extracting page data: ' + e.message };
  }
}

function displayIssues(issues, owner, repo) {
  document.getElementById('loading').style.display = 'none';
  
  const repoInfo = document.getElementById('repo-info');
  repoInfo.textContent = `Repository: ${owner}/${repo} | Issues found: ${issues.length}`;
  repoInfo.style.display = 'block';
  
  document.getElementById('content').style.display = 'block';
  
  const tbody = document.querySelector('#issuesTable tbody');
  tbody.innerHTML = '';
  
  issues.forEach(issue => {
    const row = tbody.insertRow();
    
    const idCell = row.insertCell(0);
    idCell.innerHTML = `<a href="${issue.url}" target="_blank">#${issue.id}</a>`;
    
    const statusCell = row.insertCell(1);
    const status = issue.status.toLowerCase();
    const statusClass = status === 'open' ? 'status-open' : 'status-closed';
    statusCell.innerHTML = `<span class="status-badge ${statusClass}">${issue.status}</span>`;
    
    const titleCell = row.insertCell(2);
    titleCell.textContent = issue.title;
    titleCell.style.maxWidth = '280px';
    titleCell.style.overflow = 'hidden';
    titleCell.style.textOverflow = 'ellipsis';
    titleCell.style.whiteSpace = 'nowrap';
    titleCell.title = issue.title;
    
    const authorCell = row.insertCell(3);
    authorCell.textContent = issue.author;
    
    const dateCell = row.insertCell(4);
    if (issue.date) {
      try {
        const date = new Date(issue.date);
        dateCell.textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) {
        dateCell.textContent = issue.date;
      }
    } else {
      dateCell.textContent = '-';
    }
  });
  
  const debugDiv = document.getElementById('debug');
  const debugLog = document.getElementById('debugLog');
  debugLog.innerHTML = `<pre>Extracted from current page DOM\nTotal issues: ${issues.length}\nSource: Dynamic extraction</pre>`;
  debugDiv.style.display = 'block';
}

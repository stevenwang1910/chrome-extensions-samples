document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    const urlMatch = tab.url.match(/github\.com\/([^/]+)\/([^/]+)\/issues/);

    if (!urlMatch) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page';
      return;
    }

    const owner = urlMatch[1];
    const repo = urlMatch[2];

    document.getElementById('loading').innerHTML = 'Loading...<br><small>Waiting for GitHub issues data to load</small>';
    
    extractIssuesFromDOM(tab.id, owner, repo);
  });
});

function extractIssuesFromDOM(tabId, owner, repo) {
  chrome.scripting.executeScript({
    target: {tabId: tabId},
    func: function(owner, repo) {
      return new Promise((resolve) => {
        function extractFromIssuesList() {
          const issues = [];
          
          const containers = [
            document.querySelectorAll('[data-testid="issue-row"]'),
            document.querySelectorAll('.js-issue-row'),
            document.querySelectorAll('.Box-row'),
            document.querySelectorAll('.list-group-item.issue-item')
          ];
          
          for (const issueRows of containers) {
            if (issueRows.length > 0) {
              issueRows.forEach(row => {
                const issue = extractFromRow(row);
                if (issue && (issue.number || issue.title)) {
                  issues.push(issue);
                }
              });
              if (issues.length > 0) return issues;
            }
          }
          
          const issueLinks = document.querySelectorAll('a[href*="/issues/"][data-hovercard-type="issue"]');
          if (issueLinks.length > 0) {
            const processed = new Set();
            issueLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (processed.has(href)) return;
              processed.add(href);
              
              const numMatch = href ? href.match(/\/issues\/(\d+)/) : null;
              if (numMatch) {
                const row = link.closest('[data-testid="issue-row"], .js-issue-row, .Box-row, .list-group-item');
                if (row) {
                  const issue = extractFromRow(row);
                  if (issue && (issue.number || issue.title)) {
                    issues.push(issue);
                  }
                }
              }
            });
          }
          
          return issues.length > 0 ? issues : null;
        }

        function extractFromRow(row) {
          const result = { number: null, title: null, state: null, author: null, createdAt: null };

          const titleLink = row.querySelector('a[href*="/issues/"][data-hovercard-type="issue"], a[data-hovercard-type="issue"]');
          if (titleLink) {
            result.title = titleLink.textContent.trim();
            const href = titleLink.getAttribute('href');
            const numMatch = href ? href.match(/\/issues\/(\d+)/) : null;
            if (numMatch) result.number = parseInt(numMatch[1], 10);
          }

          const authorAnchor = row.querySelector('a[data-hovercard-type="user"]');
          if (authorAnchor) result.author = authorAnchor.textContent.trim();

          const stateIcon = row.querySelector('[title="Open"], [title="open"], [title*="Open"], [title="Closed"], [title*="Closed"], .octicon-issue-opened, .octicon-issue-closed');
          if (stateIcon) {
            const title = stateIcon.getAttribute('title') || '';
            const className = stateIcon.className || '';
            if (title.toLowerCase().includes('open') || className.includes('opened')) {
              result.state = 'open';
            } else if (title.toLowerCase().includes('clos') || className.includes('closed')) {
              result.state = 'closed';
            }
          }

          const stateLabel = row.querySelector('span[aria-label="Open issue"], span[aria-label="Closed issue"]');
          if (stateLabel) {
            const label = stateLabel.getAttribute('aria-label') || '';
            if (label.toLowerCase().includes('open')) result.state = 'open';
            else if (label.toLowerCase().includes('clos')) result.state = 'closed';
          }

          const timeEl = row.querySelector('relative-time, time, [datetime]');
          if (timeEl) result.createdAt = timeEl.getAttribute('datetime');

          return result;
        }

        function extractFromEmbeddedData() {
          const scripts = document.querySelectorAll('script[type="application/json"]');
          
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent);
              if (data && data.payload && data.payload.preloadedQueries) {
                const query = data.payload.preloadedQueries.find(q =>
                  q.queryName === 'IssueIndexPageQuery' && 
                  q.result && 
                  q.result.data &&
                  !q.result.errors
                );
                
                if (query && query.result && query.result.data) {
                  const repoData = query.result.data.repository || query.result.data.viewer;
                  if (repoData && repoData.issues && repoData.issues.nodes) {
                    return repoData.issues.nodes.map(node => ({
                      number: node.number,
                      title: node.title,
                      state: node.state ? node.state.toLowerCase() : null,
                      author: node.author ? node.author.login : null,
                      authorName: node.author ? node.author.name : null,
                      createdAt: node.createdAt,
                      url: node.url,
                      body: node.body
                    }));
                  }
                  
                  if (repoData && repoData.search && repoData.search.edges) {
                    return repoData.search.edges.map(edge => ({
                      number: edge.node.number,
                      title: edge.node.title,
                      state: edge.node.state ? edge.node.state.toLowerCase() : null,
                      author: edge.node.author ? edge.node.author.login : null,
                      createdAt: edge.node.createdAt,
                      url: edge.node.url
                    }));
                  }
                }
              }
            } catch(e) {}
          }
          return null;
        }

        function tryDOMDirectExtraction() {
          const issues = [];
          
          const allBoxRows = document.querySelectorAll('.Box--responsive .Box-row');
          if (allBoxRows.length > 0) {
            for (const row of allBoxRows) {
              const issueLink = row.querySelector('a[data-hovercard-type="issue"]');
              if (!issueLink) continue;
              
              const href = issueLink.getAttribute('href');
              const numMatch = href ? href.match(/\/issues\/(\d+)/) : null;
              if (!numMatch) continue;
              
              const issue = {
                number: parseInt(numMatch[1], 10),
                title: issueLink.textContent.trim()
              };
              
              const stateSpan = row.querySelector('span');
              if (stateSpan) {
                const ariaLabel = stateSpan.getAttribute('aria-label') || '';
                if (ariaLabel.toLowerCase().includes('open')) issue.state = 'open';
                else if (ariaLabel.toLowerCase().includes('closed')) issue.state = 'closed';
              }
              
              const stateSvg = row.querySelector('svg.octicon');
              if (stateSvg && !issue.state) {
                if (stateSvg.classList.contains('octicon-issue-opened')) issue.state = 'open';
                else if (stateSvg.classList.contains('octicon-issue-closed')) issue.state = 'closed';
              }
              
              const authorLink = row.querySelector('a[data-hovercard-type="user"]');
              if (authorLink) issue.author = authorLink.textContent.trim();
              
              const timeEl = row.querySelector('relative-time');
              if (timeEl) issue.createdAt = timeEl.getAttribute('datetime');
              
              issues.push(issue);
            }
          }
          
          return issues.length > 0 ? issues : null;
        }

        function tryAllMethods() {
          const domResult = tryDOMDirectExtraction();
          if (domResult) return domResult;

          const embeddedIssues = extractFromEmbeddedData();
          if (embeddedIssues && embeddedIssues.length > 0) return embeddedIssues;

          const listIssues = extractFromIssuesList();
          if (listIssues && listIssues.length > 0) return listIssues;

          return null;
        }

        const maxAttempts = 20;
        let attempts = 0;
        
        function poll() {
          const result = tryAllMethods();
          if (result) {
            resolve(result);
            return;
          }
          
          attempts++;
          if (attempts >= maxAttempts) {
            resolve([]);
            return;
          }
          
          setTimeout(poll, 250);
        }
        
        poll();
      });
    },
    args: [owner, repo]
  }, (results) => {
    if (chrome.runtime.lastError) {
      document.getElementById('loading').textContent = 'Error: ' + chrome.runtime.lastError.message;
      return;
    }

    const issues = results && results[0] ? results[0].result : null;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    document.getElementById('repoInfo').textContent = `${owner}/${repo}`;

    const tbody = document.querySelector('#issuesTable tbody');

    if (!issues || issues.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No issues found. Try refreshing the page and try again.</td></tr>';
      return;
    }

    const filteredIssues = issues.filter(issue => issue.number || issue.title);

    if (filteredIssues.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No valid issues found.</td></tr>';
      return;
    }

    filteredIssues.forEach(issue => {
      const row = tbody.insertRow();
      const idCell = row.insertCell(0);
      const statusCell = row.insertCell(1);
      const titleCell = row.insertCell(2);
      const authorCell = row.insertCell(3);
      const dateCell = row.insertCell(4);

      idCell.textContent = issue.number ? '#' + issue.number : 'N/A';
      idCell.className = 'issue-id';

      statusCell.textContent = issue.state || 'unknown';
      statusCell.className = issue.state === 'open' ? 'status-open' : (issue.state === 'closed' ? 'status-closed' : '');

      titleCell.textContent = issue.title || 'No title';
      titleCell.className = 'issue-title';
      titleCell.title = issue.body || issue.title || '';
      if (issue.url) {
        titleCell.style.cursor = 'pointer';
        titleCell.onclick = () => window.open(issue.url, '_blank');
      }

      authorCell.textContent = issue.author || 'Unknown';
      authorCell.className = 'author';
      if (issue.authorName && issue.authorName !== issue.author) {
        authorCell.title = issue.authorName;
      }

      if (issue.createdAt) {
        try {
          const date = new Date(issue.createdAt);
          dateCell.textContent = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          dateCell.title = date.toLocaleString();
        } catch(e) {
          dateCell.textContent = issue.createdAt;
        }
      } else {
        dateCell.textContent = 'Unknown';
      }
      dateCell.className = 'date';
    });
  });
}

document.getElementById('extractBtn').addEventListener('click', async () => {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const tableContainerEl = document.getElementById('tableContainer');
  const tbody = document.querySelector('#issuesTable tbody');

  loadingEl.classList.remove('hidden');
  errorEl.classList.add('hidden');
  tableContainerEl.classList.add('hidden');
  tbody.innerHTML = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      throw new Error('Please navigate to a GitHub issues page first.');
    }

    const urlMatch = tab.url.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub issues URL format.');
    }

    const [, owner, repo] = urlMatch;

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=30&sort=created&direction=desc`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
    }

    const issues = await response.json();

    if (issues.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-message">No issues found in this repository.</td></tr>';
    } else {
      issues.forEach(issue => {
        const tr = document.createElement('tr');
        
        const idTd = document.createElement('td');
        idTd.className = 'id-cell';
        idTd.textContent = issue.number;
        
        const titleTd = document.createElement('td');
        titleTd.className = 'title-cell';
        titleTd.textContent = issue.title;
        titleTd.title = issue.title;
        
        const authorTd = document.createElement('td');
        authorTd.className = 'author-cell';
        authorTd.textContent = issue.user.login;
        
        const dateTd = document.createElement('td');
        dateTd.className = 'date-cell';
        const date = new Date(issue.created_at);
        dateTd.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const statusTd = document.createElement('td');
        statusTd.className = 'status-cell';
        const statusSpan = document.createElement('span');
        statusSpan.className = issue.state === 'open' ? 'status-open' : 'status-closed';
        statusSpan.textContent = issue.state.charAt(0).toUpperCase() + issue.state.slice(1);
        statusTd.appendChild(statusSpan);
        
        tr.appendChild(idTd);
        tr.appendChild(titleTd);
        tr.appendChild(authorTd);
        tr.appendChild(dateTd);
        tr.appendChild(statusTd);
        
        tbody.appendChild(tr);
      });
    }

    tableContainerEl.classList.remove('hidden');
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('hidden');
  } finally {
    loadingEl.classList.add('hidden');
  }
});

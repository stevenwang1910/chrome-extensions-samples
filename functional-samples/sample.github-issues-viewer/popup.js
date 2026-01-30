const issuesTable = document.getElementById('issuesTable');
const issuesBody = document.getElementById('issuesBody');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');

let allIssues = [];

function getStatusBadge(state) {
  const badge = document.createElement('span');
  badge.className = `status-badge status-${state.toLowerCase()}`;
  badge.textContent = state;
  return badge;
}

function renderIssues(issues) {
  issuesBody.innerHTML = '';

  if (issues.length === 0) {
    const row = issuesBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 5;
    cell.textContent = 'No issues found. Please navigate to a GitHub issues page.';
    cell.style.textAlign = 'center';
    return;
  }

  for (const issue of issues) {
    const row = issuesBody.insertRow();
    
    const idCell = row.insertCell();
    idCell.textContent = `#${issue.number}`;
    idCell.className = 'id-cell';
    
    const titleCell = row.insertCell();
    const titleLink = document.createElement('a');
    titleLink.href = issue.url || '#';
    titleLink.target = '_blank';
    titleLink.textContent = issue.title;
    titleLink.className = 'issue-title';
    titleCell.appendChild(titleLink);
    
    const authorCell = row.insertCell();
    authorCell.textContent = issue.author || '-';
    
    const dateCell = row.insertCell();
    dateCell.textContent = issue.date || '-';
    
    const statusCell = row.insertCell();
    statusCell.appendChild(getStatusBadge(issue.status));
  }
}

function filterIssues(issues, status) {
  if (status === 'all') {
    return issues;
  }
  return issues.filter(issue => issue.status.toLowerCase() === status.toLowerCase());
}

async function fetchIssuesFromPage() {
  loading.style.display = 'block';
  error.style.display = 'none';
  issuesTable.style.display = 'none';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('github.com') || !tab.url.includes('issues')) {
      throw new Error('Please navigate to a GitHub issues page first.');
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getIssues' });
    
    if (response && response.issues) {
      allIssues = response.issues;
      const filteredIssues = filterIssues(allIssues, statusFilter.value);
      renderIssues(filteredIssues);
      loading.style.display = 'none';
      issuesTable.style.display = 'table';
    } else {
      throw new Error('No issues data found on the page.');
    }
  } catch (err) {
    loading.style.display = 'none';
    error.style.display = 'block';
    error.textContent = err.message;
  }
}

statusFilter.addEventListener('change', () => {
  const filteredIssues = filterIssues(allIssues, statusFilter.value);
  renderIssues(filteredIssues);
});

refreshBtn.addEventListener('click', fetchIssuesFromPage);

fetchIssuesFromPage();
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderIssues(issues) {
  const container = document.getElementById('container');

  if (issues.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
          <path fill-rule="evenodd" d="M8 0a8 8 0 100 16 8 8 0 000-16zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
        </svg>
        <p>No issues found. Please check the console logs and refresh the GitHub page.</p>
        <p style="font-size: 12px; margin-top: 8px; color: #656d76;">Check DevTools console for debug info.</p>
      </div>
    `;
    return;
  }

  const tableRows = issues
    .map((issue) => {
      const statusLower = issue.status.toLowerCase();
      const statusClass =
        statusLower === 'open'
          ? 'status-open'
          : statusLower === 'closed'
            ? 'status-closed'
            : statusLower === 'merged'
              ? 'status-merged'
              : statusLower === 'pr'
                ? 'status-pr'
                : 'status-draft';

      return `
      <tr>
        <td><a href="${escapeHtml(issue.url)}" target="_blank" class="issue-id">#${escapeHtml(issue.id)}</a></td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(issue.status)}</span></td>
        <td class="issue-title">${escapeHtml(issue.title)}</td>
        <td><a href="https://github.com/${escapeHtml(issue.submitter)}" target="_blank" class="submitter">${escapeHtml(issue.submitter)}</a></td>
        <td class="date">${escapeHtml(issue.submissionDate)}</td>
      </tr>
    `;
    })
    .join('');

  container.innerHTML = `
    <div style="margin-bottom: 12px; font-size: 13px; color: #656d76;">
      Found ${issues.length} issue${issues.length !== 1 ? 's' : ''}
    </div>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Title</th>
          <th>Submitter</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function renderError(message) {
  const container = document.getElementById('container');
  container.innerHTML = `
    <div class="error">
      <strong>Error:</strong> ${escapeHtml(message)}
      <div style="margin-top: 10px; font-size: 12px;">
        <button onclick="location.reload()" style="margin-right: 10px; padding: 4px 8px;">Retry</button>
        <span>Refresh GitHub page and try again</span>
      </div>
    </div>
  `;
}

function showLoading(message = 'Loading issues...') {
  const container = document.getElementById('container');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    });
    console.log('Content script injected successfully');
    return true;
  } catch (e) {
    console.log('Failed to inject content script:', e);
    return false;
  }
}

async function pingContentScript(tabId, timeout = 1000) {
  try {
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, { action: 'ping' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    return response?.ready;
  } catch {
    return false;
  }
}

async function pingWithRetry(tabId, retries = 3, delay = 300) {
  for (let i = 0; i < retries; i++) {
    const isReady = await pingContentScript(tabId);
    if (isReady) return true;
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

async function getIssuesFromContentScript(tabId, timeout = 8000) {
  try {
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, { action: 'getIssues' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Extraction timeout')), timeout)
      )
    ]);
    if (response?.success) {
      return response.issues;
    }
    return [];
  } catch (e) {
    console.error('Error getting issues:', e);
    throw e;
  }
}

async function fetchIssues() {
  const refreshBtn = document.getElementById('refreshBtn');
  refreshBtn.disabled = true;
  showLoading();

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab.url || !tab.url.includes('github.com')) {
      renderError('Please navigate to a GitHub issues page first.');
      return;
    }

    if (!tab.url.includes('/issues')) {
      renderError(
        'Please navigate to the "Issues" tab of a GitHub repository.'
      );
      return;
    }

    showLoading('Checking content script...');
    let isReady = await pingWithRetry(tab.id, 3, 300);

    if (!isReady) {
      showLoading('Injecting content script...');
      await injectContentScript(tab.id);
      await new Promise((resolve) => setTimeout(resolve, 300));
      isReady = await pingWithRetry(tab.id, 5, 200);
    }

    if (!isReady) {
      throw new Error(
        'Could not initialize content script. Please refresh GitHub page and try again.'
      );
    }

    showLoading('Extracting issues...');
    const issues = await getIssuesFromContentScript(tab.id, 10000);

    if (issues && issues.length > 0) {
      renderIssues(issues);
    } else {
      renderError('No issues found. Try refreshing the GitHub page.');
    }
  } catch (error) {
    console.error('Error:', error);
    let errorMessage = error.message;
    if (errorMessage.includes('Cannot access contents of url')) {
      errorMessage =
        'Extension needs access. Refresh GitHub page and try again.';
    }
    renderError(`Failed: ${errorMessage}`);
  } finally {
    refreshBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', fetchIssues);
document.getElementById('refreshBtn').addEventListener('click', fetchIssues);

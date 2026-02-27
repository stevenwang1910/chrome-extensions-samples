// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const statusDiv = document.getElementById('status');
const issuesBody = document.getElementById('issues-body');
const refreshBtn = document.getElementById('refresh');

function renderIssues(issues) {
  issuesBody.innerHTML = '';

  if (!issues || issues.length === 0) {
    statusDiv.textContent = 'No issues found on this page.';
    return;
  }

  statusDiv.textContent = `Found ${issues.length} issues`;

  issues.forEach((issue) => {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    const idLink = document.createElement('a');
    idLink.href = issue.url;
    idLink.textContent = `#${issue.id}`;
    idLink.target = '_blank';
    idCell.appendChild(idLink);
    row.appendChild(idCell);

    const titleCell = document.createElement('td');
    titleCell.textContent = issue.title;
    titleCell.title = issue.title;
    row.appendChild(titleCell);

    const authorCell = document.createElement('td');
    authorCell.textContent = issue.author;
    row.appendChild(authorCell);

    const dateCell = document.createElement('td');
    dateCell.textContent = issue.dateDisplay;
    dateCell.title = issue.date;
    row.appendChild(dateCell);

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge status-${issue.status.toLowerCase()}`;
    statusBadge.textContent = issue.status;
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    issuesBody.appendChild(row);
  });
}

async function extractIssuesFromCurrentTab() {
  statusDiv.textContent = 'Loading...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      statusDiv.textContent = 'No active tab found.';
      return;
    }

    statusDiv.textContent = `Tab URL: ${tab.url?.substring(0, 50)}...`;

    if (!tab.url?.includes('github.com')) {
      statusDiv.textContent = 'Please navigate to a GitHub Issues page.';
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const debug = {};
        const issues = [];

        debug.url = window.location.href;
        debug.title = document.title;

        const allLinks = document.querySelectorAll('a[href*="/issues/"]');
        debug.linksFound = allLinks.length;

        allLinks.forEach((link) => {
          const href = link.getAttribute('href') || '';
          const issueIdMatch = href.match(/\/issues\/(\d+)/);
          if (!issueIdMatch) return;

          const issueId = issueIdMatch[1];
          const title = link.textContent?.trim() || '';

          if (title.length < 5) return;

          let row = link.closest('div[data-testid="list-row-item"]');
          if (!row) row = link.closest('div.js-issue-row');
          if (!row) row = link.closest('li.js-issue-row');
          if (!row) row = link.closest('tr');
          if (!row) row = link.parentElement?.parentElement;

          let status = 'Open';
          let author = '';
          let dateDisplay = '';

          if (row) {
            const statusPill = row.querySelector('[data-testid="issue-pr-status-pill"]');
            if (statusPill) {
              status = statusPill.textContent?.trim() || 'Open';
            }

            const authorEl = row.querySelector('[data-testid="list-row-author"]');
            if (authorEl) {
              author = authorEl.textContent?.trim() || '';
            } else {
              const openedBy = row.querySelector('.opened-by');
              if (openedBy) {
                const authorLink = openedBy.querySelector('a');
                if (authorLink) author = authorLink.textContent?.trim() || '';
              }
            }

            const timeEl = row.querySelector('relative-time');
            if (timeEl) {
              dateDisplay = timeEl.textContent?.trim() || '';
            }
          }

          const existingIssue = issues.find(i => i.id === issueId);
          if (!existingIssue) {
            issues.push({
              id: issueId,
              author: author,
              date: '',
              dateDisplay: dateDisplay,
              title: title,
              status: status,
              url: `https://github.com${href}`
            });
          }
        });

        debug.issuesFound = issues.length;
        debug.firstIssue = issues[0] || null;

        return { issues, debug };
      }
    });

    if (results && results[0] && results[0].result) {
      const { issues, debug } = results[0].result;
      console.log('Debug info:', debug);
      
      if (issues.length > 0) {
        renderIssues(issues);
      } else {
        statusDiv.textContent = `No issues found. Links: ${debug.linksFound}`;
      }
    } else {
      statusDiv.textContent = 'Script execution failed.';
    }
  } catch (error) {
    statusDiv.textContent = `Error: ${error.message}`;
    console.error('Error:', error);
  }
}

refreshBtn.addEventListener('click', extractIssuesFromCurrentTab);

extractIssuesFromCurrentTab();

// Copyright 2023 Google LLC
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

document.getElementById('extractBtn').addEventListener('click', async () => {
  const extractBtn = document.getElementById('extractBtn');
  const status = document.getElementById('status');
  const results = document.getElementById('results');

  extractBtn.disabled = true;
  status.textContent = 'Extracting issues...';
  status.className = 'status';
  results.innerHTML = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('github.com')) {
      status.textContent = 'Please navigate to a GitHub issues page.';
      status.className = 'status error';
      extractBtn.disabled = false;
      return;
    }

    const results_data = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractIssues
    });

    const issues = results_data[0].result;

    if (issues.length === 0) {
      status.textContent = 'No issues found on this page.';
      status.className = 'status';
      results.innerHTML = '<div class="no-issues">No issues found. Make sure you are on a GitHub issues page.</div>';
    } else {
      status.textContent = `Found ${issues.length} issue(s).`;
      status.className = 'status success';
      displayIssues(issues);
    }
  } catch (error) {
    status.textContent = 'Error: ' + error.message;
    status.className = 'status error';
    console.error(error);
  }

  extractBtn.disabled = false;
});

function extractIssues() {
  const issues = [];
  const seenIds = new Set();
  
  // Find all issue rows using data-testid attribute (GitHub's current structure)
  const issueRows = document.querySelectorAll('[data-testid="issue-row"]');
  
  issueRows.forEach(row => {
    const issue = {};
    
    // Extract issue ID from the row's data attribute or from link
    const idLink = row.querySelector('a[href*="/issues/"]');
    if (idLink) {
      const href = idLink.getAttribute('href');
      const idMatch = href.match(/\/issues\/(\d+)/);
      issue.id = idMatch ? idMatch[1] : null;
    }
    
    // Skip if no ID found or already processed
    if (!issue.id || seenIds.has(issue.id)) {
      return;
    }
    seenIds.add(issue.id);
    
    // Extract title from the main issue link
    const titleLink = row.querySelector('a[data-hovercard-type="issue"], a[href*="/issues/"]');
    issue.title = titleLink ? titleLink.textContent.trim() : 'N/A';
    
    // Extract author - look for the "opened by" text pattern
    const authorLink = row.querySelector('a[data-hovercard-type="user"]');
    if (authorLink) {
      issue.author = authorLink.textContent.trim();
    } else {
      // Try to find from text content
      const openedByText = row.textContent.match(/opened by\s+(\S+)/i);
      issue.author = openedByText ? openedByText[1] : 'N/A';
    }
    
    // Extract date from relative-time element
    const timeElement = row.querySelector('relative-time, time[datetime]');
    if (timeElement) {
      issue.date = timeElement.getAttribute('datetime') || timeElement.textContent.trim();
    } else {
      issue.date = 'N/A';
    }
    
    // Extract status - check for status text in the row
    // GitHub shows status as text like "Open", "Closed", "Not planned"
    const statusElement = row.querySelector('[data-testid="issue-state"], .State');
    if (statusElement) {
      issue.status = statusElement.textContent.trim();
    } else {
      // Check for status indicators in the row
      const rowText = row.textContent.toLowerCase();
      if (rowText.includes('status: open') || row.querySelector('.octicon-issue-opened')) {
        issue.status = 'Open';
      } else if (rowText.includes('status: closed') || row.querySelector('.octicon-issue-closed')) {
        issue.status = 'Closed';
      } else if (rowText.includes('status: not planned')) {
        issue.status = 'Not planned';
      } else {
        // Default based on icon color or text patterns
        const openIcon = row.querySelector('[color="success"], .color-fg-open');
        const closedIcon = row.querySelector('[color="danger"], .color-fg-closed');
        if (openIcon) {
          issue.status = 'Open';
        } else if (closedIcon) {
          issue.status = 'Closed';
        } else {
          issue.status = 'Open';
        }
      }
    }
    
    issues.push(issue);
  });
  
  // If no issues found with primary selector, try alternative selectors
  if (issues.length === 0) {
    // Try to find issues in the search results format
    const searchResults = document.querySelectorAll('.issue-item, .Box-row');
    searchResults.forEach(row => {
      const issue = {};
      
      // Extract ID
      const idLink = row.querySelector('a[href*="/issues/"]');
      if (idLink) {
        const href = idLink.getAttribute('href');
        const idMatch = href.match(/\/issues\/(\d+)/);
        issue.id = idMatch ? idMatch[1] : null;
      }
      
      if (!issue.id || seenIds.has(issue.id)) {
        return;
      }
      seenIds.add(issue.id);
      
      // Extract title
      const titleLink = row.querySelector('a[data-hovercard-type="issue"], h3 a, a[href*="/issues/"]');
      issue.title = titleLink ? titleLink.textContent.trim() : 'N/A';
      
      // Extract author
      const authorLink = row.querySelector('a[data-hovercard-type="user"]');
      issue.author = authorLink ? authorLink.textContent.trim() : 'N/A';
      
      // Extract date
      const timeElement = row.querySelector('relative-time, time[datetime]');
      issue.date = timeElement ? (timeElement.getAttribute('datetime') || timeElement.textContent.trim()) : 'N/A';
      
      // Extract status from text patterns
      const rowText = row.textContent;
      if (rowText.includes('Status: Open')) {
        issue.status = 'Open';
      } else if (rowText.includes('Status: Closed')) {
        issue.status = 'Closed';
      } else if (rowText.includes('Status: Not planned')) {
        issue.status = 'Not planned';
      } else {
        issue.status = 'Open';
      }
      
      issues.push(issue);
    });
  }
  
  return issues;
}

function displayIssues(issues) {
  const results = document.getElementById('results');
  
  const table = document.createElement('table');
  table.className = 'issues-table';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Issue ID</th>
      <th>Title</th>
      <th>Author</th>
      <th>Date</th>
      <th>Status</th>
    </tr>
  `;
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  issues.forEach(issue => {
    const row = document.createElement('tr');
    
    // Determine status class
    let statusClass = 'status-open';
    const statusLower = issue.status.toLowerCase();
    if (statusLower.includes('closed')) {
      statusClass = 'status-closed';
    } else if (statusLower.includes('not planned')) {
      statusClass = 'status-not-planned';
    }
    
    row.innerHTML = `
      <td class="issue-id">#${escapeHtml(issue.id)}</td>
      <td class="issue-title" title="${escapeHtml(issue.title)}">${escapeHtml(issue.title)}</td>
      <td class="issue-author">${escapeHtml(issue.author)}</td>
      <td class="issue-date">${escapeHtml(issue.date)}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(issue.status)}</span></td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  
  results.appendChild(table);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

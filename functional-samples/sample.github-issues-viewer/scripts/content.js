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

function extractIssuesData() {
  const issues = [];

  let issueRows = document.querySelectorAll('div[data-testid="list-row-item"], div.js-issue-row, li.js-issue-row');

  if (issueRows.length === 0) {
    const altRows = document.querySelectorAll('tr.js-issue-row, div[role="row"]');
    if (altRows.length > 0) {
      issueRows = altRows;
    }
  }

  issueRows.forEach((row) => {
    let issueId = '';
    let title = '';
    let href = '';
    let status = 'Open';
    let author = '';
    let date = '';
    let dateDisplay = '';

    const statusPill = row.querySelector('[data-testid="issue-pr-status-pill"]');
    if (statusPill) {
      status = statusPill.textContent?.trim() || 'Open';
    } else {
      const statusIcon = row.querySelector('.octicon-issue-open, .octicon-issue-closed');
      if (statusIcon) {
        status = statusIcon.classList.contains('octicon-issue-closed') ? 'Closed' : 'Open';
      }
    }

    const linkElement = row.querySelector('a[data-testid="list-row-title-link"], a.js-navigation-open, a.h4');
    if (linkElement) {
      title = linkElement.textContent?.trim() || '';
      href = linkElement.getAttribute('href') || '';
      const issueIdMatch = href.match(/\/issues\/(\d+)/);
      issueId = issueIdMatch ? issueIdMatch[1] : '';
    }

    const authorElement = row.querySelector('[data-testid="list-row-author"], .opened-by a, .author');
    if (authorElement) {
      author = authorElement.textContent?.trim() || '';
    }

    const timeElement = row.querySelector('relative-time, time');
    if (timeElement) {
      date = timeElement.getAttribute('datetime') || '';
      dateDisplay = timeElement.textContent?.trim() || '';
    }

    if (issueId) {
      issues.push({
        id: issueId,
        author: author,
        date: date,
        dateDisplay: dateDisplay,
        title: title,
        status: status,
        url: href ? `https://github.com${href}` : ''
      });
    }
  });

  return issues;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractIssues') {
    const issues = extractIssuesData();
    sendResponse({ issues: issues });
  }
  return true;
});

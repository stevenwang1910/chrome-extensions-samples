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

const extractBtn = document.getElementById('extractBtn');
const exportBtn = document.getElementById('exportBtn');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const emptyState = document.getElementById('emptyState');
const issuesTableBody = document.getElementById('issuesTableBody');
const totalIssuesSpan = document.getElementById('totalIssues');

let extractedIssues = [];

/**
 * Shows status message
 * @param {string} message - Message to display
 * @param {string} type - Type of status (info, error, success)
 */
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;
}

/**
 * Hides status message
 */
function hideStatus() {
  statusDiv.className = 'status';
}

/**
 * Formats date string to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Renders issues data in the table
 * @param {Array} issues - Array of issue objects
 */
function renderIssues(issues) {
  issuesTableBody.innerHTML = '';

  if (issues.length === 0) {
    showStatus('No issues found on this page.', 'error');
    return;
  }

  issues.forEach((issue) => {
    const row = document.createElement('tr');

    const statusClass = issue.status.toLowerCase();
    const statusBadge = `
      <span class="status-badge ${statusClass}">
        <span class="status-dot"></span>
        ${issue.status}
      </span>
    `;

    row.innerHTML = `
      <td class="issue-id">${issue.id}</td>
      <td>${statusBadge}</td>
      <td class="issue-title" title="${escapeHtml(issue.title)}">${escapeHtml(issue.title)}</td>
      <td class="author">${escapeHtml(issue.author)}</td>
      <td class="date">${formatDate(issue.date)}</td>
    `;

    issuesTableBody.appendChild(row);
  });

  totalIssuesSpan.textContent = `Total: ${issues.length} issue${issues.length !== 1 ? 's' : ''}`;

  emptyState.classList.add('hidden');
  resultsDiv.classList.remove('hidden');
  exportBtn.disabled = false;
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Injects content script and extracts issues data
 */
async function extractIssues() {
  showStatus('Extracting issues...', 'info');
  extractBtn.disabled = true;

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showStatus('No active tab found.', 'error');
      extractBtn.disabled = false;
      return;
    }

    // Check if we're on a GitHub issues page
    if (!tab.url || !tab.url.includes('github.com')) {
      showStatus('Please navigate to a GitHub Issues page.', 'error');
      extractBtn.disabled = false;
      return;
    }

    console.log('Current URL:', tab.url);

    // Inject content script
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });
      console.log('Content script injected successfully');
    } catch (injectError) {
      console.log('Content script may already be injected:', injectError);
    }

    // Send message to content script to extract data
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractIssues' });
    console.log('Response from content script:', response);

    if (response && response.issues) {
      extractedIssues = response.issues;
      if (extractedIssues.length === 0) {
        showStatus('No issues found. Make sure you are on a GitHub Issues page with visible issues.', 'error');
      } else {
        renderIssues(extractedIssues);
        showStatus(`Successfully extracted ${extractedIssues.length} issues!`, 'success');
      }
    } else {
      showStatus('No issues data received from page.', 'error');
    }
  } catch (error) {
    console.error('Error extracting issues:', error);
    showStatus('Error: ' + error.message, 'error');
  } finally {
    extractBtn.disabled = false;
  }
}

/**
 * Converts issues data to CSV format
 * @param {Array} issues - Array of issue objects
 * @returns {string} CSV content
 */
function convertToCSV(issues) {
  const headers = ['ID', 'Status', 'Title', 'Author', 'Date'];
  const rows = issues.map((issue) => [
    issue.id,
    issue.status,
    `"${issue.title.replace(/"/g, '""')}"`,
    issue.author,
    issue.date
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Downloads data as CSV file
 */
function exportToCSV() {
  if (extractedIssues.length === 0) {
    showStatus('No data to export.', 'error');
    return;
  }

  const csv = convertToCSV(extractedIssues);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `github-issues-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showStatus('CSV file downloaded!', 'success');
}

// Event listeners
extractBtn.addEventListener('click', extractIssues);
exportBtn.addEventListener('click', exportToCSV);

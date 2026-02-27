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

/**
 * Determines issue status from various indicators
 * @param {Element} element - The element to check for status indicators
 * @returns {string} 'Open' or 'Closed'
 */
function getIssueStatus(element) {
  // First check for closed indicators
  const closedSelectors = [
    'svg[aria-label="Closed issue"]',
    'svg.octicon-issue-closed',
    '.octicon-issue-closed',
    '[aria-label*="Closed"]',
    '.State--closed',
    '[title="Status: Closed"]',
    '.State svg[aria-label="Closed"]',
    '.State--merged',  // Merged PRs also count as closed
    'svg[aria-label="Merged pull request"]'
  ];
  
  for (const selector of closedSelectors) {
    if (element.querySelector(selector)) {
      return 'Closed';
    }
  }
  
  // Check for open indicators
  const openSelectors = [
    'svg[aria-label="Open issue"]',
    'svg.octicon-issue-opened',
    '.octicon-issue-opened',
    '.State--open',
    '[title="Status: Open"]',
    '.State svg[aria-label="Open"]'
  ];
  
  for (const selector of openSelectors) {
    if (element.querySelector(selector)) {
      return 'Open';
    }
  }
  
  // Check text content for status
  const text = element.textContent.toLowerCase();
  if (text.includes('status: closed') || text.includes('closed issue')) {
    return 'Closed';
  }
  if (text.includes('status: open') || text.includes('open issue')) {
    return 'Open';
  }
  
  // Default to Open if no indicators found
  return 'Open';
}

/**
 * Extracts GitHub Issues data from the current page
 * @returns {Array} Array of issue objects containing id, author, date, title, and status
 */
function extractIssuesData() {
  const issues = [];

  // Try multiple selectors to find issue rows
  const selectors = [
    '[data-testid="issue-row"]',
    '.js-issue-row',
    '[data-issue-id]',
    '.issue-item',
    'div[data-hovercard-type="issue"]',
    '.Box-row'
  ];

  let issueRows = [];
  for (const selector of selectors) {
    issueRows = document.querySelectorAll(selector);
    if (issueRows.length > 0) {
      console.log(`Found ${issueRows.length} issues with selector: ${selector}`);
      break;
    }
  }

  issueRows.forEach((row) => {
    try {
      // Extract issue ID - try multiple methods
      let issueId = '';
      
      // Method 1: From data attribute
      const issueIdAttr = row.getAttribute('data-issue-id');
      if (issueIdAttr) {
        issueId = '#' + issueIdAttr;
      }
      
      // Method 2: From id attribute
      if (!issueId) {
        const idElement = row.querySelector('a[id^="issue_"], [id^="issue_"]');
        if (idElement) {
          const match = idElement.id.match(/issue_(\d+)/);
          if (match) {
            issueId = '#' + match[1];
          }
        }
      }
      
      // Method 3: From href
      if (!issueId) {
        const issueLink = row.querySelector('a[href*="/issues/"]');
        if (issueLink) {
          const match = issueLink.href.match(/\/issues\/(\d+)/);
          if (match) {
            issueId = '#' + match[1];
          }
        }
      }

      // Extract title - try multiple selectors
      let title = '';
      const titleSelectors = [
        'a[data-hovercard-type="issue"]',
        '.Link--primary',
        'a[href*="/issues/"] h3',
        'a[href*="/issues/"]',
        '.issue-title',
        'h3 a'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = row.querySelector(selector);
        if (titleElement) {
          title = titleElement.textContent.trim();
          if (title) break;
        }
      }

      // Extract status using comprehensive detection
      const status = getIssueStatus(row);

      // Extract author - try multiple selectors
      let author = '';
      const authorSelectors = [
        'a[data-hovercard-type="user"]',
        '.author',
        '.opened-by a',
        'a[href^="/"] img + *',
        '.Link--secondary'
      ];
      
      for (const selector of authorSelectors) {
        const authorElement = row.querySelector(selector);
        if (authorElement) {
          author = authorElement.textContent.trim();
          if (author && author.length < 50) break; // Sanity check
        }
      }

      // Extract date - try multiple selectors
      let date = '';
      const timeSelectors = [
        'relative-time',
        'time',
        'time-ago',
        '.relative-time',
        'relative-time[datetime]'
      ];
      
      for (const selector of timeSelectors) {
        const timeElement = row.querySelector(selector);
        if (timeElement) {
          date = timeElement.getAttribute('datetime') || timeElement.textContent.trim();
          if (date) break;
        }
      }

      if (issueId && title) {
        issues.push({
          id: issueId,
          title: title,
          author: author,
          date: date,
          status: status
        });
      }
    } catch (error) {
      console.error('Error extracting issue data:', error);
    }
  });

  // If still no issues found, try a more generic approach
  if (issues.length === 0) {
    return extractIssuesDataGeneric();
  }

  return issues;
}

/**
 * Generic method to extract issues data by scanning all links
 * @returns {Array} Array of issue objects
 */
function extractIssuesDataGeneric() {
  const issues = [];
  const processedIds = new Set();

  // Find all issue links on the page
  const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
  
  issueLinks.forEach((link) => {
    try {
      const href = link.getAttribute('href');
      const match = href.match(/\/issues\/(\d+)$/);
      
      if (match) {
        const issueNum = match[1];
        
        // Skip duplicates
        if (processedIds.has(issueNum)) return;
        processedIds.add(issueNum);
        
        const issueId = '#' + issueNum;
        const title = link.textContent.trim();
        
        if (title) {
          // Try to find the parent row/container
          let container = link.closest('div[class*="row"]') || 
                         link.closest('li') || 
                         link.closest('div[class*="Box"]') ||
                         link.closest('[data-testid]') ||
                         link.parentElement.parentElement.parentElement;
          
          // Extract status using comprehensive detection
          const status = container ? getIssueStatus(container) : 'Open';
          
          // Extract author from container or nearby elements
          let author = '';
          if (container) {
            const authorEl = container.querySelector('a[href^="/"] img') ||
                           container.querySelector('.author') ||
                           container.querySelector('a[data-hovercard-type="user"]');
            if (authorEl) {
              author = authorEl.getAttribute('alt') || 
                      authorEl.textContent.trim() ||
                      authorEl.getAttribute('href')?.replace('/', '');
            }
          }
          
          // Extract date
          let date = '';
          if (container) {
            const timeEl = container.querySelector('relative-time, time');
            if (timeEl) {
              date = timeEl.getAttribute('datetime') || timeEl.textContent.trim();
            }
          }
          
          issues.push({
            id: issueId,
            title: title,
            author: author,
            date: date,
            status: status
          });
        }
      }
    } catch (error) {
      console.error('Error in generic extraction:', error);
    }
  });

  return issues;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractIssues') {
    console.log('Extracting issues...');
    const issues = extractIssuesData();
    console.log(`Found ${issues.length} issues:`, issues);
    sendResponse({ issues: issues });
  }
  return true;
});

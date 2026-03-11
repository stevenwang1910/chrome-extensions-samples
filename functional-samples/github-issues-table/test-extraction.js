// Test script to verify extraction logic
// This can be run in the browser console on a GitHub issues page

function _testExtractIssueData() {
  console.log('Testing issue extraction logic...');

  // Test the selector logic
  const selectors = [
    'div[data-testid="issue-row"]',
    'div[data-testid="pull-request-row"]',
    'div.Box-row--drag-button',
    'div.Box-row:not(.Box-row--unread)',
    'div.Box-row',
    'div[role="row"]',
    'li[id^="issue_"]'
  ];

  let foundRows = [];
  for (const selector of selectors) {
    const rows = document.querySelectorAll(selector);
    if (rows.length > 0) {
      console.log(`Selector "${selector}" found ${rows.length} rows`);
      foundRows = Array.from(rows);
      break;
    }
  }

  if (foundRows.length === 0) {
    console.log('No rows found with any selector');
    return;
  }

  // Test extraction on first row
  const firstRow = foundRows[0];
  console.log('First row HTML:', firstRow.innerHTML.substring(0, 500));

  // Test ID extraction
  const titleLink = firstRow.querySelector(
    'a[data-hovercard-type="issue"], a[id^="issue_"]'
  );
  if (titleLink) {
    console.log('Title link found:', titleLink.textContent.trim());
    const href = titleLink.getAttribute('href');
    console.log('Href:', href);
    const idMatch = href.match(/\/issues\/(\d+)/);
    if (idMatch) console.log('Issue ID:', idMatch[1]);
  }

  // Test status extraction
  const statusSvg = firstRow.querySelector('svg');
  if (statusSvg) {
    console.log('Status SVG aria-label:', statusSvg.getAttribute('aria-label'));
    console.log('Status SVG class:', statusSvg.getAttribute('class'));
  }

  // Test submitter extraction
  const userLinks = firstRow.querySelectorAll('a[data-hovercard-type="user"]');
  console.log('User links found:', userLinks.length);
  userLinks.forEach((link) =>
    console.log('User link:', link.getAttribute('href'))
  );

  // Test date extraction
  const timeEl = firstRow.querySelector('relative-time, time');
  if (timeEl) {
    console.log('Time element datetime:', timeEl.getAttribute('datetime'));
  }

  console.log(
    'Row text content snippet:',
    firstRow.textContent.substring(0, 300)
  );
}

// Run test when script is loaded
if (typeof window !== 'undefined') {
  console.log(
    'Test script loaded - run _testExtractIssueData() in console to test'
  );
  window._testExtractIssueData = _testExtractIssueData;
}

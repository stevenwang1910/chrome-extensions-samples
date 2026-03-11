// Run this in browser console on https://github.com/GoogleChrome/chrome-extensions-samples/issues
(function () {
  console.log('=== GITHUB DOM STRUCTURE ANALYZER ===\n');

  // Find all elements that might be issue rows
  const selectorsToTest = [
    'div[data-testid="issue-row"]',
    'div.Box-row',
    'div[aria-labelledby]',
    'div[id^="issue_"]',
    '.issue',
    '.js-issue-row'
  ];

  console.log('--- Testing selectors for issue rows ---');
  let rows = [];
  let bestSelector = '';
  for (const selector of selectorsToTest) {
    const elements = document.querySelectorAll(selector);
    console.log(`${selector}: ${elements.length} elements`);
    if (elements.length > rows.length) {
      rows = Array.from(elements);
      bestSelector = selector;
    }
  }

  if (rows.length === 0) {
    console.log("No rows found! Let's search more broadly...");
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.textContent.includes('opened') && div.textContent.includes('#')) {
        rows.push(div);
        if (rows.length >= 25) break;
      }
    }
    console.log(`Found ${rows.length} potential rows by content search`);
  }

  if (rows.length === 0) {
    console.log("Still no rows. Let's look at the page structure...");
    const container = document.querySelector('.repo-container .Box');
    if (container) {
      console.log('Box container found:', container);
      rows = container.querySelectorAll('div');
      console.log('Divs inside Box:', rows.length);
    }
    return;
  }

  console.log(`\n--- Analyzing first row from ${bestSelector} ---`);
  const firstRow = rows[0];
  console.log('Row HTML:', firstRow.innerHTML.substring(0, 5000));
  console.log('\nRow text:', firstRow.textContent.substring(0, 1000));

  console.log('\n--- Finding submitter info ---');
  // Look for submitter patterns
  const text = firstRow.textContent;
  const openedByMatch = text.match(/opened\s+by\s+@?([a-zA-Z0-9_-]+)/i);
  console.log('"opened by" regex match:', openedByMatch);

  // Look for user links
  const userLinks = firstRow.querySelectorAll('a');
  for (const link of userLinks) {
    const href = link.getAttribute('href') || '';
    const hovercard = link.getAttribute('data-hovercard-type');
    if (hovercard === 'user' || href.match(/^\/[a-zA-Z0-9_-]+$/)) {
      console.log('User link:', link.textContent.trim(), href);
    }
  }

  // Look for span elements that might contain the submitter
  const spans = firstRow.querySelectorAll('span');
  for (const span of spans) {
    const spanText = span.textContent.trim();
    if (
      spanText.includes('@') ||
      (span.previousElementSibling &&
        span.previousElementSibling.textContent.includes('by'))
    ) {
      console.log('Potential submitter span:', spanText);
    }
  }

  console.log('\n--- Finding status info ---');
  const stateElements = firstRow.querySelectorAll(
    '[data-state], .State, [aria-label*="open"], [aria-label*="closed"]'
  );
  for (const el of stateElements) {
    console.log('State element:', {
      text: el.textContent.trim(),
      class: el.getAttribute('class'),
      'data-state': el.getAttribute('data-state'),
      'aria-label': el.getAttribute('aria-label'),
      title: el.getAttribute('title')
    });
  }

  // Look for SVGs that indicate state
  const svgs = firstRow.querySelectorAll('svg');
  for (const svg of svgs) {
    const ariaLabel = svg.getAttribute('aria-label');
    const title = svg.querySelector('title')?.textContent;
    if (ariaLabel || title) {
      console.log('SVG state:', ariaLabel || title);
    }
  }

  console.log('\n--- Finding date info ---');
  const timeElements = firstRow.querySelectorAll(
    'relative-time, time, [datetime]'
  );
  for (const el of timeElements) {
    console.log('Time element:', {
      text: el.textContent.trim(),
      datetime: el.getAttribute('datetime'),
      title: el.getAttribute('title')
    });
  }

  console.log('\n--- Finding issue ID and title ---');
  const links = firstRow.querySelectorAll(
    'a[href*="/issues/"], a[href*="/pull/"]'
  );
  for (const link of links) {
    const href = link.getAttribute('href');
    const idMatch = href?.match(/\/(?:issues|pull)\/(\d+)/);
    if (idMatch) {
      console.log('Issue link:', {
        id: idMatch[1],
        title: link.textContent.trim(),
        href: href
      });
    }
  }

  console.log('\n--- Full row analysis complete ---');

  // Test extraction on first 5 rows
  console.log('\n--- Testing extraction on first 5 rows ---');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const rowText = row.textContent;

    const issue = {
      id: '',
      title: '',
      submitter: '',
      date: '',
      status: ''
    };

    // Extract ID
    const idMatch = rowText.match(/#(\d+)/);
    if (idMatch) issue.id = idMatch[1];

    // Extract submitter
    const submitterMatch = rowText.match(
      /opened\s+(?:.*?)\s+by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]*)/i
    );
    if (submitterMatch) issue.submitter = submitterMatch[1];

    // Extract date
    const timeEl = row.querySelector('relative-time');
    if (timeEl) issue.date = timeEl.getAttribute('datetime');

    // Extract status
    if (rowText.includes('Closed') || rowText.includes('Merged')) {
      issue.status = 'Closed';
    } else {
      issue.status = 'Open';
    }

    // Extract title from link
    const titleLink = row.querySelector('a[href*="/issues/"]');
    if (titleLink) issue.title = titleLink.textContent.trim();

    console.log(`Row ${i + 1}:`, issue);
  }
})();

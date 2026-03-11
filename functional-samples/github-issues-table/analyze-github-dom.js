// Copy and paste this entire script into your browser console on GitHub issues page
// to analyze the current DOM structure

function analyzeGitHubDom() {
  console.log('=== GitHub DOM Analysis ===\n');

  // Find all issue rows
  const possibleRows = document.querySelectorAll('div');
  const issueRows = [];

  for (const row of possibleRows) {
    const text = row.textContent.toLowerCase();
    if (
      text.includes('opened') &&
      text.includes('by') &&
      (text.match(/#\d+/) || row.querySelector('a[href*="/issues/"]'))
    ) {
      issueRows.push(row);
    }
  }

  console.log(`Found ${issueRows.length} possible issue rows`);

  if (issueRows.length === 0) {
    console.log('\n--- Trying different selectors ---');
    const testSelectors = [
      'div[data-testid]',
      'div[role="row"]',
      '.Box-row',
      '.js-issue-row',
      '[data-tracking-id]'
    ];

    for (const sel of testSelectors) {
      const els = document.querySelectorAll(sel);
      console.log(`${sel}: ${els.length} elements`);
    }
    return;
  }

  // Analyze first row
  const firstRow = issueRows[0];
  console.log('\n--- First Row Analysis ---');
  console.log('Row classes:', firstRow.className);
  console.log('Row data-testid:', firstRow.getAttribute('data-testid'));
  console.log('Row aria-label:', firstRow.getAttribute('aria-label'));

  // Find all data-testid elements in this row
  const testIds = firstRow.querySelectorAll('[data-testid]');
  console.log('\n--- data-testid elements in row ---');
  testIds.forEach((el) => {
    const testId = el.getAttribute('data-testid');
    const text = el.textContent.substring(0, 50).trim();
    console.log(`  [data-testid="${testId}"]: ${text}`);
  });

  // Find all links
  console.log('\n--- Links in row ---');
  const links = firstRow.querySelectorAll('a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    const text = link.textContent.substring(0, 40).trim();
    const hovercard = link.getAttribute('data-hovercard-type');
    console.log(`  href="${href}" text="${text}" hovercard="${hovercard}"`);
  });

  // Find all spans with classes
  console.log('\n--- Spans with classes in row ---');
  const spans = firstRow.querySelectorAll('span');
  spans.forEach((span) => {
    if (span.className) {
      const text = span.textContent.substring(0, 40).trim();
      const ariaLabel = span.getAttribute('aria-label') || '';
      console.log(
        `  class="${span.className.substring(0, 50)}" text="${text}" aria-label="${ariaLabel}"`
      );
    }
  });

  // Find SVG icons
  console.log('\n--- SVG icons in row ---');
  const svgs = firstRow.querySelectorAll('svg');
  svgs.forEach((svg) => {
    const useEl = svg.querySelector('use');
    const href = useEl
      ? useEl.getAttribute('xlink:href') || useEl.getAttribute('href')
      : '';
    const ariaLabel = svg.getAttribute('aria-label') || '';
    console.log(`  SVG: aria-label="${ariaLabel}" use:href="${href}"`);
  });

  // Find time elements
  console.log('\n--- Time elements in row ---');
  const times = firstRow.querySelectorAll('time, relative-time, [datetime]');
  times.forEach((time) => {
    const dt = time.getAttribute('datetime') || time.getAttribute('title');
    const text = time.textContent.trim();
    console.log(`  ${time.tagName}: datetime="${dt}" text="${text}"`);
  });

  // Full row text
  console.log('\n--- Full row text (first 500 chars) ---');
  console.log(firstRow.textContent.substring(0, 500));

  // Let's look for the exact structure
  console.log('\n--- Looking for metadata container ---');
  const allEls = firstRow.querySelectorAll('*');
  for (const el of allEls) {
    const text = el.textContent;
    if (text.match(/opened.*by/i) && el.children.length <= 10) {
      console.log(
        `Possible metadata container (${el.tagName}.${el.className}):`
      );
      console.log(`  Text: ${text.substring(0, 100)}`);
      console.log(`  Children: ${el.children.length}`);
      break;
    }
  }
}

// Run the analysis
analyzeGitHubDom();

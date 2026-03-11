// Run this in Chrome DevTools console on GitHub issues page to see actual DOM structure
function analyzeGitHubDOM() {
  console.log('=== GitHub DOM Analysis ===\n');

  // Find all issue rows
  const _allSelectors = [
    'div[data-testid]',
    'div[data-tracking-id]',
    '.js-issue-row',
    '.Box-row',
    '[role="row"]'
  ];

  console.log('--- Looking for data-testid attributes ---');
  const testIds = document.querySelectorAll('[data-testid]');
  const testIdMap = {};
  for (const el of testIds) {
    const id = el.getAttribute('data-testid');
    testIdMap[id] = (testIdMap[id] || 0) + 1;
  }
  console.log('data-testid attributes found:', testIdMap);

  console.log('\n--- Looking for issue rows ---');
  const rows = document.querySelectorAll('div.Box-row');
  console.log('Box-row elements:', rows.length);

  if (rows.length > 0) {
    console.log('\n--- First Box-row HTML structure ---');
    const firstRow = rows[0];
    console.log(
      'First row innerHTML (first 3000 chars):\n',
      firstRow.innerHTML.substring(0, 3000)
    );

    console.log('\n--- First row text content ---');
    console.log(firstRow.textContent.substring(0, 500));

    console.log('\n--- All elements with data-testid in first row ---');
    firstRow.querySelectorAll('[data-testid]').forEach((el) => {
      console.log(
        `  [data-testid="${el.getAttribute('data-testid')}"]:`,
        el.textContent.substring(0, 100)
      );
    });

    console.log('\n--- All links in first row ---');
    firstRow.querySelectorAll('a').forEach((link) => {
      console.log(
        `  href="${link.getAttribute('href')}":`,
        link.textContent.substring(0, 50)
      );
    });

    console.log('\n--- All spans with classes in first row ---');
    firstRow.querySelectorAll('span[class]').forEach((span) => {
      console.log(
        `  class="${span.className}":`,
        span.textContent.substring(0, 50)
      );
    });

    console.log('\n--- All StateLabel elements ---');
    firstRow.querySelectorAll('[class*="StateLabel"]').forEach((el) => {
      console.log(
        `  ${el.tagName}.${el.className}: aria-label="${el.getAttribute('aria-label')}" text="${el.textContent}"`
      );
    });

    console.log('\n--- All SVG elements with aria-label ---');
    firstRow.querySelectorAll('svg[aria-label]').forEach((svg) => {
      console.log(`  svg: aria-label="${svg.getAttribute('aria-label')}"`);
    });

    console.log('\n--- All time elements ---');
    firstRow
      .querySelectorAll('relative-time, time-ago, time, [datetime]')
      .forEach((time) => {
        console.log(
          `  ${time.tagName}: datetime="${time.getAttribute('datetime')}" title="${time.getAttribute('title')}" text="${time.textContent}"`
        );
      });

    console.log('\n--- All user links ---');
    firstRow
      .querySelectorAll(
        'a[data-hovercard-type="user"], a[data-hovercard-url*="/users/"]'
      )
      .forEach((link) => {
        console.log(
          `  User link: href="${link.getAttribute('href')}" text="${link.textContent}"`
        );
      });
  }

  console.log('\n--- Looking for metadata patterns ---');
  const textSamples = [];
  rows.forEach((row, i) => {
    if (i < 3) {
      textSamples.push(row.textContent.substring(0, 300));
    }
  });
  console.log('Text samples:', textSamples);

  return { rows, testIdMap };
}

// Run the analysis
analyzeGitHubDOM();

// Also test extraction
function testExtraction() {
  console.log('\n=== Testing Extraction ===\n');

  // Simulate what content.js does
  function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  const rows = document.querySelectorAll('div.Box-row');
  if (rows.length > 0) {
    const row = rows[0];
    const rowText = cleanText(row.textContent);
    console.log('Row text:', rowText);

    // Look for title link
    const titleLink = row.querySelector('[data-testid="issue-title-link"]');
    console.log('\nTitle link:', titleLink);
    if (titleLink) {
      console.log('Title link href:', titleLink.getAttribute('href'));
      console.log('Title link text:', titleLink.textContent);
    }

    // Look for status
    console.log('\nLooking for status:');
    const statusEl = row.querySelector('span.StateLabel');
    console.log('StateLabel:', statusEl);
    if (statusEl) {
      console.log('  aria-label:', statusEl.getAttribute('aria-label'));
      console.log('  text:', statusEl.textContent);
      console.log('  className:', statusEl.className);
    }

    // Look for byline
    console.log('\nLooking for byline:');
    const byPattern = /by\s+@?([a-zA-Z0-9_-]+)/i;
    const match = rowText.match(byPattern);
    console.log('Regex match for "by":', match);

    // Look for all text that might contain submitter
    console.log('\nSmall text elements:');
    row.querySelectorAll('span').forEach((span) => {
      const text = cleanText(span.textContent);
      if (text.includes('by') || text.includes('opened')) {
        console.log('  ', text);
      }
    });
  }
}

testExtraction();

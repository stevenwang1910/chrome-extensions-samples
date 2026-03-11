// Copy this script and run it in Chrome DevTools on GitHub issues page
// to see the actual DOM structure

function analyzeGitHubDOM() {
  console.log('=== GitHub Issues DOM Analysis ===\n');

  // Find all issue rows
  const allSelectors = [
    'div[data-testid]',
    'div[data-testid="issue-row"]',
    '.js-issue-row',
    'div[id^="issue_"]',
    '.Box-row',
    '[role="row"]'
  ];

  console.log('--- Selector Results ---');
  for (const sel of allSelectors) {
    const els = document.querySelectorAll(sel);
    console.log(`${sel}: ${els.length} elements`);
  }

  // Get sample row
  const sampleRow =
    document.querySelector('div[data-testid="issue-row"]') ||
    document.querySelector('.js-issue-row') ||
    document.querySelector('[id^="issue_"]');

  if (sampleRow) {
    console.log('\n--- Sample Row Structure ---');
    console.log('Row classes:', sampleRow.className);

    // Look for state elements
    console.log('\n--- State Elements ---');
    const stateEls = sampleRow.querySelectorAll(
      'span[class*="State"], svg[aria-label], [data-state]'
    );
    stateEls.forEach((el, i) => {
      console.log(
        `State ${i}:`,
        el.tagName,
        el.className,
        el.textContent.trim(),
        el.getAttribute('aria-label')
      );
    });

    // Look for user links
    console.log('\n--- User Links ---');
    const userLinks = sampleRow.querySelectorAll(
      'a[data-hovercard-type="user"], a[href^="/"]'
    );
    userLinks.forEach((link, i) => {
      const href = link.getAttribute('href');
      if (href && !href.includes('/issues/') && !href.includes('/pull/')) {
        console.log(`User ${i}:`, href, link.textContent.trim());
      }
    });

    // Look for time elements
    console.log('\n--- Time Elements ---');
    const timeEls = sampleRow.querySelectorAll(
      'relative-time, time, [datetime]'
    );
    timeEls.forEach((t, i) => {
      console.log(
        `Time ${i}:`,
        t.tagName,
        t.getAttribute('datetime'),
        t.getAttribute('title'),
        t.textContent
      );
    });

    // Look for metadata text
    console.log('\n--- Metadata Text ---');
    const text = sampleRow.textContent;
    console.log('Text snippet:', text.substring(0, 500));

    // Look for "by" pattern
    const byMatch = text.match(/by\s+@?([a-zA-Z0-9_-]+)/i);
    console.log('"by" match:', byMatch ? byMatch[0] : 'not found');

    // Look for opened pattern
    const openedMatch = text.match(/opened\s+(.*?)\s+by/i);
    console.log(
      '"opened" pattern:',
      openedMatch ? openedMatch[0] : 'not found'
    );
  }

  console.log('\n=== End Analysis ===');
}

analyzeGitHubDOM();

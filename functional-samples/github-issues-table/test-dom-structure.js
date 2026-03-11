// Run this in browser console on GitHub issues page to analyze DOM structure
function analyzeGitHubDOM() {
  console.log('=== Analyzing GitHub DOM Structure ===\n');

  // Get all potential issue rows
  const selectors = [
    'div[data-testid="issue-row"]',
    'div.Box-row',
    'div[aria-label="Issues"] div',
    'div[data-hovercard-url*="issues"]'
  ];

  let rows = [];
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    console.log(`Selector "${selector}": ${found.length} elements`);
    if (found.length > 0 && rows.length === 0) {
      rows = Array.from(found);
    }
  }

  if (rows.length === 0) {
    console.log('\nNo issue rows found. Let me search for issue links...');
    const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
    rows = new Set();
    issueLinks.forEach((link) => {
      const row = link.closest('div');
      if (row) rows.add(row);
    });
    rows = Array.from(rows);
    console.log(`Found ${rows.length} rows from issue links`);
  }

  if (rows.length > 0) {
    console.log('\n=== First Row Detailed Analysis ===\n');
    const firstRow = rows[0];

    // Show HTML structure
    console.log('Row HTML snippet:', firstRow.outerHTML.substring(0, 2000));

    // Look for all possible elements
    console.log('\n--- Key Elements ---');

    // Issue ID and Title
    const titleLink = firstRow.querySelector('a[data-hovercard-type="issue"]');
    console.log('Title link found:', !!titleLink);
    if (titleLink) {
      console.log('  - Text:', titleLink.textContent.trim());
      console.log('  - Href:', titleLink.getAttribute('href'));
    }

    // Status indicators
    console.log('\n--- Status Detection ---');
    const svgs = firstRow.querySelectorAll('svg');
    console.log(`SVGs found: ${svgs.length}`);
    svgs.forEach((svg, i) => {
      console.log(
        `  SVG ${i}:`,
        'aria-label:',
        svg.getAttribute('aria-label'),
        'class:',
        svg.getAttribute('class'),
        'title:',
        svg.querySelector('title')?.textContent
      );
    });

    // User/Author links
    console.log('\n--- User Links ---');
    const userLinks = firstRow.querySelectorAll(
      'a[data-hovercard-type="user"]'
    );
    console.log(`User links: ${userLinks.length}`);
    userLinks.forEach((link, i) => {
      console.log(
        `  User ${i}:`,
        'text:',
        link.textContent.trim(),
        'href:',
        link.getAttribute('href'),
        'parent text:',
        link.parentElement?.textContent?.trim()?.substring(0, 80)
      );
    });

    // Time elements
    console.log('\n--- Time Elements ---');
    const timeEls = firstRow.querySelectorAll(
      'relative-time, time-ago, time, span[data-timestamp]'
    );
    console.log(`Time elements: ${timeEls.length}`);
    timeEls.forEach((el, i) => {
      console.log(
        `  Time ${i}:`,
        'tag:',
        el.tagName,
        'datetime:',
        el.getAttribute('datetime'),
        'text:',
        el.textContent.trim()
      );
    });

    // Check for metadata section
    console.log('\n--- Metadata Section ---');
    const metaTexts = firstRow.textContent.match(
      /opened\s+by|on\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi
    );
    console.log('Meta patterns found:', metaTexts);

    console.log('\n=== Full Row Text ===');
    console.log(
      firstRow.textContent.trim().replace(/\s+/g, ' ').substring(0, 300)
    );
  }

  console.log('\n=== End Analysis ===');
}

analyzeGitHubDOM();

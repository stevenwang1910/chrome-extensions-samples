// Run this in browser console on GitHub issues page
function simpleTest() {
  console.log('=== Simple GitHub Test ===\n');

  // Get all issue rows
  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log(`Found ${rows.length} issue rows`);

  if (rows.length > 0) {
    const firstRow = rows[0];

    console.log('\n--- First Row HTML ---\n');
    console.log(firstRow.outerHTML.substring(0, 5000));

    console.log('\n--- Key Elements ---\n');

    // Look for all anchor tags
    const links = firstRow.querySelectorAll('a');
    console.log(`Links (${links.length}):`);
    links.forEach((link, i) => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim().substring(0, 50);
      const hovercard = link.getAttribute('data-hovercard-type');
      console.log(
        `  ${i}: href=${href}, text="${text}", hovercard=${hovercard}`
      );
    });

    // Look for all spans with aria-label
    const spans = firstRow.querySelectorAll('span[aria-label]');
    console.log(`\nStatus spans (${spans.length}):`);
    spans.forEach((span, i) => {
      console.log(`  ${i}: aria-label=${span.getAttribute('aria-label')}`);
    });

    // Look for all SVGs
    const svgs = firstRow.querySelectorAll('svg');
    console.log(`\nSVGs (${svgs.length}):`);
    svgs.forEach((svg, i) => {
      console.log(
        `  ${i}: aria-label=${svg.getAttribute('aria-label')}, class=${svg.getAttribute('class')}`
      );
    });

    // Look for time elements
    const times = firstRow.querySelectorAll('relative-time, time');
    console.log(`\nTime elements (${times.length}):`);
    times.forEach((time, i) => {
      console.log(
        `  ${i}: datetime=${time.getAttribute('datetime')}, text=${time.textContent.trim()}`
      );
    });

    // Look for the metadata section
    console.log('\n--- Metadata Search ---');
    const textContent = firstRow.textContent;
    console.log(
      'Text content sample:',
      textContent.replace(/\s+/g, ' ').substring(0, 300)
    );

    // Try to find "opened by" pattern
    const openedByMatch = textContent.match(
      /opened\s+by\s+@?([a-zA-Z0-9_-]+)/i
    );
    console.log('"opened by" match:', openedByMatch);

    // Try to find dates
    const dateMatch = textContent.match(
      /on\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}/i
    );
    console.log('Date match:', dateMatch);
  }
}

simpleTest();

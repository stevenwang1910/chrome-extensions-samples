// Run this in browser console on https://github.com/GoogleChrome/chrome-extensions-samples/issues
function analyzeLiveGitHub() {
  console.log('=== LIVE GITHUB ANALYSIS ===\n');

  // Find all issue rows
  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log(`Found ${rows.length} issue rows`);

  if (rows.length === 0) {
    console.log('No issue rows found. Looking for alternatives...');
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (
        div.textContent.includes('issues') &&
        div.querySelector('a[href*="/issues/"]')
      ) {
        console.log('Possible issue container:', div);
        break;
      }
    }
    return;
  }

  const firstRow = rows[0];
  console.log('\n=== FIRST ROW STRUCTURE ===\n');

  // Log all elements with data-testid
  console.log('Elements with data-testid:');
  firstRow.querySelectorAll('[data-testid]').forEach((el) => {
    console.log(
      `  ${el.getAttribute('data-testid')}:`,
      el.textContent.substring(0, 50)
    );
  });

  // Log all links
  console.log('\nAll links:');
  firstRow.querySelectorAll('a').forEach((a, i) => {
    console.log(
      `  ${i}: href=${a.getAttribute('href')}, text=${a.textContent.substring(0, 30)}`
    );
  });

  // Log all SVGs
  console.log('\nAll SVGs:');
  firstRow.querySelectorAll('svg').forEach((svg, i) => {
    console.log(`  ${i}:`, {
      'aria-label': svg.getAttribute('aria-label'),
      class: svg.getAttribute('class')?.substring(0, 50),
      title: svg.querySelector('title')?.textContent
    });
  });

  // Log all spans
  console.log('\nAll spans:');
  firstRow.querySelectorAll('span').forEach((span, i) => {
    const text = span.textContent.trim();
    if (text.length > 0 && text.length < 50) {
      console.log(`  ${i}: ${text}`);
    }
  });

  // Try to find the metadata area (submitter, date)
  console.log('\n=== LOOKING FOR METADATA ===\n');
  const allText = firstRow.textContent;
  console.log('Full text preview:', allText.substring(0, 300));

  // Look for patterns like "opened X days ago"
  const timePattern = /(opened|authored|created)\s+(.+?)\s+by/i;
  const timeMatch = allText.match(timePattern);
  console.log('Time pattern match:', timeMatch);

  // Look for @username pattern
  const atPattern = /@([a-zA-Z0-9][a-zA-Z0-9_-]*)/;
  const atMatch = allText.match(atPattern);
  console.log('@username match:', atMatch);

  // Let's try a different approach - look at the actual HTML structure
  console.log('\n=== HTML SNIPPET ===\n');
  console.log(firstRow.innerHTML.substring(0, 5000));
}

analyzeLiveGitHub();

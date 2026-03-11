// Run this in browser console on https://github.com/GoogleChrome/chrome-extensions-samples/issues
// to test the extraction logic

function testGitHubExtraction() {
  console.log('=== Testing GitHub Issue Extraction ===');

  // Get all issue rows
  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log(`Found ${rows.length} issue rows`);

  if (rows.length === 0) {
    console.log('Trying Box-row selector...');
    const boxRows = document.querySelectorAll('div.Box-row');
    console.log(`Found ${boxRows.length} Box rows`);
  }

  // Analyze first row
  if (rows.length > 0) {
    const firstRow = rows[0];
    console.log('\n--- First Row Analysis ---');

    // Check for title link
    const titleLink = firstRow.querySelector('a[data-hovercard-type="issue"]');
    console.log('Title link:', titleLink?.textContent?.trim());

    // Check for SVG status
    const svg = firstRow.querySelector('svg');
    console.log('Status SVG aria-label:', svg?.getAttribute('aria-label'));

    // Check for user links
    const userLinks = firstRow.querySelectorAll(
      'a[data-hovercard-type="user"]'
    );
    console.log(`User links found: ${userLinks.length}`);
    userLinks.forEach((link, i) => {
      console.log(
        `  User ${i}:`,
        link.textContent.trim(),
        'href:',
        link.getAttribute('href')
      );
      console.log(
        '    Parent text:',
        link.parentElement?.textContent?.trim()?.substring(0, 50)
      );
    });

    // Check for time
    const timeEl = firstRow.querySelector('relative-time');
    console.log(
      'Time element:',
      timeEl?.getAttribute('datetime'),
      timeEl?.textContent
    );

    // Check all text
    console.log('\nRow text:', firstRow.textContent.substring(0, 500));

    // Test regex
    const text = firstRow.textContent;
    const match = text.match(/opened\s+by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]*)/i);
    console.log('Regex match for "opened by":', match);
  }

  console.log('\n=== End Test ===');
}

testGitHubExtraction();

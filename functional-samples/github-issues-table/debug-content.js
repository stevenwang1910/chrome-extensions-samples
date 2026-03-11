// Run this in browser console on GitHub issues page to debug extraction
(function () {
  console.log('=== Debugging GitHub Issue Extraction ===');

  // Analyze the DOM structure
  function analyzeDOM() {
    console.log('\n--- DOM Analysis ---');

    // Check for issue rows
    const rows = document.querySelectorAll('div[data-testid="issue-row"]');
    console.log(`div[data-testid="issue-row"]: ${rows.length} elements`);

    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log('\nFirst row HTML snippet:');
      console.log(firstRow.innerHTML.substring(0, 2000));

      // Check for status elements
      console.log('\n--- Status Elements in first row ---');
      const statusSpans = firstRow.querySelectorAll('span[aria-label]');
      statusSpans.forEach((span, i) => {
        console.log(
          `Span ${i}: aria-label="${span.getAttribute('aria-label')}", text="${span.textContent.trim()}"`
        );
      });

      // Check for SVG icons (status indicators)
      console.log('\n--- SVG Icons in first row ---');
      const svgs = firstRow.querySelectorAll('svg');
      svgs.forEach((svg, i) => {
        const ariaLabel =
          svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby');
        console.log(
          `SVG ${i}: aria-label="${ariaLabel}", classes="${svg.getAttribute('class')}"`
        );
      });

      // Check for time elements
      console.log('\n--- Time Elements in first row ---');
      const timeEls = firstRow.querySelectorAll('relative-time');
      timeEls.forEach((time, i) => {
        console.log(
          `Time ${i}: datetime="${time.getAttribute('datetime')}", text="${time.textContent.trim()}"`
        );
      });

      // Check for all links in first row
      console.log('\n--- All Links in first row ---');
      const allLinks = firstRow.querySelectorAll('a');
      allLinks.forEach((link, i) => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim().substring(0, 50);
        console.log(`Link ${i}: href="${href}", text="${text}"`);
      });

      // Check for "opened by" pattern
      console.log('\n--- Text Content Analysis ---');
      const rowText = firstRow.textContent;
      const openedByMatch = rowText.match(
        /opened\s+by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]*)/i
      );
      console.log(`"opened by" match:`, openedByMatch);

      // Look for specific metadata section
      console.log('\n--- Metadata Section ---');
      const metadata = firstRow.querySelector('div[id^="issue-"]');
      if (metadata) {
        console.log(
          'Metadata section found:',
          metadata.textContent.substring(0, 200)
        );
      }
    }
  }

  // Test extraction on first row
  function testExtraction() {
    console.log('\n--- Testing Extraction Logic ---');

    const rows = document.querySelectorAll('div[data-testid="issue-row"]');
    if (rows.length === 0) {
      console.log('No issue rows found');
      return;
    }

    const row = rows[0];

    // Test status extraction
    console.log('\nTesting Status Extraction:');

    // Method 1: aria-label span
    const statusSpan = row.querySelector(
      'span[aria-label*="Issue"], span[aria-label*="Pull"]'
    );
    if (statusSpan) {
      console.log(
        'Method 1 - aria-label span:',
        statusSpan.getAttribute('aria-label')
      );
    }

    // Method 2: Look for SVG with color
    const openSvg = row.querySelector('svg[aria-label="Open issue"]');
    const closedSvg = row.querySelector('svg[aria-label="Closed issue"]');
    console.log(
      'Method 2 - SVG aria-label: Open?',
      !!openSvg,
      'Closed?',
      !!closedSvg
    );

    // Method 3: Look for color classes
    const colorOpen = row.querySelector('.color-fg-success');
    const colorClosed = row.querySelector('.color-fg-done');
    console.log(
      'Method 3 - Color classes: Open?',
      !!colorOpen,
      'Closed?',
      !!colorClosed
    );

    // Test submitter extraction
    console.log('\nTesting Submitter Extraction:');

    // Method 1: Regex on text
    const rowText = row.textContent;
    const match = rowText.match(/opened\s+by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]*)/i);
    console.log('Method 1 - Regex match:', match);

    // Method 2: Look for user links near "opened by"
    const allLinks = row.querySelectorAll('a');
    console.log('Method 2 - Checking links:');
    for (let i = 0; i < allLinks.length; i++) {
      const link = allLinks[i];
      const href = link.getAttribute('href') || '';
      const text = link.textContent.trim();
      const parentText = link.parentElement?.textContent || '';

      if (parentText.includes('opened by') || parentText.includes('by')) {
        console.log(`  Link near "opened by": href=${href}, text=${text}`);
      }
    }

    // Method 3: Look for avatars
    console.log('Method 3 - Checking avatars:');
    const avatars = row.querySelectorAll('img');
    for (const avatar of avatars) {
      const alt = avatar.getAttribute('alt') || '';
      const src = avatar.getAttribute('src') || '';
      if (src.includes('avatars.githubusercontent.com')) {
        const parentLink = avatar.closest('a');
        const parentHref = parentLink?.getAttribute('href') || '';
        console.log(`  Avatar: alt=${alt}, parentHref=${parentHref}`);
      }
    }

    // Test date extraction
    console.log('\nTesting Date Extraction:');
    const timeEl = row.querySelector('relative-time');
    if (timeEl) {
      console.log('relative-time element:', {
        datetime: timeEl.getAttribute('datetime'),
        text: timeEl.textContent.trim(),
        title: timeEl.getAttribute('title')
      });
    }
  }

  // Run the analysis
  analyzeDOM();
  testExtraction();

  console.log('\n=== End Debug ===');
})();

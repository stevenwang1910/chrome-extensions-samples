// Run this in browser console on GitHub issues page
(function analyzeGitHubDOM() {
  console.log('=== Analyzing GitHub Issues DOM ===');

  // Look for issue rows
  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log('Issue rows found:', rows.length);

  if (rows.length > 0) {
    const firstRow = rows[0];
    console.log('\n=== First Row HTML (first 3000 chars) ===');
    console.log(firstRow.innerHTML.substring(0, 3000));

    console.log('\n=== Looking for submitter info ===');

    // Check for "opened by" text
    const text = firstRow.textContent;
    console.log('Row text snippet:', text.substring(0, 500));

    const openedByMatch = text.match(
      /opened\s+by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]*)/i
    );
    console.log('Regex match for submitter:', openedByMatch);

    // Check for user links
    const userLinks = firstRow.querySelectorAll(
      'a[data-hovercard-type="user"]'
    );
    console.log('User links found:', userLinks.length);
    userLinks.forEach((link, i) => {
      console.log(
        `User link ${i}:`,
        link.getAttribute('href'),
        link.textContent.trim()
      );
    });

    // Check for time elements
    const times = firstRow.querySelectorAll('relative-time, time');
    console.log('Time elements found:', times.length);
    times.forEach((t, i) => {
      console.log(`Time ${i}:`, t.getAttribute('datetime'), t.textContent);
    });

    // Check for status SVGs
    const svgs = firstRow.querySelectorAll('svg');
    console.log('SVGs found:', svgs.length);
    svgs.forEach((svg, i) => {
      console.log(
        `SVG ${i}:`,
        'aria-label:',
        svg.getAttribute('aria-label'),
        'class:',
        svg.getAttribute('class')?.substring(0, 50),
        'title:',
        svg.querySelector('title')?.textContent
      );
    });

    // Check for title link
    const titleLink = firstRow.querySelector('a[data-hovercard-type="issue"]');
    if (titleLink) {
      console.log(
        'Title link:',
        titleLink.getAttribute('href'),
        titleLink.textContent.trim()
      );
    }
  }

  // Also check the new structure
  console.log('\n=== Checking other selectors ===');
  const allBoxRows = document.querySelectorAll('.Box-row');
  console.log('Box rows:', allBoxRows.length);

  const issueCells = document.querySelectorAll('[id^="issue_"]');
  console.log('Elements with issue_ id:', issueCells.length);
})();

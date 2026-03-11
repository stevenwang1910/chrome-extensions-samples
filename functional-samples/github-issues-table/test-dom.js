// Run this in browser console on GitHub issues page to inspect DOM structure
(function inspectGitHubDOM() {
  console.log('=== GitHub DOM Inspection ===');

  // Find all potential issue rows
  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log(`Found ${rows.length} issue rows with data-testid`);

  if (rows.length > 0) {
    const firstRow = rows[0];
    console.log('First row HTML:', firstRow.innerHTML.substring(0, 2000));

    // Look for status elements
    console.log('Status elements:');
    const statusElements = firstRow.querySelectorAll('span, div, svg');
    for (let el of statusElements) {
      const aria = el.getAttribute('aria-label') || '';
      const cls = el.getAttribute('class') || '';
      if (
        aria.toLowerCase().includes('open') ||
        aria.toLowerCase().includes('closed') ||
        cls.toLowerCase().includes('state') ||
        cls.toLowerCase().includes('status')
      ) {
        console.log('  -', { aria, cls, text: el.textContent.trim() });
      }
    }

    // Look for user information
    console.log('User links/avatars:');
    const userLinks = firstRow.querySelectorAll('a');
    for (let link of userLinks) {
      const href = link.getAttribute('href') || '';
      const img = link.querySelector('img');
      if (img) {
        const alt = img.getAttribute('alt') || '';
        const src = img.getAttribute('src') || '';
        if (src.includes('avatar') || alt.startsWith('@')) {
          console.log('  - Avatar:', { href, alt, src });
        }
      }
    }

    // Look for time elements
    console.log('Time elements:');
    const timeEls = firstRow.querySelectorAll(
      'time, relative-time, [datetime]'
    );
    for (let t of timeEls) {
      console.log('  - Time:', {
        tag: t.tagName,
        datetime: t.getAttribute('datetime'),
        text: t.textContent.trim(),
        title: t.getAttribute('title')
      });
    }

    // Look for byline/author info
    console.log(
      'Text content snippet:',
      firstRow.textContent.substring(0, 500)
    );
  }

  // Also check for the new react-based structure
  const allRows = document.querySelectorAll('div[class*="Box-row"]');
  console.log(`Found ${allRows.length} Box-row elements`);
})();

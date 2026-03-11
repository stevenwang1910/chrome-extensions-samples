// Run this in browser console on GitHub issues page
function analyzeGitHubDOM() {
  console.log('=== Analyzing GitHub DOM ===');

  const rows = document.querySelectorAll('div[data-testid="issue-row"]');
  console.log('Found rows:', rows.length);

  if (rows.length > 0) {
    const firstRow = rows[0];
    console.log('\n=== First Row HTML ===');
    console.log(firstRow.innerHTML.substring(0, 3000));

    console.log('\n=== User Links ===');
    const userLinks = firstRow.querySelectorAll(
      'a[data-hovercard-type="user"]'
    );
    userLinks.forEach((link, i) => {
      console.log(
        i,
        'href:',
        link.getAttribute('href'),
        'text:',
        link.textContent.trim()
      );
    });

    console.log('\n=== SVGs ===');
    const svgs = firstRow.querySelectorAll('svg');
    svgs.forEach((svg, i) => {
      console.log(
        i,
        'aria-label:',
        svg.getAttribute('aria-label'),
        'class:',
        svg.getAttribute('class')
      );
    });

    console.log('\n=== Time Elements ===');
    const times = firstRow.querySelectorAll('relative-time, time');
    times.forEach((t, i) => {
      console.log(
        i,
        'datetime:',
        t.getAttribute('datetime'),
        'text:',
        t.textContent.trim()
      );
    });

    console.log('\n=== Metadata sections ===');
    const meta = firstRow.querySelectorAll('div[id^="issue-"]');
    console.log('Meta sections:', meta.length);
  }
}
analyzeGitHubDOM();

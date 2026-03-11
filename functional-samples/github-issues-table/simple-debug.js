// Run this in browser console on GitHub issues page
function simpleDebug() {
  console.log('=== SIMPLE DEBUG ===\n');

  // Get first issue row
  const row = document.querySelector('[data-testid="issue-row"]');
  if (!row) {
    console.log('No issue row found!');
    return;
  }

  console.log('Row HTML:\n', row.innerHTML.substring(0, 8000));

  // Look for all elements with data-testid
  console.log('\n=== DATA TESTID ELEMENTS ===');
  row.querySelectorAll('[data-testid]').forEach((el) => {
    console.log(
      `  ${el.getAttribute('data-testid')}:`,
      el.textContent.substring(0, 60)
    );
  });

  // Look for meta info (opened by...)
  console.log('\n=== LOOKING FOR META INFO ===');
  const allSpans = row.querySelectorAll('span');
  allSpans.forEach((span, i) => {
    const text = span.textContent.trim();
    if (
      text.includes('opened') ||
      text.includes('by') ||
      text.includes(' ago')
    ) {
      console.log(`  Span ${i}:`, text);
    }
  });

  // Try to find the "opened by" area
  const metaArea = row.querySelector(
    '[data-testid="issue-meta"], .IssueListItem-label, .text-sm'
  );
  console.log('\nMeta area:', metaArea?.textContent);

  // Look for any element containing "opened"
  console.log('\n=== ELEMENTS WITH "opened" ===');
  const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.includes('opened')) {
      console.log('  Found "opened" in:', node.textContent);
      console.log('  Parent:', node.parentElement);
    }
  }
}

// Run it
simpleDebug();

// Run this in Chrome DevTools console on GitHub issues page
function debugGitHubIssues() {
  console.log('=== GITHUB ISSUES DEBUG ===\n');

  // Find all possible issue rows
  const selectors = [
    'div[data-testid="issue-row"]',
    'div[data-testid="pull-request-row"]',
    'div.Box-row',
    'div[class*="react-issue-row"]'
  ];

  let rows = [];
  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      console.log(`✅ Found ${found.length} rows with selector: ${selector}`);
      rows = Array.from(found);
      break;
    }
  }

  if (rows.length === 0) {
    console.log('❌ No rows found! Dumping body HTML snippet:');
    console.log(document.body.innerHTML.substring(0, 5000));
    return;
  }

  // Analyze first row
  const firstRow = rows[0];
  console.log('\n=== FIRST ROW ANALYSIS ===\n');

  // Check all SVGs for status
  console.log('📊 SVG Status Icons:');
  const svgs = firstRow.querySelectorAll('svg');
  svgs.forEach((svg, i) => {
    console.log(`  SVG ${i}:`, {
      'aria-label': svg.getAttribute('aria-label'),
      class: svg.getAttribute('class'),
      title: svg.querySelector('title')?.textContent
    });
  });

  // Check all user links
  console.log('\n👤 User Links:');
  const userLinks = firstRow.querySelectorAll('a[data-hovercard-type="user"]');
  userLinks.forEach((link, i) => {
    console.log(`  User ${i}:`, {
      href: link.getAttribute('href'),
      text: link.textContent.trim(),
      parentText: link.parentElement?.textContent?.trim()?.substring(0, 100)
    });
  });

  // Check all links with hovercard
  console.log('\n🔗 All Links with hovercard:');
  const allHoverLinks = firstRow.querySelectorAll('a[data-hovercard-type]');
  allHoverLinks.forEach((link, i) => {
    console.log(`  Link ${i}:`, {
      type: link.getAttribute('data-hovercard-type'),
      href: link.getAttribute('href'),
      text: link.textContent.trim()
    });
  });

  // Check time elements
  console.log('\n⏰ Time Elements:');
  const times = firstRow.querySelectorAll('relative-time, time, [datetime]');
  times.forEach((t, i) => {
    console.log(`  Time ${i}:`, {
      tag: t.tagName,
      datetime: t.getAttribute('datetime'),
      text: t.textContent.trim()
    });
  });

  // Look for "opened by" text
  console.log('\n🔍 Text content search for "opened":');
  const allText = firstRow.textContent;
  const openedMatch = allText.match(/opened\s+by\s+@?([a-zA-Z0-9_-]+)/i);
  console.log('  "opened by" match:', openedMatch);

  // Look for avatars
  console.log('\n🖼️ Avatars:');
  const avatars = firstRow.querySelectorAll('img[src*="avatars"]');
  avatars.forEach((img, i) => {
    const parentLink = img.closest('a');
    console.log(`  Avatar ${i}:`, {
      imgSrc: img.getAttribute('src')?.substring(0, 50),
      parentHref: parentLink?.getAttribute('href')
    });
  });

  // Now test our extraction logic
  console.log('\n=== TESTING EXTRACTION ===\n');

  function testExtract(row) {
    const issue = {
      id: '',
      title: '',
      submitter: 'Unknown',
      submissionDate: 'Unknown',
      status: 'Open'
    };

    // ID and Title
    const issueLink = row.querySelector('a[data-hovercard-type="issue"]');
    if (issueLink) {
      const href = issueLink.getAttribute('href');
      issue.title = issueLink.textContent.trim();
      const idMatch = href.match(/\/issues\/(\d+)/);
      if (idMatch) issue.id = idMatch[1];
    }

    // Status - try different methods
    const statusSvg = row.querySelector('svg');
    if (statusSvg) {
      const aria = (statusSvg.getAttribute('aria-label') || '').toLowerCase();
      const cls = statusSvg.getAttribute('class') || '';
      const title =
        statusSvg.querySelector('title')?.textContent?.toLowerCase() || '';

      console.log('  Status check:', { aria, cls, title });

      if (
        aria.includes('closed') ||
        cls.includes('closed') ||
        title.includes('closed')
      ) {
        issue.status = 'Closed';
      } else if (
        aria.includes('open') ||
        cls.includes('open') ||
        title.includes('open')
      ) {
        issue.status = 'Open';
      }
    }

    // Submitter - try all methods
    const userLinks2 = row.querySelectorAll('a[data-hovercard-type="user"]');
    console.log('  All user links found:', userLinks2.length);
    for (const ul of userLinks2) {
      const href = ul.getAttribute('href');
      console.log('    Checking user link:', href);
      if (href && href.startsWith('/')) {
        const username = href.substring(1);
        if (username && !username.includes('/')) {
          issue.submitter = username;
          console.log('    Found submitter via user link:', username);
          break;
        }
      }
    }

    // Date
    const timeEl = row.querySelector('relative-time, time');
    if (timeEl) {
      const dt = timeEl.getAttribute('datetime');
      if (dt) {
        issue.submissionDate = new Date(dt).toLocaleDateString();
        console.log('  Found date via time element:', issue.submissionDate);
      }
    }

    return issue;
  }

  const testResult = testExtract(firstRow);
  console.log('\n📋 Extraction result:', testResult);

  // Show row HTML structure
  console.log('\n=== ROW HTML SNIPPET ===\n');
  console.log(firstRow.outerHTML.substring(0, 4000));
}

debugGitHubIssues();

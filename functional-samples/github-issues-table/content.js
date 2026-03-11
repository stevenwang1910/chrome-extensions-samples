(function () {
  if (window.GitHubIssuesTableLoaded) return;
  window.GitHubIssuesTableLoaded = true;

  console.log('=== GitHub Issues Table content script loaded ===');

  function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function getIssueRows() {
    console.log('🔍 Looking for issue rows...');

    const selectors = [
      'div[data-testid="issue-row"]',
      'div[data-tracking-id^="issue_"]',
      'div[data-tracking-id^="pull-request_"]',
      '.js-issue-row',
      '.react-draggable + div > div',
      'div[class*="TableRow-"]',
      'div[role="row"]'
    ];

    for (const selector of selectors) {
      const rows = document.querySelectorAll(selector);
      if (rows.length > 0) {
        const validRows = Array.from(rows).filter(
          (row) =>
            row.innerHTML.includes('/issues/') ||
            row.innerHTML.includes('/pull/') ||
            row.textContent.match(/#\d+/)
        );
        if (validRows.length > 0) {
          console.log(
            `✅ Found ${validRows.length} valid rows with selector: ${selector}`
          );
          return validRows;
        }
      }
    }

    console.log('⚠️ No standard rows found, trying fallback...');
    const allDivs = document.querySelectorAll('div');
    const fallbackRows = Array.from(allDivs).filter(
      (div) =>
        div.getAttribute('data-testid')?.includes('issue') ||
        div.querySelector('a[href*="/issues/"]') ||
        div.querySelector('a[href*="/pull/"]')
    );
    console.log(`Fallback found ${fallbackRows.length} rows`);
    return fallbackRows;
  }

  function extractFromRow(row) {
    const issue = {
      id: '',
      title: '',
      url: '',
      submitter: 'Unknown',
      submissionDate: 'Unknown',
      status: 'Unknown'
    };

    console.log('\n--- Processing Row ---');
    const rowText = cleanText(row.textContent);
    console.log('Row text:', rowText.substring(0, 200));

    const titleSelectors = [
      'a[data-testid="issue-title-link"]',
      'a[id^="issue_"]',
      'a[href*="/issues/"]:not([href*="/issues/comment"])',
      'a[href*="/pull/"]:not([href*="/pull/comment"])'
    ];

    for (const selector of titleSelectors) {
      const titleLink = row.querySelector(selector);
      if (titleLink) {
        const href = titleLink.getAttribute('href') || '';
        const idMatch = href.match(/\/(issues|pull)\/(\d+)/);
        if (idMatch) {
          issue.id = idMatch[2];
          issue.title = cleanText(titleLink.textContent);
          issue.url = 'https://github.com' + href;
          console.log(
            '📌 Title/ID:',
            issue.id,
            '-',
            issue.title.substring(0, 50)
          );
          break;
        }
      }
    }

    if (!issue.id) {
      const idMatch = rowText.match(/#(\d+)/);
      if (idMatch) {
        issue.id = idMatch[1];
        const allLinks = row.querySelectorAll('a');
        for (const link of allLinks) {
          const href = link.getAttribute('href') || '';
          if (
            href.includes('/issues/' + issue.id) ||
            href.includes('/pull/' + issue.id)
          ) {
            issue.title = cleanText(link.textContent);
            issue.url = 'https://github.com' + href;
            break;
          }
        }
      }
    }

    console.log('\n--- Status Detection ---');

    const statusContainer = row.querySelector(
      'div[class*="StateLabel-"], span[class*="StateLabel-"]'
    );
    if (statusContainer) {
      const statusText = cleanText(statusContainer.textContent);
      console.log('StateLabel text:', statusText);
      if (statusText.match(/open/i)) issue.status = 'Open';
      else if (statusText.match(/closed/i)) issue.status = 'Closed';
      else if (statusText.match(/merged/i)) issue.status = 'Merged';
      else if (statusText.match(/draft/i)) issue.status = 'Draft';
    }

    const svgs = row.querySelectorAll('svg');
    for (const svg of svgs) {
      const useEl = svg.querySelector('use');
      const href = useEl
        ? useEl.getAttribute('xlink:href') || useEl.getAttribute('href') || ''
        : '';
      const ariaLabel = svg.getAttribute('aria-label') || '';

      console.log('SVG:', href, ariaLabel);

      if (issue.status === 'Unknown') {
        if (href.includes('issue-opened') || ariaLabel.match(/open/i)) {
          issue.status = 'Open';
        } else if (
          href.includes('issue-closed') ||
          href.includes('skip') ||
          ariaLabel.match(/closed/i)
        ) {
          issue.status = 'Closed';
        } else if (
          href.includes('git-merge') ||
          href.includes('merge') ||
          ariaLabel.match(/merge/i)
        ) {
          issue.status = 'Merged';
        } else if (href.includes('pull-request')) {
          issue.status = 'PR';
        }
      }
    }

    const ariaLabel = row.getAttribute('aria-label') || '';
    if (ariaLabel && issue.status === 'Unknown') {
      console.log('Row aria-label:', ariaLabel);
      if (ariaLabel.toLowerCase().includes('open')) issue.status = 'Open';
      else if (ariaLabel.toLowerCase().includes('closed'))
        issue.status = 'Closed';
      else if (ariaLabel.toLowerCase().includes('merged'))
        issue.status = 'Merged';
    }

    if (rowText.includes('Opened') && issue.status === 'Unknown')
      issue.status = 'Open';
    if (rowText.includes('Closed') && issue.status === 'Unknown')
      issue.status = 'Closed';

    console.log('Final status:', issue.status);

    console.log('\n--- Submitter Detection ---');

    const openedPattern =
      /opened\s+(?:this\s+issue|this\s+PR|the\s+PR|)\s*(?:about|on|)\s*(?:\d+\s+\w+|)\s*ago\s*by\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]{0,39})/i;
    const byPattern = /\sby\s+@?([a-zA-Z0-9][a-zA-Z0-9_-]{0,39})(?:\s|$)/i;
    const authorPattern = /author:\s*@?([a-zA-Z0-9][a-zA-Z0-9_-]{1,39})/i;

    let match =
      rowText.match(openedPattern) ||
      rowText.match(byPattern) ||
      rowText.match(authorPattern);
    if (match) {
      issue.submitter = match[1];
      console.log('✅ Found submitter via regex:', issue.submitter);
    }

    const userLinks = row.querySelectorAll(
      'a[data-hovercard-type="user"], a[href^="/"][data-hovercard-url*="/users/"]'
    );
    console.log('User links found:', userLinks.length);

    const hovercards = row.querySelectorAll('[data-hovercard-url*="/users/"]');
    for (const hc of hovercards) {
      const text = cleanText(hc.textContent);
      if (text && text.length > 0 && text.length < 40 && !text.includes(' ')) {
        const textBefore = getTextBeforeNode(row, hc);
        if (textBefore.match(/\sby\s*$/) || textBefore.match(/opened.*$/)) {
          issue.submitter = text;
          console.log(
            '✅ Found submitter via hovercard position:',
            issue.submitter
          );
          break;
        }
      }
    }

    for (const link of userLinks) {
      const linkText = cleanText(link.textContent);
      if (!linkText || linkText.includes(' ')) continue;

      const href = link.getAttribute('href') || '';
      const textBeforeLink = getTextBeforeNode(row, link);
      console.log(
        'User link:',
        linkText,
        'Text before:',
        textBeforeLink.substring(Math.max(0, textBeforeLink.length - 30))
      );

      if (
        textBeforeLink.match(/\sby\s*$/) ||
        textBeforeLink.match(/opened.*$/) ||
        textBeforeLink.match(/on\s*$/)
      ) {
        issue.submitter = linkText;
        console.log('✅ Found submitter via link position:', issue.submitter);
        break;
      }
    }

    if (issue.submitter === 'Unknown') {
      const allLinks = row.querySelectorAll('a[href^="/"]');
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        const text = cleanText(link.textContent);
        if (
          href &&
          !href.includes('/') &&
          text &&
          !text.includes(' ') &&
          text.length > 1
        ) {
          const textBefore = getTextBeforeNode(row, link);
          if (textBefore.match(/\sby\s*$/)) {
            issue.submitter = text;
            console.log(
              '✅ Found submitter via fallback link:',
              issue.submitter
            );
            break;
          }
        }
      }
    }

    console.log('Final submitter:', issue.submitter);

    console.log('\n--- Date Detection ---');

    const timeSelectors = [
      'relative-time',
      'time-ago',
      'time',
      '[data-testid="created-at"]',
      'span[title*="202"]',
      'span[title*="203"]'
    ];

    for (const selector of timeSelectors) {
      const timeEl = row.querySelector(selector);
      if (timeEl) {
        let datetime =
          timeEl.getAttribute('datetime') || timeEl.getAttribute('title');
        if (!datetime && timeEl.textContent.match(/\d{4}/)) {
          datetime = timeEl.textContent;
        }

        if (datetime) {
          const date = new Date(datetime);
          if (!isNaN(date.getTime())) {
            issue.submissionDate = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            console.log('Date from time element:', issue.submissionDate);
            break;
          } else {
            issue.submissionDate = cleanText(timeEl.textContent);
            console.log('Date from text:', issue.submissionDate);
            break;
          }
        }
      }
    }

    if (issue.submissionDate === 'Unknown') {
      const datePattern =
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i;
      const dateMatch = rowText.match(datePattern);
      if (dateMatch) {
        issue.submissionDate = dateMatch[0];
        console.log('Date from text pattern:', issue.submissionDate);
      }
    }

    console.log('Final date:', issue.submissionDate);
    console.log('\n✅ Complete issue:', issue);

    return issue.id ? issue : null;
  }

  function getTextBeforeNode(container, node) {
    const range = document.createRange();
    range.setStart(container, 0);
    range.setEnd(node, 0);
    return cleanText(range.toString());
  }

  function extractAllIssues() {
    const rows = getIssueRows();
    const issues = [];

    for (const row of rows) {
      const issue = extractFromRow(row);
      if (issue) {
        issues.push(issue);
      }
    }

    console.log(`\n🎉 Extracted ${issues.length} issues total`);
    return issues;
  }

  function waitForIssues() {
    return new Promise((resolve) => {
      let issues = extractAllIssues();
      if (issues.length > 0) {
        resolve(issues);
        return;
      }

      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        issues = extractAllIssues();

        if (issues.length > 0 || attempts >= 10) {
          clearInterval(interval);
          resolve(issues);
        }
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        resolve(extractAllIssues());
      }, 5000);
    });
  }

  window.debugGitHubIssues = function () {
    console.log('\n========== DEBUG MODE ==========\n');
    const rows = getIssueRows();

    if (rows.length > 0) {
      console.log('\n📄 First row HTML preview:');
      console.log(rows[0].innerHTML.substring(0, 4000));

      console.log('\n🔍 First row text:');
      console.log(cleanText(rows[0].textContent));

      console.log('\n🔍 All SVG icons in first row:');
      rows[0].querySelectorAll('svg').forEach((svg, i) => {
        const use = svg.querySelector('use');
        const href = use
          ? use.getAttribute('xlink:href') || use.getAttribute('href')
          : '';
        console.log(
          `  SVG ${i}:`,
          href,
          'aria:',
          svg.getAttribute('aria-label')
        );
      });
    }

    const issues = extractAllIssues();
    console.log('\n📊 Final issues:', issues);
    return { rows, issues };
  };

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log('📨 Message received:', request.action);

    if (request.action === 'getIssues') {
      waitForIssues().then((issues) => {
        sendResponse({ issues, success: true });
      });
      return true;
    }

    if (request.action === 'ping') {
      sendResponse({ pong: true, ready: true });
      return true;
    }

    if (request.action === 'debug') {
      const rows = getIssueRows();
      sendResponse({
        debug: {
          rows: rows.length,
          url: window.location.href,
          sampleText: rows.length > 0 ? cleanText(rows[0].textContent) : 'none',
          sampleHtml:
            rows.length > 0 ? rows[0].innerHTML.substring(0, 5000) : 'none'
        }
      });
      return true;
    }
  });

  console.log(
    '✅ Content script ready! Type debugGitHubIssues() in console to debug.'
  );
})();

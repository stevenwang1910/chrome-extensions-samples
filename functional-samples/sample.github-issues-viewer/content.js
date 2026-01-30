function extractIssuesFromPage() {
  const issues = [];
  const issueElements = document.querySelectorAll('div[data-id]');

  for (const element of issueElements) {
    try {
      const idElement = element.querySelector('a[id^="issue_"]');
      if (!idElement) continue;

      const issueId = idElement.id.replace('issue_', '');
      
      const titleElement = element.querySelector('a[id^="issue_"] + div a, a[data-hovercard-type="issue"]');
      let title = '';
      let url = '';
      
      if (titleElement) {
        title = titleElement.textContent.trim();
        url = titleElement.href;
      }

      const statusElement = element.querySelector('.State');
      let status = 'Open';
      if (statusElement) {
        const statusText = statusElement.textContent.trim().toLowerCase();
        if (statusText.includes('closed') || statusText.includes('merged')) {
          status = 'Closed';
        }
      }

      const metaElement = element.querySelector('span.opened-by');
      let author = '';
      let date = '';

      if (metaElement) {
        const authorLink = metaElement.querySelector('a');
        if (authorLink) {
          author = authorLink.textContent.trim();
        }

        const timeElement = metaElement.querySelector('relative-time');
        if (timeElement) {
          date = timeElement.getAttribute('title') || timeElement.textContent.trim();
        }
      }

      if (issueId && title) {
        issues.push({
          number: parseInt(issueId),
          title: title,
          url: url,
          author: author,
          date: date,
          status: status
        });
      }
    } catch (e) {
      console.log('Error extracting issue:', e);
    }
  }

  return issues;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIssues') {
    const issues = extractIssuesFromPage();
    sendResponse({ issues: issues });
  }
  return true;
});
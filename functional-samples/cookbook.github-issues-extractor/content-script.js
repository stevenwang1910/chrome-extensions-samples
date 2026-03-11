// Function to extract issues data from the GitHub page
function extractIssuesData() {
  const issues = [];
  const issueElements = document.querySelectorAll(
    '.js-navigation-container .js-issue-row'
  );

  issueElements.forEach((element) => {
    // Extract issue ID
    const idElement = element.querySelector('.opened-by');
    const idMatch = idElement ? idElement.textContent.match(/#(\d+)/) : null;
    const issueId = idMatch ? idMatch[1] : '';

    // Extract title
    const titleElement = element.querySelector('.js-navigation-open');
    const title = titleElement ? titleElement.textContent.trim() : '';

    // Extract submitter
    const submitterElement = element.querySelector('.opened-by a');
    const submitter = submitterElement
      ? submitterElement.textContent.trim()
      : '';

    // Extract date
    const dateElement = element.querySelector('relative-time');
    const date = dateElement ? dateElement.getAttribute('datetime') : '';

    // Extract status
    const statusElement = element.querySelector('.State');
    const status = statusElement ? statusElement.textContent.trim() : '';

    issues.push({
      id: issueId,
      title: title,
      submitter: submitter,
      date: date,
      status: status
    });
  });

  return issues;
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractIssues') {
    const issues = extractIssuesData();
    sendResponse({ issues: issues });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const loadingElement = document.getElementById('loading');
  const errorElement = document.getElementById('error');
  const issuesBody = document.getElementById('issuesBody');

  // Show loading state
  loadingElement.style.display = 'block';

  // Query the active tab and send message to content script
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: 'extractIssues' },
      function (response) {
        loadingElement.style.display = 'none';

        if (chrome.runtime.lastError) {
          errorElement.textContent =
            'Error: ' + chrome.runtime.lastError.message;
          errorElement.style.display = 'block';
          return;
        }

        if (response && response.issues) {
          displayIssues(response.issues);
        } else {
          errorElement.textContent = 'No issues data received.';
          errorElement.style.display = 'block';
        }
      }
    );
  });

  function displayIssues(issues) {
    if (issues.length === 0) {
      errorElement.textContent = 'No issues found on this page.';
      errorElement.style.display = 'block';
      return;
    }

    issues.forEach((issue) => {
      const row = document.createElement('tr');

      // Format date
      const date = new Date(issue.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Status class
      const statusClass =
        issue.status.toLowerCase() === 'open' ? 'status-open' : 'status-closed';

      row.innerHTML = `
        <td>#${issue.id}</td>
        <td>${issue.title}</td>
        <td>${issue.submitter}</td>
        <td>${formattedDate}</td>
        <td class="${statusClass}">${issue.status}</td>
      `;

      issuesBody.appendChild(row);
    });
  }
});

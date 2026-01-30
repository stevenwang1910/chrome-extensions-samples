// GitHub Issues Extractor Content Script
// This script extracts issues information from GitHub issues page

(function() {
  // Function to extract issues data from the page
  function extractIssuesData() {
    const issues = [];
    
    // Try different selectors for issue elements
    let issueElements = document.querySelectorAll('.js-issue-row');
    
    // If no elements found with the first selector, try alternative selectors
    if (issueElements.length === 0) {
      issueElements = document.querySelectorAll('[data-testid="issue-row"]');
    }
    
    if (issueElements.length === 0) {
      issueElements = document.querySelectorAll('.js-navigation-item');
    }
    
    if (issueElements.length === 0) {
      issueElements = document.querySelectorAll('li[id^="issue_"]');
    }
    
    console.log('Found issue elements:', issueElements.length);
    
    issueElements.forEach(issueElement => {
      try {
        // Extract issue ID from the URL
        let issueLink = issueElement.querySelector('.Link--primary');
        if (!issueLink) {
          issueLink = issueElement.querySelector('a[id^="issue_"]');
        }
        if (!issueLink) {
          issueLink = issueElement.querySelector('a[href*="/issues/"]');
        }
        
        const issueUrl = issueLink ? issueLink.getAttribute('href') : '';
        const issueIdMatch = issueUrl.match(/\/issues\/(\d+)/);
        const issueId = issueIdMatch ? issueIdMatch[1] : '';
        
        // Extract issue title
        const titleElement = issueLink;
        const title = titleElement ? titleElement.textContent.trim() : '';
        
        // Extract submitter information
        let authorElement = issueElement.querySelector('.opened-by a');
        if (!authorElement) {
          authorElement = issueElement.querySelector('[data-hovercard-type="user"]');
        }
        if (!authorElement) {
          authorElement = issueElement.querySelector('a[href*="/"][data-hovercard-type="user"]');
        }
        const author = authorElement ? authorElement.textContent.trim() : '';
        
        // Extract submission date
        let relativeTimeElement = issueElement.querySelector('relative-time');
        if (!relativeTimeElement) {
          relativeTimeElement = issueElement.querySelector('time-ago');
        }
        if (!relativeTimeElement) {
          relativeTimeElement = issueElement.querySelector('time');
        }
        const submittedDate = relativeTimeElement ? 
          (relativeTimeElement.getAttribute('datetime') || 
           relativeTimeElement.getAttribute('title') || 
           relativeTimeElement.textContent) : '';
        
        // Extract status (Open/Closed)
        let status = 'Open'; // Default status
        
        // Check if issue is closed by looking for the closed icon or status text
        if (issueElement.querySelector('.octicon-issue-closed') || 
            issueElement.querySelector('[title*="Closed"]') ||
            issueElement.querySelector('text-danger') ||
            issueElement.textContent.includes('Closed')) {
          status = 'Closed';
        }
        
        // Add extracted data to our issues array
        if (issueId && title) {
          issues.push({
            id: issueId,
            title: title,
            author: author,
            submittedDate: submittedDate,
            status: status
          });
        }
      } catch (error) {
        console.error('Error extracting issue data:', error);
      }
    });
    
    return issues;
  }
  
  // Function to save extracted data to chrome.storage
  function saveIssuesData(issues) {
    chrome.storage.local.set({ 
      githubIssues: issues,
      lastUpdated: new Date().toISOString()
    }, function() {
      console.log('Issues data saved:', issues.length, 'issues extracted');
    });
  }
  
  // Extract and save data when the page loads
  function extractAndSaveData() {
    const issues = extractIssuesData();
    saveIssuesData(issues);
  }
  
  // Initial extraction
  setTimeout(extractAndSaveData, 2000); // Wait for page to fully load
  
  // Also extract data when navigating through pagination
  const observer = new MutationObserver(function(mutations) {
    let shouldExtract = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        // Check if issue rows were added
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for various possible issue row containers
            if (node.classList.contains('js-issue-row') || 
                node.classList.contains('js-navigation-item') ||
                node.getAttribute('data-testid') === 'issue-row' ||
                node.id && node.id.startsWith('issue_') ||
                node.querySelector && (
                  node.querySelector('.js-issue-row') || 
                  node.querySelector('[data-testid="issue-row"]') ||
                  node.querySelector('.js-navigation-item') ||
                  node.querySelector('li[id^="issue_"]')
                )) {
              shouldExtract = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldExtract) {
      setTimeout(extractAndSaveData, 1000); // Small delay to ensure all elements are loaded
    }
  });
  
  // Start observing various possible containers
  let issueListContainer = document.querySelector('.js-issue-list');
  if (!issueListContainer) {
    issueListContainer = document.querySelector('.issues-listing');
  }
  if (!issueListContainer) {
    issueListContainer = document.querySelector('[data-testid="issue-list"]');
  }
  if (!issueListContainer) {
    issueListContainer = document.querySelector('main');
  }
  if (!issueListContainer) {
    issueListContainer = document.body;
  }
  
  if (issueListContainer) {
    observer.observe(issueListContainer, { 
      childList: true, 
      subtree: true 
    });
  }
})();
function loadIssues() {
  console.log('loadIssues called');
  document.getElementById('loading').style.display = 'block';
  document.getElementById('content').style.display = 'none';
  document.getElementById('debug').style.display = 'none';
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    console.log('Current tab:', tab ? tab.url : 'No tab');
    
    if (!tab || !tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page';
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      console.log('Script execution results:', results);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      const issues = results[0].result;
      console.log('Extracted issues:', issues.length);
      
      const tbody = document.querySelector('#issuesTable tbody');
      tbody.innerHTML = '';
      
      // Show debug info
      const debugDiv = document.getElementById('debug');
      const debugLog = document.getElementById('debugLog');
      debugLog.innerHTML = '<pre>' + JSON.stringify(issues, null, 2) + '</pre>';
      debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No issues found</td></tr>';
        return;
      }
      
      issues.forEach(issue => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = issue.id;
        row.insertCell(1).textContent = issue.status;
        row.insertCell(2).textContent = issue.title;
        row.insertCell(3).textContent = issue.author;
        row.insertCell(4).textContent = issue.date;
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadIssues();
  
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    refreshButton.addEventListener('click', function() {
      loadIssues();
    });
  }
});

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Approach 1: Extract from React embedded data (current GitHub approach)
  const embeddedDataScript = document.querySelector('script[type="application/json"][data-target="react-app.embeddedData"]');
  
  if (embeddedDataScript) {
    console.log('Found embedded data script');
    try {
      const embeddedData = JSON.parse(embeddedDataScript.textContent);
      
      // Check if payload has the issue data structure
      if (embeddedData.payload && embeddedData.payload.preloadedQueries) {
        console.log('Found preloadedQueries:', embeddedData.payload.preloadedQueries.length);
        
        // Iterate through preloaded queries to find issue data
        embeddedData.payload.preloadedQueries.forEach(query => {
          if (query.result && query.result.data && query.result.data.repository) {
            const repo = query.result.data.repository;
            
            // Check if search contains issues
            if (repo.search && repo.search.edges) {
              console.log('Found search edges:', repo.search.edges.length);
              
              repo.search.edges.forEach(edge => {
                if (edge.node && edge.node.__typename === 'Issue') {
                  const issue = edge.node;
                  issues.push({
                    id: '#' + issue.number,
                    status: issue.state === 'OPEN' ? 'Open' : 'Closed',
                    title: issue.title,
                    author: issue.author ? issue.author.login : 'Unknown',
                    date: issue.createdAt ? issue.createdAt.split('T')[0] : 'Unknown'
                  });
                }
              });
            }
            
            // Also check pinned issues
            if (repo.pinnedIssues && repo.pinnedIssues.nodes) {
              console.log('Found pinned issues:', repo.pinnedIssues.nodes.length);
              
              repo.pinnedIssues.nodes.forEach(issue => {
                if (issue && issue.__typename === 'Issue') {
                  issues.push({
                    id: '#' + issue.number,
                    status: issue.state === 'OPEN' ? 'Open' : 'Closed',
                    title: issue.title,
                    author: issue.author ? issue.author.login : 'Unknown',
                    date: issue.createdAt ? issue.createdAt.split('T')[0] : 'Unknown'
                  });
                }
              });
            }
          }
        });
      }
      
      console.log('Found', issues.length, 'issues from embedded data');
    } catch (error) {
      console.error('Error parsing embedded data:', error);
    }
  }
  
  // If no issues found from embedded data, try DOM approach (fallback)
  if (issues.length === 0) {
    console.log('No issues from embedded data, trying DOM approach');
    
    const selectors = [
      'div.js-issue-row',
      'div.js-discussion-item',
      'div.issue-list-item',
      'div[id^="issue_"]',
      'article[id^="issue_"]',
      'ul.js-issue-association-list li',
      'div[data-hovercard-type="issue"]'
    ];
    
    let allElements = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      console.log(`Found ${elements.length} elements for selector: ${selector}`);
      allElements = allElements.concat(Array.from(elements));
    });
    
    const uniqueElements = [...new Set(allElements)];
    console.log('Total unique elements:', uniqueElements.length);
    
    uniqueElements.forEach(element => {
      const titleElement = 
        element.querySelector('a.js-issue-title') || 
        element.querySelector('a[data-hovercard-type="issue"]') ||
        element.querySelector('a.issue-title') ||
        element.querySelector('a');
        
      const idElement = 
        element.querySelector('span.js-issue-number') ||
        element.querySelector('span.issue-number') ||
        element.querySelector('a[href*="/issues/"]');
        
      const statusElement = 
        element.querySelector('span.State') ||
        element.querySelector('span.label') ||
        element.querySelector('span[data-state]');
        
      const authorElement = 
        element.querySelector('a.author') ||
        element.querySelector('a[data-hovercard-type="user"]') ||
        element.querySelector('span.author a');
        
      const timeElement = 
        element.querySelector('time') ||
        element.querySelector('relative-time');
      
      console.log('Element check:', {title: !!titleElement, id: !!idElement, status: !!statusElement, author: !!authorElement, time: !!timeElement});
      
      if (titleElement && idElement) {
        let id = idElement.textContent ? idElement.textContent.trim() : '';
        if (!id && idElement.href) {
          id = idElement.href.match(/\d+/)[0];
        }
        
        issues.push({
          id: id,
          status: statusElement ? statusElement.textContent.trim() : 'Unknown',
          title: titleElement.textContent.trim(),
          author: authorElement ? authorElement.textContent.trim() : 'Unknown',
          date: timeElement ? (timeElement.getAttribute('datetime') || timeElement.getAttribute('title')).split('T')[0] : 'Unknown'
        });
      }
    });
  }
  
  console.log('Returning issues:', issues.length);
  return issues;
}

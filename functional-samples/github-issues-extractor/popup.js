document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const tab = tabs[0];
    if (!tab.url.includes('github.com') || !tab.url.includes('/issues')) {
      document.getElementById('loading').textContent = 'Please navigate to a GitHub issues page';
      return;
    }

    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      function: extractIssues
    }, function(results) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
      if (!results || !results[0] || !results[0].result) {
        document.querySelector('#issuesTable tbody').innerHTML = '<tr><td colspan="5">Error: Could not extract issues from this page</td></tr>';
        
        // Show debug info
        const debugDiv = document.getElementById('debug');
        const debugLog = document.getElementById('debugLog');
        debugLog.innerHTML = '<pre>Error: No results returned from script execution</pre>';
        debugDiv.style.display = 'block';
        return;
      }
      
      const result = results[0].result;
  let issues = [];
  let debugInfo = {};
  
  // Handle both old format (just array) and new format (object with issues and debugInfo)
  if (Array.isArray(result)) {
    issues = result;
  } else if (result && typeof result === 'object') {
    issues = result.issues || [];
    debugInfo = result.debugInfo || {};
  }
  
  const tbody = document.querySelector('#issuesTable tbody');
  
  // Show debug info
  const debugDiv = document.getElementById('debug');
  const debugLog = document.getElementById('debugLog');
  let debugContent = '<strong>Debug Info:</strong><br>';
  debugContent += 'URL: ' + (debugInfo.url || 'N/A') + '<br>';
  debugContent += 'Title: ' + (debugInfo.title || 'N/A') + '<br>';
  debugContent += 'Ready State: ' + (debugInfo.readyState || 'N/A') + '<br>';
  debugContent += 'Body Content Length: ' + (debugInfo.bodyContentLength || 0) + '<br>';
  debugContent += 'Has Status Text: ' + (debugInfo.hasStatusText || false) + '<br>';
  debugContent += 'Has Issue Text: ' + (debugInfo.hasIssueText || false) + '<br>';
  debugContent += '<strong>Found ' + issues.length + ' issues</strong><br>';
  
  if (debugInfo.allLinks && debugInfo.allLinks.length > 0) {
    debugContent += '<br><strong>Issue Links (first 10):</strong><br>';
    debugInfo.allLinks.forEach(link => {
      debugContent += '- ' + link + '<br>';
    });
  }
  
  if (debugInfo.issueElements && debugInfo.issueElements.length > 0) {
    debugContent += '<br><strong>Issue Elements (first 5):</strong><br>';
    debugInfo.issueElements.forEach(el => {
      debugContent += '- ' + el.tagName + ' (id: ' + el.id + ', class: ' + el.className + ')<br>';
      debugContent += '  Text: ' + el.textContent + '<br>';
    });
  }
  
  if (issues.length > 0) {
    debugContent += '<br><strong>Extracted Issues:</strong><br>';
    debugContent += JSON.stringify(issues.slice(0, 3), null, 2) + (issues.length > 3 ? '\n\n... and ' + (issues.length - 3) + ' more' : '');
  }
  
  debugLog.innerHTML = '<pre>' + debugContent + '</pre>';
  debugDiv.style.display = 'block';
      
      if (issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No issues found on this page</td></tr>';
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
});

function extractIssues() {
  console.log('extractIssues called');
  const issues = [];
  
  // Collect debug information
  const debugInfo = {
    url: window.location.href,
    title: document.title,
    readyState: document.readyState,
    bodyContentLength: (document.body.textContent || '').length,
    hasStatusText: (document.body.textContent || '').includes('Status:'),
    hasIssueText: (document.body.textContent || '').includes('#') && (document.body.textContent || '').includes('In '),
    bodyTextSample: (document.body.textContent || '').substring(0, 1000),
    allLinks: Array.from(document.querySelectorAll('a')).map(a => a.href).filter(href => href.includes('/issues/')).slice(0, 10),
    issueElements: Array.from(document.querySelectorAll('[id*="issue"], [class*="issue"]')).map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      textContent: (el.textContent || '').substring(0, 100)
    })).slice(0, 5)
  };
  
  // Wait for content to be loaded
  function waitForContent(callback, maxAttempts = 10) {
    let attempts = 0;
    
    function checkContent() {
      attempts++;
      
      // Check if we have issue elements or if we've exceeded max attempts
      const issueElements = document.querySelectorAll('[id^="issue_"], .js-issue-row, .issue-list-item');
      const hasContent = issueElements.length > 0 || 
                        document.querySelector('.repository-content')?.textContent.includes('issues') ||
                        document.body.textContent.includes('Status:');
      
      if (hasContent || attempts >= maxAttempts) {
        callback();
      } else {
        setTimeout(checkContent, 500);
      }
    }
    
    checkContent();
  }
  
  // Main extraction logic
  function doExtraction() {
    console.log('Starting extraction...');
    
    // Approach 1: Try to extract from the text-based format shown in the example
    const bodyText = document.body.textContent || document.body.innerText || '';
    
    // Check if the page has the text-based format like "Status: Open.#1620 In GoogleChrome/chrome-extensions-samples;"
    if (bodyText.includes('Status:') && bodyText.includes('In GoogleChrome/chrome-extensions-samples;')) {
      console.log('Found text-based format, extracting with regex...');
      
      // Updated regex to match the actual format from the example
      const issueRegex = /Status:\s*([^\n.]+)\.?#(\d+)\s+In\s+([^;]+);\s*(?:·\s*([^\s]+)\s+opened\s+on\s+([^\n]+))?/g;
      
      let match;
      while ((match = issueRegex.exec(bodyText)) !== null) {
        const status = match[1].trim();
        const id = '#' + match[2].trim();
        const repository = match[3].trim();
        const author = match[4] ? match[4].trim() : 'Unknown';
        const date = match[5] ? match[5].trim() : 'Unknown';
        
        // Try to extract title from nearby text
        let title = `Issue ${id}`;
        
        // Look for a title after the issue number
        const afterMatch = bodyText.substring(match.index + match[0].length, match.index + match[0].length + 200);
        const titleMatch = afterMatch.match(/^([^\n]{10,})/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
        
        issues.push({
          id,
          status,
          title,
          author,
          date
        });
      }
      
      console.log(`Found ${issues.length} issues using text-based extraction`);
    }
    
    // Approach 2: If no issues found with text approach, try modern GitHub React-based issue list
    if (issues.length === 0) {
      console.log('Trying modern GitHub React-based extraction...');
      
      const modernIssueItems = document.querySelectorAll('[id^="issue_"], .js-issue-row, .issue-list-item');
      console.log('Found modern issue items:', modernIssueItems.length);
      
      modernIssueItems.forEach(item => {
        try {
          // Extract issue number
          const numberElement = item.querySelector('.js-issue-number, [data-hovercard-type="issue"]');
          let id = '';
          if (numberElement) {
            const numberText = numberElement.textContent.trim();
            id = '#' + numberText.replace('#', '');
          }
          
          // Extract title
          const titleElement = item.querySelector('.js-issue-title, a[data-hovercard-type="issue"]');
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          // Extract status (open/closed)
          const statusElement = item.querySelector('.State, .IssueLabel');
          let status = 'Unknown';
          if (statusElement) {
            status = statusElement.textContent.trim();
          } else {
            // Check if it's a closed issue by looking for specific classes
            if (item.querySelector('.text-red, .closed')) {
              status = 'Closed';
            } else if (item.querySelector('.text-green, .open')) {
              status = 'Open';
            }
          }
          
          // Extract author
          const authorElement = item.querySelector('.author, [data-hovercard-type="user"]');
          const author = authorElement ? authorElement.textContent.trim() : '';
          
          // Extract date
          const timeElement = item.querySelector('time, relative-time');
          let date = '';
          if (timeElement) {
            date = timeElement.getAttribute('datetime') || 
                   timeElement.getAttribute('title') || 
                   timeElement.textContent.trim();
            // Format date to just show YYYY-MM-DD if it's a full datetime
            if (date.includes('T')) {
              date = date.split('T')[0];
            }
          }
          
          if (id && title) {
            issues.push({
              id,
              status,
              title,
              author,
              date
            });
          }
        } catch (e) {
          console.error('Error extracting from modern issue item:', e);
        }
      });
    }
    
    // Approach 3: If still no issues, try older selectors
    if (issues.length === 0) {
      console.log('Trying fallback selectors...');
      
      // Try multiple selectors to find issue elements
      const selectors = [
        'div.js-issue-row',
        'div.js-discussion-item',
        'div.issue-list-item',
        'ul.js-issue-association-list li',
        'div[data-hovercard-type="issue"]',
        'tr.js-issue-row'
      ];
      
      let allElements = [];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        console.log(`Found ${elements.length} elements for selector: ${selector}`);
        allElements = allElements.concat(Array.from(elements));
      });
      
      // Remove duplicates
      const uniqueElements = [...new Set(allElements)];
      console.log('Total unique elements:', uniqueElements.length);
      
      uniqueElements.forEach(element => {
        try {
          // Try multiple ways to find each element
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
          
          if (titleElement && idElement) {
            let id = idElement.textContent ? idElement.textContent.trim() : '';
            if (!id && idElement.href) {
              const match = idElement.href.match(/\/issues\/(\d+)/);
              if (match) id = '#' + match[1];
            }
            
            let status = statusElement ? statusElement.textContent.trim() : 'Unknown';
            if (!status || status === 'Unknown') {
              // Try to determine status from other indicators
              if (element.querySelector('.text-red, .closed, [title*="closed"]')) {
                status = 'Closed';
              } else if (element.querySelector('.text-green, .open, [title*="open"]')) {
                status = 'Open';
              }
            }
            
            let date = '';
            if (timeElement) {
              date = timeElement.getAttribute('datetime') || 
                     timeElement.getAttribute('title') || 
                     timeElement.textContent.trim();
              if (date.includes('T')) {
                date = date.split('T')[0];
              }
            }
            
            issues.push({
              id,
              status,
              title: titleElement.textContent.trim(),
              author: authorElement ? authorElement.textContent.trim() : 'Unknown',
              date
            });
          }
        } catch (e) {
          console.error('Error extracting from element:', e);
        }
      });
    }
    
    // Approach 4: Last resort - try to extract from page text with a more generic pattern
    if (issues.length === 0) {
      console.log('Trying generic text-based extraction...');
      
      // Try a more generic regex pattern
      const genericIssueRegex = /#(\d+)\s+In\s+([^;]+);/g;
      let match;
      const processedIds = new Set();
      
      while ((match = genericIssueRegex.exec(bodyText)) !== null) {
        const id = '#' + match[1];
        const repository = match[2];
        
        // Avoid duplicates
        if (processedIds.has(id)) continue;
        processedIds.add(id);
        
        // Try to find status before this issue
        const beforeText = bodyText.substring(0, match.index);
        const statusMatch = beforeText.match(/Status:\s*([^\n.]+)[.\n]*$/);
        const status = statusMatch ? statusMatch[1].trim() : 'Unknown';
        
        // Try to find author and date after this issue
        const afterText = bodyText.substring(match.index + match[0].length);
        const authorDateMatch = afterText.match(/·\s*([^\s]+)\s+opened\s+on\s+([^\n]+)/);
        const author = authorDateMatch ? authorDateMatch[1] : 'Unknown';
        const date = authorDateMatch ? authorDateMatch[2] : 'Unknown';
        
        issues.push({
          id,
          status,
          title: `Issue ${id}`,
          author,
          date
        });
      }
    }
    
    // Approach 5: Try to find any issue links in the page
    if (issues.length === 0) {
      console.log('Trying to find issue links...');
      
      const issueLinks = document.querySelectorAll('a[href*="/issues/"]');
      console.log(`Found ${issueLinks.length} issue links`);
      
      issueLinks.forEach(link => {
        try {
          const href = link.getAttribute('href');
          const match = href.match(/\/issues\/(\d+)/);
          if (match) {
            const id = '#' + match[1];
            const title = link.textContent.trim();
            
            // Avoid duplicates
            if (issues.some(issue => issue.id === id)) return;
            
            issues.push({
              id,
              status: 'Unknown',
              title: title || `Issue ${id}`,
              author: 'Unknown',
              date: 'Unknown'
            });
          }
        } catch (e) {
          console.error('Error extracting from issue link:', e);
        }
      });
    }
    
    // Approach 6: Try to find issues in the main content area
    if (issues.length === 0) {
      console.log('Trying to find issues in main content area...');
      
      // Try to find the main content area
      const mainContent = document.querySelector('.repository-content, main, #js-repo-pjax-container');
      if (mainContent) {
        const allText = mainContent.textContent || '';
        
        // Try to find patterns like "#1234" in the text
        const issueNumberRegex = /#(\d+)/g;
        let match;
        const processedIds = new Set();
        
        while ((match = issueNumberRegex.exec(allText)) !== null) {
          const id = '#' + match[1];
          
          // Avoid duplicates
          if (processedIds.has(id)) continue;
          processedIds.add(id);
          
          // Try to find a link with this issue number
          const issueLink = mainContent.querySelector(`a[href*="/issues/${match[1]}"]`);
          let title = `Issue ${id}`;
          
          if (issueLink) {
            title = issueLink.textContent.trim();
          }
          
          issues.push({
            id,
            status: 'Unknown',
            title,
            author: 'Unknown',
            date: 'Unknown'
          });
        }
      }
    }
    
    // Approach 7: Try to extract from any table rows
    if (issues.length === 0) {
      console.log('Trying to extract from table rows...');
      
      const tableRows = document.querySelectorAll('tr');
      console.log(`Found ${tableRows.length} table rows`);
      
      tableRows.forEach(row => {
        try {
          // Look for issue links in the row
          const issueLink = row.querySelector('a[href*="/issues/"]');
          if (issueLink) {
            const href = issueLink.getAttribute('href');
            const match = href.match(/\/issues\/(\d+)/);
            
            if (match) {
              const id = '#' + match[1];
              const title = issueLink.textContent.trim();
              
              // Avoid duplicates
              if (issues.some(issue => issue.id === id)) return;
              
              // Try to extract other information from the row
              const cells = row.querySelectorAll('td');
              let status = 'Unknown';
              let author = 'Unknown';
              let date = 'Unknown';
              
              // Try to find status in the row
              const statusElement = row.querySelector('.State, .label, [class*="status"]');
              if (statusElement) {
                status = statusElement.textContent.trim();
              }
              
              // Try to find author in the row
              const authorElement = row.querySelector('.author, [data-hovercard-type="user"]');
              if (authorElement) {
                author = authorElement.textContent.trim();
              }
              
              // Try to find date in the row
              const timeElement = row.querySelector('time, relative-time');
              if (timeElement) {
                date = timeElement.getAttribute('datetime') || 
                       timeElement.getAttribute('title') || 
                       timeElement.textContent.trim();
                if (date.includes('T')) {
                  date = date.split('T')[0];
                }
              }
              
              issues.push({
                id,
                status,
                title,
                author,
                date
              });
            }
          }
        } catch (e) {
          console.error('Error extracting from table row:', e);
        }
      });
    }
    
    // Approach 8: Last resort - try to find any element with issue number in its text
    if (issues.length === 0) {
      console.log('Trying to find any element with issue number...');
      
      const allElements = document.querySelectorAll('*');
      const processedIds = new Set();
      
      allElements.forEach(element => {
        try {
          const text = element.textContent || '';
          const match = text.match(/#(\d+)/);
          
          if (match && !processedIds.has('#' + match[1])) {
            processedIds.add('#' + match[1]);
            
            // Check if this element or its children have a link to the issue
            const issueLink = element.querySelector(`a[href*="/issues/${match[1]}"]`) || 
                             (element.tagName === 'A' && element.getAttribute('href')?.includes(`/issues/${match[1]}`) ? element : null);
            
            if (issueLink) {
              const id = '#' + match[1];
              const title = issueLink.textContent.trim();
              
              issues.push({
                id,
                status: 'Unknown',
                title: title || `Issue ${id}`,
                author: 'Unknown',
                date: 'Unknown'
              });
            }
          }
        } catch (e) {
          // Ignore errors for this approach
        }
      });
    }
    
    console.log('Returning issues:', issues.length);
    
    // Add debug information to the result
    return {
      issues,
      debugInfo
    };
  }
  
  // Start the extraction process
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForContent(doExtraction));
  } else {
    waitForContent(doExtraction);
  }
}
